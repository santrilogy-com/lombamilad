import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';
import { get as getBlob } from '@vercel/blob';
import { getR2Object } from '@/lib/storage';

const LOCAL_DIR = path.resolve(process.env.LOCAL_STORAGE_DIR || './storage/uploads');

export const runtime = 'nodejs';

/**
 * Melayani berkas secara aman. Hanya dapat diakses oleh:
 * - pemilik (nomor pendaftaran + token cek), atau
 * - sesi admin yang terautentikasi.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const nomor = url.searchParams.get('nomor');
  const token = url.searchParams.get('token');

  const session = await requireAdminSession();
  let rel = '';

  if (session) {
    // admin: identifikasi berkas lewat id record + jenis, bukan path mentah dari klien,
    // supaya admin tidak bisa dipaksa membaca file arbitrer di server (mis. .env).
    const id = url.searchParams.get('id');
    const jenis = url.searchParams.get('jenis');
    if (!id || (jenis !== 'identitas' && jenis !== 'submisi')) {
      return new NextResponse('Bad request', { status: 400 });
    }
    const found = await prisma.pendaftar.findUnique({ where: { id } });
    if (!found) return new NextResponse('Not found', { status: 404 });
    rel = (jenis === 'identitas' ? found.fileIdentitas : found.fileSubmisi) || '';
  } else {
    if (!nomor || !token) return new NextResponse('Unauthorized', { status: 401 });
    const found = await prisma.pendaftar.findUnique({
      where: { nomorPendaftaran: nomor },
    });
    if (!found || found.tokenCek !== token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    rel = found.fileIdentitas || '';
  }

  if (rel.startsWith('r2://')) {
    return serveR2(rel);
  }

  if (/^https?:\/\//.test(rel)) {
    return serveRemote(rel);
  }

  const full = path.resolve(path.join(process.cwd(), rel));
  const root = path.resolve(process.cwd());
  if (!full.startsWith(root + path.sep)) {
    return new NextResponse('Bad request', { status: 400 });
  }
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    return new NextResponse('Not found', { status: 404 });
  }

  const ext = path.extname(full).toLowerCase();
  const MIME_BY_EXT: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  const mime = MIME_BY_EXT[ext] || 'application/octet-stream';

  const data = fs.readFileSync(full);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
    },
  });
}

/** Ambil berkas dari Cloudflare R2 (bucket privat) memakai kredensial server. */
async function serveR2(rel: string) {
  try {
    const { body, contentType } = await getR2Object(rel);
    if (!body) return new NextResponse('Not found', { status: 404 });
    const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}

/** Ambil berkas dari Vercel Blob (store privat) memakai token server, bukan URL publik. */
async function serveRemote(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return new NextResponse('Bad request', { status: 400 });
  }
  // Batasi hanya ke domain Vercel Blob agar route ini tidak jadi proxy terbuka (SSRF).
  if (!parsed.hostname.endsWith('.blob.vercel-storage.com')) {
    return new NextResponse('Bad request', { status: 400 });
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return new NextResponse('Storage not configured', { status: 500 });

  const result = await getBlob(parsed.toString(), { access: 'private', token });
  if (!result || !result.stream) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(result.stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': result.blob.contentType || 'application/octet-stream',
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
    },
  });
}
