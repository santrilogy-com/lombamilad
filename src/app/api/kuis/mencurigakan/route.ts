import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, ipFromRequest } from '@/lib/rate-limit';
import { verifikasiPeserta } from '@/lib/kuis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`kuis-mencurigakan:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const nomor = String(body.nomor || '').trim().toUpperCase();
  const token = String(body.token || '').trim();

  const pendaftar = await verifikasiPeserta(nomor, token);
  if (!pendaftar) {
    return NextResponse.json({ error: 'Nomor pendaftaran atau token tidak cocok.' }, { status: 404 });
  }

  const attempt = await prisma.kuisAttempt.findUnique({ where: { pendaftarId: pendaftar.id } });
  if (!attempt || attempt.status !== 'SEDANG') {
    return NextResponse.json({ ok: true });
  }

  await prisma.kuisAttempt.update({
    where: { id: attempt.id },
    data: { jumlahMencurigakan: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
