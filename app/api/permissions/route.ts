import { NextRequest, NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase/admin';
import {
  SYSTEM_ROLES,
  normalizeRole,
  isValidRole,
  type SystemRole
} from '@/lib/auth/roles';
import {
  SYSTEM_PERMISSIONS,
  ALL_PERMISSION_IDS,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_CATEGORIES
} from '@/lib/auth/permissions';
import { requireSuperAdminCaller } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/permissions
 * Fetches all active role permissions from Firestore (with baseline fallback).
 */
export async function GET() {
  try {
    const rolePermissions: Record<SystemRole, string[]> = { ...DEFAULT_ROLE_PERMISSIONS };

    if (isFirebaseConfigured) {
      try {
        const snapshot = await db.collection('role_permissions').get();
      if (!snapshot.empty) {
        snapshot.forEach((doc: any) => {
          const roleKey = normalizeRole(doc.id);
          const data = doc.data();
          if (data && Array.isArray(data.permissions)) {
            // Superadmin always retains all permissions
            if (roleKey === 'superadmin') {
              rolePermissions.superadmin = [...ALL_PERMISSION_IDS];
            } else {
              rolePermissions[roleKey] = data.permissions.filter((p: string) =>
                ALL_PERMISSION_IDS.includes(p)
              );
            }
          }
        });
      }
    } catch (dbErr) {
      console.warn('Firestore fetch for role_permissions failed, using defaults:', dbErr);
    }
  }

    return NextResponse.json({
      rolePermissions,
      availablePermissions: SYSTEM_PERMISSIONS,
      categories: PERMISSION_CATEGORIES,
      roles: SYSTEM_ROLES
    });
  } catch (err: any) {
    console.error('Error fetching role permissions:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch permissions' }, { status: 500 });
  }
}

/**
 * POST /api/permissions
 * Updates permissions for a specific role or multiple roles.
 * Body can be:
 * 1. { role: 'teacher', permissions: ['courses.view', 'grades.edit', ...] }
 * 2. { rolePermissions: { teacher: [...], student: [...] } }
 */
export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireSuperAdminCaller(req);
    if ('errorResponse' in authCheck) {
      return authCheck.errorResponse;
    }

    const body = await req.json();
    const now = new Date().toISOString();

    // 1. Single Role Update
    if (body.role) {
      const targetRole = normalizeRole(body.role);
      if (!isValidRole(targetRole)) {
        return NextResponse.json(
          { error: `Invalid role "${body.role}". Allowed roles: ${SYSTEM_ROLES.join(', ')}` },
          { status: 400 }
        );
      }

      if (targetRole === 'superadmin') {
        // Superadmin retains all permissions
        return NextResponse.json({
          success: true,
          role: 'superadmin',
          permissions: ALL_PERMISSION_IDS,
          message: 'Superadmin permissions are locked to full system access.'
        });
      }

      const rawPerms = Array.isArray(body.permissions) ? body.permissions : [];
      const validPerms = rawPerms.filter((p: string) => ALL_PERMISSION_IDS.includes(p));

      try {
        await db.collection('role_permissions').doc(targetRole).set(
          {
            role: targetRole,
            permissions: validPerms,
            updatedAt: now,
            tenantTag: 'rto-ai',
            databaseCode: 'rto-ai'
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn(`Firestore save for role "${targetRole}" failed:`, dbErr);
      }

      return NextResponse.json({
        success: true,
        role: targetRole,
        permissions: validPerms,
        updatedAt: now,
        message: `Successfully updated permissions for role "${targetRole}".`
      });
    }

    // 2. Bulk Role Permissions Update
    if (body.rolePermissions && typeof body.rolePermissions === 'object') {
      const updatedMap: Partial<Record<SystemRole, string[]>> = {};

      for (const [r, perms] of Object.entries(body.rolePermissions)) {
        const norm = normalizeRole(r);
        if (norm === 'superadmin') {
          updatedMap.superadmin = [...ALL_PERMISSION_IDS];
          continue;
        }

        if (Array.isArray(perms)) {
          const valid = perms.filter((p) => ALL_PERMISSION_IDS.includes(p));
          updatedMap[norm] = valid;

          try {
            await db.collection('role_permissions').doc(norm).set(
              {
                role: norm,
                permissions: valid,
                updatedAt: now,
                tenantTag: 'rto-ai',
                databaseCode: 'rto-ai'
              },
              { merge: true }
            );
          } catch (dbErr) {
            console.warn(`Firestore bulk save for role "${norm}" failed:`, dbErr);
          }
        }
      }

      return NextResponse.json({
        success: true,
        rolePermissions: {
          ...DEFAULT_ROLE_PERMISSIONS,
          ...updatedMap,
          superadmin: [...ALL_PERMISSION_IDS]
        },
        updatedAt: now,
        message: 'Successfully updated all role permissions.'
      });
    }

    return NextResponse.json(
      { error: 'Missing required field "role" or "rolePermissions".' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Error in POST /api/permissions:', err);
    return NextResponse.json({ error: err.message || 'Failed to update permissions' }, { status: 500 });
  }
}

/**
 * DELETE /api/permissions
 * Resets permissions for a specific role or all roles to default.
 */
export async function DELETE(req: NextRequest) {
  try {
    const authCheck = await requireSuperAdminCaller(req);
    if ('errorResponse' in authCheck) {
      return authCheck.errorResponse;
    }

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get('role');

    if (roleParam) {
      const roleKey = normalizeRole(roleParam);
      try {
        await db.collection('role_permissions').doc(roleKey).delete();
      } catch (e) {
        console.warn(`Could not delete role_permissions/${roleKey}:`, e);
      }

      return NextResponse.json({
        success: true,
        role: roleKey,
        permissions: DEFAULT_ROLE_PERMISSIONS[roleKey],
        message: `Reset permissions for role "${roleKey}" to defaults.`
      });
    }

    // Reset all roles
    try {
      const snapshot = await db.collection('role_permissions').get();
      const batch = db.batch();
      snapshot.forEach((doc: any) => batch.delete(doc.ref));
      await batch.commit();
    } catch (e) {
      console.warn('Could not reset all role_permissions in Firestore:', e);
    }

    return NextResponse.json({
      success: true,
      rolePermissions: DEFAULT_ROLE_PERMISSIONS,
      message: 'All role permissions have been reset to factory defaults.'
    });
  } catch (err: any) {
    console.error('Error in DELETE /api/permissions:', err);
    return NextResponse.json({ error: err.message || 'Failed to reset permissions' }, { status: 500 });
  }
}
