import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, ipFromRequest } from '@/lib/rate-limit';
import { verifikasiPeserta, ambilAttemptTerkini, soalPublikDari, sisaWaktuDetik } from '@/lib/kuis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`kuis-soal:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi sesaat lagi.' }, { status: 429 });
  }

  const url = new URL(req.url);
  const nomor = (url.searchParams.get('nomor') || '').trim().toUpperCase();
  const token = (url.searchParams.get('token') || '').trim();

  const pendaftar = await verifikasiPeserta(nomor, token);
  if (!pendaftar) {
    return NextResponse.json({ error: 'Nomor pendaftaran atau token tidak cocok.' }, { status: 404 });
  }

  const attempt = await ambilAttemptTerkini(pendaftar.id);
  if (!attempt) {
    return NextResponse.json({ error: 'Anda belum memulai kuis.' }, { status: 404 });
  }

  const soalOrder = attempt.soalOrder as string[];

  if (attempt.status === 'SELESAI') {
    const benar =
      attempt.skor !== null
        ? Math.round(((attempt.skor as number) / 100) * soalOrder.length)
        : 0;
    return NextResponse.json({
      selesai: true,
      skor: attempt.skor,
      benar,
      total: soalOrder.length,
    });
  }

  const soalId = soalOrder[attempt.soalSaatIni];
  const soal = await prisma.soalKuis.findUnique({ where: { id: soalId } });
  if (!soal) {
    return NextResponse.json({ error: 'Soal tidak ditemukan. Hubungi panitia.' }, { status: 500 });
  }

  return NextResponse.json({
    selesai: false,
    soal: soalPublikDari(soal),
    nomorSoal: attempt.soalSaatIni + 1,
    total: soalOrder.length,
    sisaDetik: sisaWaktuDetik(attempt.batasWaktuSoal),
    jumlahMencurigakan: attempt.jumlahMencurigakan,
  });
}
