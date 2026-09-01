import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_JAWABAN = ['A', 'B', 'C', 'D'];

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const soal = await prisma.soalKuis.findMany({
    where: { cabangId: 'mqk' },
    orderBy: [{ urutan: 'asc' }, { createdAt: 'asc' }],
  });
  return NextResponse.json({ soal });
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { soal, pilihanA, pilihanB, pilihanC, pilihanD, jawaban, kategori, urutan } = body;

  if (![soal, pilihanA, pilihanB, pilihanC, pilihanD].every((v) => typeof v === 'string' && v.trim())) {
    return NextResponse.json({ error: 'Soal dan seluruh pilihan wajib diisi.' }, { status: 400 });
  }
  const j = String(jawaban || '').trim().toUpperCase();
  if (!VALID_JAWABAN.includes(j)) {
    return NextResponse.json({ error: 'Jawaban harus salah satu dari A/B/C/D.' }, { status: 400 });
  }

  const created = await prisma.soalKuis.create({
    data: {
      cabangId: 'mqk',
      soal: soal.trim(),
      pilihanA: pilihanA.trim(),
      pilihanB: pilihanB.trim(),
      pilihanC: pilihanC.trim(),
      pilihanD: pilihanD.trim(),
      jawaban: j,
      kategori: kategori ? String(kategori).trim() : null,
      urutan: Number.isFinite(Number(urutan)) ? Number(urutan) : 0,
    },
  });

  return NextResponse.json({ soal: created });
}

const MAKS_PER_PERMINTAAN = 300;

/** Hapus banyak soal sekaligus — dipanggil dari aksi "Hapus terpilih" di bank soal. */
export async function DELETE(req: Request) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === 'string') : [];
  if (ids.length === 0) return NextResponse.json({ error: 'Tidak ada soal yang dipilih.' }, { status: 400 });
  if (ids.length > MAKS_PER_PERMINTAAN) {
    return NextResponse.json({ error: `Maksimal ${MAKS_PER_PERMINTAAN} soal per permintaan.` }, { status: 400 });
  }

  const { count } = await prisma.soalKuis.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ success: true, dihapus: count });
}
