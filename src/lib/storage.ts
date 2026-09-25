import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { put, del } from '@vercel/blob';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
  // Berkas submisi: naskah atau video (accept=".pdf,.doc,.docx,image/*,.mp4,.mov")
  // video/quicktime = .mov, format bawaan kamera iPhone.
  submisi: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
  ],
  // Foto verifikasi kuis: selalu berasal dari <canvas>.toBlob() di klien, bukan
  // unggahan bebas — cukup batasi ke format gambar umum.
  'kuis-verifikasi': ['image/jpeg', 'image/png', 'image/webp'],
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
  // .mov lama tidak selalu diawali atom "ftyp" — atom pertama bisa moov/mdat/wide/free.
  'video/quicktime': (b) => ['ftyp', 'moov', 'mdat', 'wide', 'free', 'skip'].includes(b.subarray(4, 8).toString('latin1')),
  'application/msword': (b) => b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
  // .docx adalah arsip ZIP (signature PK\x03\x04)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (b) =>
    b.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])),
};

function isiSesuaiTipe(bytes: Buffer, mime: string): boolean {
  const check = MAGIC_CHECKS[mime];
  return check ? check(bytes) : true;
}

function ekstensiBerkas(name: string, mime: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (/^[a-z0-9]{1,5}$/.test(ext) && ext !== name.toLowerCase()) return ext;
  return mime === 'application/pdf' ? 'pdf' : mime.startsWith('video/') ? 'mp4' : 'img';
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
  kind: 'identitas' | 'submisi' | 'kuis-verifikasi',
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
  const ext = ekstensiBerkas(file.name, file.type);
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

// ---------------------------------------------------------------------------
// Unggah langsung dari browser ke R2 (presigned PUT URL).
//
// Batas body request Vercel (~4.5MB) membuat video submisi (mis. khitobah,
// bahkan 19 detik dari HP bisa >10MB) tidak mungkin lewat /api/pendaftar.
// Jadi untuk submisi, browser minta URL bertanda tangan, PUT berkasnya
// langsung ke bucket R2, lalu hanya mengirim kunci objeknya ke /api/pendaftar.
// Server memverifikasi ulang ukuran & signature isi berkas sebelum menerima.
// ---------------------------------------------------------------------------

// Video dikompres otomatis di browser (lihat src/lib/kompres-video.ts) sehingga
// video 7 menit menjadi ±80MB; batas ini memberi ruang untuk HP yang tidak
// mendukung kompresi tapi videonya pendek.
export const MAX_SUBMISI_LANGSUNG_MB = 150;
const MAX_SUBMISI_LANGSUNG_BYTES = MAX_SUBMISI_LANGSUNG_MB * 1024 * 1024;
const KUNCI_SUBMISI_RE = /^submisi\/\d+-[0-9a-f]{8}\.[a-z0-9]{1,5}$/;

export function unggahLangsungTersedia() {
  return STORAGE_PROVIDER === 'r2';
}

export async function buatUrlUnggahSubmisi(name: string, mime: string, size: number) {
  if (!ALLOWED_TYPES.submisi.includes(mime)) {
    throw new Error(`Tipe berkas tidak didukung (${mime || 'unknown'}).`);
  }
  if (!Number.isFinite(size) || size <= 0) throw new Error('Berkas kosong.');
  if (size > MAX_SUBMISI_LANGSUNG_BYTES) {
    throw new Error(`Ukuran berkas submisi maksimal ${MAX_SUBMISI_LANGSUNG_MB}MB.`);
  }
  const key = `submisi/${Date.now()}-${randomUUID().slice(0, 8)}.${ekstensiBerkas(name, mime)}`;
  const uploadUrl = await getSignedUrl(
    getR2Client(),
    new PutObjectCommand({ Bucket: r2Bucket(), Key: key, ContentType: mime }),
    { expiresIn: 60 * 60 }
  );
  return { key, uploadUrl };
}

/**
 * Pastikan objek hasil unggah langsung benar-benar ada, ukurannya dalam batas,
 * dan isinya sesuai tipe yang diklaim. Mengembalikan url "r2://..." untuk DB.
 * Objek yang tidak lolos dihapus.
 */
export async function terimaUnggahanSubmisi(key: string): Promise<string> {
  if (!KUNCI_SUBMISI_RE.test(key)) throw new Error('Berkas submisi tidak valid. Silakan unggah ulang.');
  const client = getR2Client();
  const Bucket = r2Bucket();
  let head;
  try {
    head = await client.send(new HeadObjectCommand({ Bucket, Key: key }));
  } catch {
    throw new Error('Berkas submisi belum terunggah. Silakan unggah ulang.');
  }
  const mime = head.ContentType || '';
  const size = head.ContentLength || 0;
  let valid = ALLOWED_TYPES.submisi.includes(mime) && size > 0 && size <= MAX_SUBMISI_LANGSUNG_BYTES;
  if (valid) {
    const awal = await client.send(new GetObjectCommand({ Bucket, Key: key, Range: 'bytes=0-15' }));
    const bytes = Buffer.from(
      await (awal.Body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray()
    );
    valid = isiSesuaiTipe(bytes, mime);
  }
  if (!valid) {
    await deleteFile(`r2://${key}`);
    throw new Error('Isi berkas submisi tidak sesuai tipe/ukuran yang diizinkan. Silakan unggah ulang.');
  }
  return `r2://${key}`;
}

/**
 * URL baca bertanda tangan berumur pendek untuk objek R2. Dipakai /api/berkas
 * (setelah otorisasi) sebagai redirect, karena respons fungsi Vercel juga
 * dibatasi ~4.5MB — video submisi tidak bisa dialirkan lewat server.
 */
export async function urlBacaR2(url: string) {
  const key = url.slice('r2://'.length);
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({ Bucket: r2Bucket(), Key: key, ResponseContentDisposition: 'inline' }),
    { expiresIn: 5 * 60 }
  );
}
