import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, ipFromRequest } from '@/lib/rate-limit';
import { verifikasiPeserta, TIPE_AKTIVITAS_MENCURIGAKAN, type TipeAktivitasMencurigakan } from '@/lib/kuis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  // Batas per-IP dilonggarkan: beberapa peserta di WiFi/NAT yang sama bisa memicu laporan
  // (pindah tab, keluar fullscreen) dalam menit yang sama, dan laporan yang kena limit
  // hilang tanpa retry di klien (fire-and-forget) — limit ketat justru melemahkan data
  // anti-cheat di skenario yang paling butuh diawasi.
  const rl = rateLimit(`kuis-mencurigakan:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const nomor = String(body.nomor || '').trim().toUpperCase();
  const token = String(body.token || '').trim();
  const tipeMentah = String(body.tipe || '');
  const tipe: TipeAktivitasMencurigakan = (TIPE_AKTIVITAS_MENCURIGAKAN as readonly string[]).includes(tipeMentah)
    ? (tipeMentah as TipeAktivitasMencurigakan)
    : 'lain';

  const pendaftar = await verifikasiPeserta(nomor, token);
  if (!pendaftar) {
    return NextResponse.json({ error: 'Nomor pendaftaran atau token tidak cocok.' }, { status: 404 });
  }

  const attempt = await prisma.kuisAttempt.findUnique({ where: { pendaftarId: pendaftar.id } });
  if (!attempt || attempt.status !== 'SEDANG') {
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction([
    prisma.kuisAttempt.update({
      where: { id: attempt.id },
      data: { jumlahMencurigakan: { increment: 1 } },
    }),
    prisma.kuisAktivitas.create({
      data: { attemptId: attempt.id, tipe },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
