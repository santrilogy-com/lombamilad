import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, ipFromRequest } from '@/lib/rate-limit';
import { verifikasiPeserta } from '@/lib/kuis';
import { saveFile } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_TIPE = ['awal', 'akhir'];

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`kuis-foto:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi sesaat lagi.' }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 400 });
  }

  const nomor = String(form.get('nomor') || '').trim().toUpperCase();
  const token = String(form.get('token') || '').trim();
  const tipe = String(form.get('tipe') || '').trim();
  const foto = form.get('foto');

  if (!VALID_TIPE.includes(tipe)) {
    return NextResponse.json({ error: 'Tipe foto tidak valid.' }, { status: 400 });
  }
  if (!(foto instanceof File)) {
    return NextResponse.json({ error: 'Berkas foto wajib diisi.' }, { status: 400 });
  }

  const pendaftar = await verifikasiPeserta(nomor, token);
  if (!pendaftar) {
    return NextResponse.json({ error: 'Nomor pendaftaran atau token tidak cocok.' }, { status: 404 });
  }

  const attempt = await prisma.kuisAttempt.findUnique({ where: { pendaftarId: pendaftar.id } });
  if (!attempt || attempt.status !== 'SEDANG') {
    return NextResponse.json({ error: 'Kuis tidak sedang berlangsung.' }, { status: 403 });
  }

  const field = tipe === 'awal' ? 'fotoAwal' : 'fotoAkhir';
  // Idempotent: kalau slot ini sudah terisi (mis. retry ganda dari klien), jangan
  // dianggap error — cukup kembalikan sukses tanpa menulis ulang.
  if (attempt[field]) {
    return NextResponse.json({ ok: true, sudahAda: true });
  }

  let saved;
  try {
    saved = await saveFile(foto, 'kuis-verifikasi', 'kuis-verifikasi');
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Gagal menyimpan foto.' }, { status: 400 });
  }

  await prisma.kuisAttempt.update({
    where: { id: attempt.id },
    data: { [field]: saved.url },
  });

  return NextResponse.json({ ok: true });
}
