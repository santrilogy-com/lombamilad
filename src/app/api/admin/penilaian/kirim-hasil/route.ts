import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';
import { kirimHasilKePendaftar } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAKS_PER_PERMINTAAN = 15;

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const pesertaIds: string[] = Array.isArray(body.pesertaIds) ? body.pesertaIds.slice(0, MAKS_PER_PERMINTAAN) : [];
  if (pesertaIds.length === 0) return NextResponse.json({ error: 'Tidak ada peserta di batch ini.' }, { status: 400 });

  const baseUrl = new URL(req.url).origin;
  const peserta = await prisma.pendaftar.findMany({
    where: { id: { in: pesertaIds } },
    include: { nilai: true },
  });

  const terkirim: string[] = [];
  const gagal: { id: string; nama: string; error: string }[] = [];

  for (const p of peserta) {
    try {
      await kirimHasilKePendaftar(p, baseUrl);
      terkirim.push(p.id);
    } catch (err: any) {
      gagal.push({ id: p.id, nama: p.nama, error: err?.message || 'Gagal mengirim.' });
    }
  }

  return NextResponse.json({ terkirim, gagal });
}
