import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Save,
  Search,
  Filter,
  Eye,
  Grid,
  List,
  Sparkles,
  Info,
  Check,
  GraduationCap,
  FileText,
  DollarSign,
  MessageSquare,
  Settings
} from 'lucide-react';
import {
  SYSTEM_ROLES,
  ROLE_DEFINITIONS,
  normalizeRole,
  type SystemRole
} from '@/lib/auth/roles';
import {
  SYSTEM_PERMISSIONS,
  ALL_PERMISSION_IDS,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_CATEGORIES,
  type SystemPermission
} from '@/lib/auth/permissions';
import { authenticatedFetch } from '@/lib/firebase/client';

export const RolePermissionsManager: React.FC = () => {
  const [rolePermissions, setRolePermissions] = useState<Record<SystemRole, string[]>>(
    DEFAULT_ROLE_PERMISSIONS
  );
  const [selectedRole, setSelectedRole] = useState<SystemRole>('teacher');
  const [viewMode, setViewMode] = useState<'single' | 'matrix'>('single');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: ''
  });

  // Fetch persisted role permissions on mount
  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch('/api/permissions');
      if (res.ok) {
        const data = await res.json();
        if (data.rolePermissions) {
          setRolePermissions(data.rolePermissions);
        }
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRolePerms = rolePermissions[selectedRole] || [];
  const selectedMeta = ROLE_DEFINITIONS[selectedRole];

  const handleTogglePermission = (role: SystemRole, permId: string) => {
    if (role === 'superadmin') {
      setStatusMessage({
        type: 'error',
        text: 'Superadmin has irrevocable root access across all permissions.'
      });
      setTimeout(() => setStatusMessage({ type: null, text: '' }), 3500);
      return;
    }

    setRolePermissions((prev) => {
      const perms = prev[role] || [];
      const isGranted = perms.includes(permId);
      const updated = isGranted ? perms.filter((p) => p !== permId) : [...perms, permId];

      return {
        ...prev,
        [role]: updated
      };
    });
  };

  const handleGrantAll = (role: SystemRole) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: [...ALL_PERMISSION_IDS]
    }));
  };

  const handleRevokeAll = (role: SystemRole) => {
    if (role === 'superadmin') return;
    setRolePermissions((prev) => ({
      ...prev,
      [role]: []
    }));
  };

  const handleResetDefaults = (role: SystemRole) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: [...(DEFAULT_ROLE_PERMISSIONS[role] || [])]
    }));
  };

  const handleSaveRole = async (role: SystemRole) => {
    setIsSaving(true);
    setStatusMessage({ type: null, text: '' });
    try {
      const res = await authenticatedFetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          permissions: rolePermissions[role] || []
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `Permissions for ${ROLE_DEFINITIONS[role].label} saved successfully!`
        });
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error saving role permissions.'
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage({ type: null, text: '' }), 4000);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setStatusMessage({ type: null, text: '' });
    try {
      const res = await authenticatedFetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rolePermissions
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: 'All role permissions saved and synchronized to Firestore successfully!'
        });
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error saving role permissions.'
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage({ type: null, text: '' }), 4000);
    }
  };

  const filteredPermissions = SYSTEM_PERMISSIONS.filter((p) => {
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    const term = searchQuery.toLowerCase().trim();
    if (!term) return matchesCategory;

    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term);

    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Academic & LMS':
        return <GraduationCap className="w-4 h-4 text-indigo-500" />;
      case 'Admissions & Students':
        return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'Finance & Operations':
        return <DollarSign className="w-4 h-4 text-teal-500" />;
      case 'Communications & AI':
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
      case 'Administration & Governance':
        return <Settings className="w-4 h-4 text-purple-500" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner & Control Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-purple-900/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/30 text-purple-200 border border-purple-400/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              Superadmin RBAC Engine
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-slate-300 font-medium">
              11 System Roles
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-slate-300 font-medium">
              {SYSTEM_PERMISSIONS.length} Granular Permissions
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Role-by-Role Editor</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Full Matrix Comparison</span>
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Role Permissions Management
          </h2>
          <p className="text-sm text-purple-200/90 mt-1 max-w-3xl leading-relaxed">
            As Superadmin, you have full authority to grant or revoke operational permissions for specific roles. Changes take effect across user sessions and are persisted to the central database.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-900/40">
          <div className="flex items-center gap-2 text-xs text-purple-200">
            <Info className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              All newly registered users receive the <strong className="text-white">supporter</strong> role by default.
            </span>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving to Database...' : 'Save All Role Permissions'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {statusMessage.text && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium border shadow-xs animate-in fade-in slide-in-from-top-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* VIEW MODE 1: SINGLE ROLE EDITOR */}
      {viewMode === 'single' && (
        <div className="space-y-6">
          {/* Role Pill Navigation Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Select Role to Configure Permissions
            </label>
            <div className="flex flex-wrap gap-2">
              {SYSTEM_ROLES.map((r) => {
                const meta = ROLE_DEFINITIONS[r];
                const isSelected = selectedRole === r;
                const count = (rolePermissions[r] || []).length;

                return (
                  <button
                    key={r}
                    onClick={() => setSelectedRole(r)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-600/30'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{meta.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {r === 'superadmin' ? 'ALL' : `${count}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Selected Role Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-xl text-sm font-extrabold ${selectedMeta.badgeBg} ${selectedMeta.badgeText} shadow-xs`}>
                  {selectedMeta.label}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {selectedMeta.category} Domain
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-mono font-semibold text-slate-600">
                      Hierarchy: Level {selectedMeta.hierarchyLevel}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-purple-700">
                      {selectedRole === 'superadmin'
                        ? 'Full System Access (23/23)'
                        : `${currentRolePerms.length} / ${SYSTEM_PERMISSIONS.length} Active Permissions`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl">
                    {selectedMeta.description}
                  </p>
                </div>
              </div>

              {/* Action Controls for this Role */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {selectedRole !== 'superadmin' && (
                  <>
                    <button
                      onClick={() => handleGrantAll(selectedRole)}
                      className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Grant All</span>
                    </button>
                    <button
                      onClick={() => handleRevokeAll(selectedRole)}
                      className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Revoke All</span>
                    </button>
                    <button
                      onClick={() => handleResetDefaults(selectedRole)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Reset this role to default institutional baseline"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Defaults</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleSaveRole(selectedRole)}
                  disabled={isSaving || selectedRole === 'superadmin'}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Role</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    categoryFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({SYSTEM_PERMISSIONS.length})
                </button>
                {PERMISSION_CATEGORIES.map((cat) => {
                  const count = SYSTEM_PERMISSIONS.filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {getCategoryIcon(cat)}
                      <span>{cat} ({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Live Search */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter permissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800"
                />
              </div>
            </div>

            {/* Permissions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              {filteredPermissions.map((perm) => {
                const isGranted =
                  selectedRole === 'superadmin' || currentRolePerms.includes(perm.id);

                return (
                  <div
                    key={perm.id}
                    onClick={() => handleTogglePermission(selectedRole, perm.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                      isGranted
                        ? 'bg-purple-50/60 border-purple-300 ring-1 ring-purple-400/20 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          isGranted
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border-2 border-slate-300 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {perm.name}
                        </span>
                        <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-500 rounded font-mono text-[10px] shrink-0">
                          {perm.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {perm.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {getCategoryIcon(perm.category)}
                        <span className="text-[10px] font-semibold text-slate-500">
                          {perm.category}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: FULL MATRIX COMPARISON */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                System Role Permission Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any cell in the table to toggle specific permissions for that role.
              </p>
            </div>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Matrix'}</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold sticky top-0 z-10">
                  <th className="p-3.5 min-w-[220px] bg-slate-900 border-r border-slate-800">
                    Permission Scope
                  </th>
                  {SYSTEM_ROLES.map((r) => {
                    const meta = ROLE_DEFINITIONS[r];
                    return (
                      <th
                        key={r}
                        className="p-3 text-center min-w-[95px] border-r border-slate-800 last:border-none"
                      >
                        <div className="font-bold">{meta.label}</div>
                        <div className="text-[9px] text-slate-400 font-normal font-mono">
                          Lvl {meta.hierarchyLevel}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SYSTEM_PERMISSIONS.map((perm, idx) => (
                  <tr
                    key={perm.id}
                    className={`hover:bg-purple-50/30 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    }`}
                  >
                    <td className="p-3.5 font-medium border-r border-slate-200">
                      <div className="font-bold text-slate-900">{perm.name}</div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">{perm.id}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {perm.description}
                      </div>
                    </td>

                    {SYSTEM_ROLES.map((r) => {
                      const isGranted =
                        r === 'superadmin' ||
                        (rolePermissions[r] || []).includes(perm.id);

                      return (
                        <td
                          key={r}
                          onClick={() => handleTogglePermission(r, perm.id)}
                          className={`p-3 text-center border-r border-slate-200 last:border-none cursor-pointer transition-colors ${
                            isGranted ? 'bg-purple-50/50 hover:bg-purple-100/60' : 'hover:bg-slate-200/50'
                          }`}
                        >
                          {isGranted ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
