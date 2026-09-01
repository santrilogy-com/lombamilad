import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';
import { kirimPengumumanEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Dipanggil berulang oleh client per batch kecil (bukan sekali untuk semua peserta)
// supaya tidak melebihi batas waktu fungsi serverless saat peserta banyak.
const MAKS_PER_PERMINTAAN = 15;

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const judul = String(body.judul || '').trim();
  const pesan = String(body.pesan || '').trim();
  const pesertaIds: string[] = Array.isArray(body.pesertaIds) ? body.pesertaIds.slice(0, MAKS_PER_PERMINTAAN) : [];

  if (!judul || !pesan) return NextResponse.json({ error: 'Judul dan pesan wajib diisi.' }, { status: 400 });
  if (pesertaIds.length === 0) return NextResponse.json({ error: 'Tidak ada peserta di batch ini.' }, { status: 400 });

  const baseUrl = new URL(req.url).origin;
  const peserta = await prisma.pendaftar.findMany({
    where: { id: { in: pesertaIds } },
    select: { id: true, nama: true, email: true },
  });

  const terkirim: string[] = [];
  const gagal: { id: string; nama: string; error: string }[] = [];

  for (const p of peserta) {
    if (!p.email) {
      gagal.push({ id: p.id, nama: p.nama, error: 'Tidak ada alamat email.' });
      continue;
    }
    try {
      await kirimPengumumanEmail({
        to: p.email,
        nama: p.nama,
        judul,
        isi: pesan.replace(/\{nama\}/g, p.nama),
        baseUrl,
      });
      terkirim.push(p.id);
    } catch (err: any) {
      gagal.push({ id: p.id, nama: p.nama, error: err?.message || 'Gagal mengirim.' });
    }
  }

  return NextResponse.json({ terkirim, gagal });
}
