import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { put, del } from '@vercel/blob';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

/**
 * Penyimpanan berkas yang mudah diganti provider (local / vercel-blob / r2) lewat env.
 * Mode default: local (folder ./storage/uploads) — cocok untuk dev dan VPS.
 * Untuk Vercel/Railway produksi, set STORAGE_PROVIDER dan kredensial yang sesuai.
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

let r2Client: S3Client | null = null;
function getR2Client() {
  if (r2Client) return r2Client;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY belum diset.');
  }
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return r2Client;
}

function r2Bucket() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('R2_BUCKET_NAME belum diset.');
  return bucket;
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

  if (STORAGE_PROVIDER === 'r2') {
    const key = `${subdir}/${filename}`;
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: r2Bucket(),
        Key: key,
        Body: bytes,
        ContentType: file.type,
      })
    );
    // Bucket R2 tidak diekspos publik; kunci objek disimpan dengan skema "r2://"
    // dan hanya dibaca lewat proxy /api/berkas memakai kredensial server.
    return { url: `r2://${key}`, name: file.name, size: file.size };
  }

  throw new Error('STORAGE_PROVIDER "' + STORAGE_PROVIDER + '" belum dikonfigurasi. Gunakan "local", "vercel-blob", atau "r2".');
}

export async function deleteFile(url: string) {
  if (url.startsWith('r2://')) {
    try {
      await getR2Client().send(
        new DeleteObjectCommand({ Bucket: r2Bucket(), Key: url.slice('r2://'.length) })
      );
    } catch {
      /* ignore */
    }
    return;
  }
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

/** Ambil stream + tipe konten sebuah objek R2 (dipakai oleh proxy /api/berkas). */
export async function getR2Object(url: string) {
  const key = url.slice('r2://'.length);
  const res = await getR2Client().send(new GetObjectCommand({ Bucket: r2Bucket(), Key: key }));
  return { body: res.Body, contentType: res.ContentType || 'application/octet-stream' };
}
