import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { put, del } from '@vercel/blob';

/**
 * Penyimpanan berkas yang mudah diganti provider (local / vercel-blob / supabase) lewat env.
 * Mode default: local (folder ./public/uploads) — cocok untuk dev dan VPS.
 * Untuk Vercel/Railway produksi, set STORAGE_PROVIDER dan token yang sesuai.
 */

export const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';
const LOCAL_DIR = process.env.LOCAL_STORAGE_DIR || './storage/uploads';

export type SavedFile = { url: string; name: string; size: number };

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  document: ['application/pdf'],
};

function ensureLocalDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function saveFile(
  file: File,
  kind: 'image' | 'document',
  subdir: string
): Promise<SavedFile> {
  const allowed = ALLOWED_TYPES[kind] || [];
  if (!allowed.includes(file.type)) {
    throw new Error(`Tipe berkas tidak didukung (${file.type || 'unknown'}).`);
  }
  const maxBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxBytes) {
    throw new Error('Ukuran berkas maksimal 10MB.');
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop()?.toLowerCase() || (file.type === 'application/pdf' ? 'pdf' : 'img');
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  if (STORAGE_PROVIDER === 'local') {
    const dir = path.join(process.cwd(), LOCAL_DIR, subdir);
    ensureLocalDir(dir);
    const full = path.join(dir, filename);
    fs.writeFileSync(full, bytes);
    // Simpan path relatif dari root project untuk dipakai route pelindung
    const rel = path.join(LOCAL_DIR, subdir, filename).replace(/\\/g, '/');
    return { url: rel, name: file.name, size: file.size };
  }

  if (STORAGE_PROVIDER === 'vercel-blob') {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error('BLOB_READ_WRITE_TOKEN belum diset.');
    const blob = await put(`${subdir}/${filename}`, bytes, {
      access: 'private',
      contentType: file.type,
      token,
      addRandomSuffix: false,
    });
    // Blob privat: hanya bisa dibaca lewat SDK + token, tidak lewat URL publik
    // langsung. Klien selalu mengaksesnya lewat proxy /api/berkas, lihat di sana.
    return { url: blob.url, name: file.name, size: file.size };
  }

  throw new Error('STORAGE_PROVIDER "' + STORAGE_PROVIDER + '" belum dikonfigurasi. Gunakan "local" atau "vercel-blob".');
}

export async function deleteFile(url: string) {
  if (/^https?:\/\//.test(url)) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return;
    try {
      await del(url, { token });
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    const full = path.join(process.cwd(), url);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch {
    /* ignore */
  }
}
