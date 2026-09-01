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

// Daftar tipe MIME ini harus selaras dengan atribut `accept` pada input file di
// src/app/daftar/page.tsx — kalau tidak, peserta bisa memilih berkas yang lolos
// validasi browser tapi selalu ditolak server dengan pesan generik.
const ALLOWED_TYPES: Record<string, string[]> = {
  // Kartu tanda pengenal: scan/foto (accept="image/*,.pdf")
  identitas: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  // Berkas submisi: naskah atau video (accept=".pdf,.doc,.docx,image/*,.mp4")
  submisi: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
  ],
};

// file.type datang dari klien (Content-Type yang dilaporkan browser) dan bisa
// dipalsukan dengan mudah (mis. ganti ekstensi/mime lewat DevTools atau curl).
// Sebagai lapisan kedua, sniff beberapa byte pertama isi berkas dan cocokkan
// dengan signature format aslinya sebelum diterima.
const MAGIC_CHECKS: Record<string, (b: Buffer) => boolean> = {
  'application/pdf': (b) => b.subarray(0, 4).toString('latin1') === '%PDF',
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/jpeg': (b) => b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  'image/webp': (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  'video/mp4': (b) => b.subarray(4, 8).toString('latin1') === 'ftyp',
  'application/msword': (b) => b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
  // .docx adalah arsip ZIP (signature PK\x03\x04)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (b) =>
    b.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])),
};

function isiSesuaiTipe(bytes: Buffer, mime: string): boolean {
  const check = MAGIC_CHECKS[mime];
  return check ? check(bytes) : true;
}

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
  kind: 'identitas' | 'submisi',
  subdir: string
): Promise<SavedFile> {
  const allowed = ALLOWED_TYPES[kind] || [];
  if (!allowed.includes(file.type)) {
    throw new Error(`Tipe berkas tidak didukung (${file.type || 'unknown'}).`);
  }
  // Vercel Serverless Functions membatasi ukuran body request ~4.5MB (di luar
  // kendali aplikasi). Batas per-berkas dijaga jauh di bawah itu supaya dua
  // berkas (identitas + submisi) dalam satu request tetap aman terkirim.
  const maxBytes = 4 * 1024 * 1024; // 4MB
  if (file.size > maxBytes) {
    throw new Error('Ukuran berkas maksimal 4MB.');
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!isiSesuaiTipe(bytes, file.type)) {
    throw new Error('Isi berkas tidak sesuai dengan tipe filenya. Pastikan berkas tidak rusak dan coba unggah ulang.');
  }
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
