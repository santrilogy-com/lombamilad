import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { KuisAttempt } from '@prisma/client';
import { rateLimit, ipFromRequest } from '@/lib/rate-limit';
import {
  verifikasiPeserta,
  ambilAttemptTerkini,
  finalisasiSkor,
  soalPublikDari,
  sisaWaktuDetik,
  DETIK_PER_SOAL,
  GRACE_MS,
} from '@/lib/kuis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_PILIHAN = ['A', 'B', 'C', 'D'];

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`kuis-jawab:${ip}`, 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi sesaat lagi.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const nomor = String(body.nomor || '').trim().toUpperCase();
  const token = String(body.token || '').trim();
  const soalId = String(body.soalId || '').trim();
  const pilihanRaw = body.pilihan === null || body.pilihan === undefined ? null : String(body.pilihan).trim().toUpperCase();

  if (pilihanRaw !== null && !VALID_PILIHAN.includes(pilihanRaw)) {
    return NextResponse.json({ error: 'Pilihan tidak valid.' }, { status: 400 });
  }

  const pendaftar = await verifikasiPeserta(nomor, token);
  if (!pendaftar) {
    return NextResponse.json({ error: 'Nomor pendaftaran atau token tidak cocok.' }, { status: 404 });
  }

  // Terapkan catch-up dulu (mis. jawaban ini datang telat setelah auto-skip server terjadi).
  let attempt = await ambilAttemptTerkini(pendaftar.id);
  if (!attempt) {
    return NextResponse.json({ error: 'Anda belum memulai kuis.' }, { status: 404 });
  }
  if (attempt.status === 'SELESAI') {
    return NextResponse.json({ selesai: true, skor: attempt.skor });
  }

  const soalOrder = attempt.soalOrder as string[];
  const soalIdSaatIni = soalOrder[attempt.soalSaatIni];

  if (soalId !== soalIdSaatIni) {
    // Soal sudah berpindah (mis. auto-skip) sebelum jawaban ini sampai — abaikan, kembalikan state terbaru.
    return buildRespon(attempt);
  }

  if (attempt.batasWaktuSoal && Date.now() > attempt.batasWaktuSoal.getTime() + GRACE_MS) {
    return buildRespon(attempt);
  }

  const jawabanBaru = { ...(attempt.jawaban as Record<string, string | null>), [soalIdSaatIni]: pilihanRaw };
  const soalSaatIniBaru = attempt.soalSaatIni + 1;

  if (soalSaatIniBaru >= soalOrder.length) {
    const final = await finalisasiSkor(attempt.id, jawabanBaru);
    return NextResponse.json({ selesai: true, skor: final.skor, benar: hitungBenarDariSkor(final.skor, soalOrder.length), total: soalOrder.length });
  }

  const now = new Date();
  attempt = await prisma.kuisAttempt.update({
    where: { id: attempt.id },
    data: {
      jawaban: jawabanBaru,
      soalSaatIni: soalSaatIniBaru,
      batasWaktuSoal: new Date(now.getTime() + DETIK_PER_SOAL * 1000),
    },
  });

  return buildRespon(attempt);
}

function hitungBenarDariSkor(skor: number | null, total: number): number {
  if (skor === null) return 0;
  return Math.round((skor / 100) * total);
}

async function buildRespon(attempt: KuisAttempt) {
  const soalOrder = attempt.soalOrder as string[];

  if (attempt.status === 'SELESAI') {
    return NextResponse.json({
      selesai: true,
      skor: attempt.skor,
      benar: hitungBenarDariSkor(attempt.skor, soalOrder.length),
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
