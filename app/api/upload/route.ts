import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string;
    const filename = formData.get('filename') as string;

    if (!file || !folder || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields: file, folder, or filename' },
        { status: 400 }
      );
    }

    // Convert the File object to a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure the target directory exists
    const publicDir = path.join(process.cwd(), 'public', 'images', folder);
    
    try {
      await fs.access(publicDir);
    } catch {
      await fs.mkdir(publicDir, { recursive: true });
    }

    // Write the file to the disk
    const filePath = path.join(publicDir, filename);
    await fs.writeFile(filePath, buffer);

    // Return the public URL path
    const url = `/images/${folder}/${filename}`;

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
