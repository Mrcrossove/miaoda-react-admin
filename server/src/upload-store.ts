import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, '-');
}

function guessContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

export async function saveUpload(file: File, category: string, ownerId?: string) {
  const ext = path.extname(file.name) || '.bin';
  const safeCategory = sanitizeSegment(category);
  const safeOwner = ownerId ? sanitizeSegment(ownerId) : 'public';
  const relativeDir = path.join(safeCategory, safeOwner);
  const absoluteDir = path.join(uploadsDir, relativeDir);

  await mkdir(absoluteDir, { recursive: true });

  const filename = `${Date.now()}-${randomUUID()}${ext}`;
  const relativePath = path.join(relativeDir, filename).replaceAll('\\', '/');
  const absolutePath = path.join(absoluteDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    relativePath,
    publicPath: `/uploads/${relativePath}`,
  };
}

export async function readUpload(relativePath: string) {
  const absolutePath = path.resolve(uploadsDir, relativePath);
  if (!absolutePath.startsWith(uploadsDir)) {
    return null;
  }

  try {
    const body = await readFile(absolutePath);
    return {
      body,
      contentType: guessContentType(absolutePath),
    };
  } catch {
    return null;
  }
}

