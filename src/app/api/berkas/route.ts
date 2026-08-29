import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

  const session = await getServerSession(authOptions);
  let pendaftar: { fileIdentitas: string | null; fileSubmisi: string | null } | null = null;

  if (session?.user) {
    // admin: tidak pakai nomor/token
    const target = url.searchParams.get('file');
    if (!target) return new NextResponse('Bad request', { status: 400 });
    pendaftar = { fileIdentitas: target, fileSubmisi: null };
  } else {
    if (!nomor || !token) return new NextResponse('Unauthorized', { status: 401 });
    const found = await prisma.pendaftar.findUnique({
      where: { nomorPendaftaran: nomor },
    });
    if (!found || found.tokenCek !== token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    pendaftar = { fileIdentitas: found.fileIdentitas, fileSubmisi: found.fileSubmisi };
  }

  const rel = pendaftar.fileIdentitas || '';
  const full = path.resolve(path.join(process.cwd(), rel));
  const root = path.resolve(process.cwd());
  if (!full.startsWith(root + path.sep)) {
    return new NextResponse('Bad request', { status: 400 });
  }
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    return new NextResponse('Not found', { status: 404 });
  }

  const ext = path.extname(full).toLowerCase();
  const mime =
    ext === '.pdf'
      ? 'application/pdf'
      : ext === '.png'
      ? 'image/png'
      : ext === '.jpg' || ext === '.jpeg'
      ? 'image/jpeg'
      : 'application/octet-stream';

  const data = fs.readFileSync(full);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
    },
  });
}
