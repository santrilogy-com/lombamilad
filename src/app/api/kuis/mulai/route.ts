import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, ipFromRequest } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JUMLAH_SOAL = 50;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  // Batas per-IP dilonggarkan (bukan per-peserta) karena banyak peserta bisa membuka
  // kuis bersamaan dari WiFi/NAT yang sama (mis. satu madrasah) saat kuis baru dibuka —
  // limit yang terlalu ketat bisa menjegal peserta sah, bukan cuma penyalahguna.
  const rl = rateLimit(`kuis-mulai:${ip}`, 40, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi sesaat lagi.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const nomor = String(body.nomor || '').trim().toUpperCase();
  const token = String(body.token || '').trim();

  if (!nomor || !token) {
    return NextResponse.json({ error: 'Nomor pendaftaran dan token wajib diisi.' }, { status: 400 });
  }

  const pendaftar = await prisma.pendaftar.findUnique({
    where: { nomorPendaftaran: nomor },
    include: { kuisAttempt: true },
  });

  if (!pendaftar || pendaftar.tokenCek !== token) {
    return NextResponse.json({ error: 'Nomor pendaftaran atau token tidak cocok.' }, { status: 404 });
  }
  if (pendaftar.cabangId !== 'mqk') {
    return NextResponse.json({ error: 'Kuis ini hanya untuk peserta cabang MQK.' }, { status: 403 });
  }

  // Sudah punya attempt -> kembalikan state saat ini (resume / hasil akhir)
  if (pendaftar.kuisAttempt) {
    return NextResponse.json({ ok: true, status: pendaftar.kuisAttempt.status });
  }

  if (pendaftar.status !== 'TERVERIFIKASI') {
    return NextResponse.json({ error: 'Anda belum berstatus terverifikasi untuk mengikuti kuis ini.' }, { status: 403 });
  }

  const setting = await prisma.pengaturan.findUnique({ where: { key: 'kuis_mqk_status' } });
  if (setting?.value !== 'dibuka') {
    return NextResponse.json({ error: 'Kuis Babak I belum dibuka oleh panitia.' }, { status: 403 });
  }

  const bank = await prisma.soalKuis.findMany({
    where: { cabangId: 'mqk', aktif: true },
    select: { id: true },
  });
  if (bank.length === 0) {
    return NextResponse.json({ error: 'Bank soal belum tersedia. Hubungi panitia.' }, { status: 503 });
  }

  const soalOrder = shuffle(bank.map((s) => s.id)).slice(0, JUMLAH_SOAL);
  const now = new Date();

  try {
    await prisma.kuisAttempt.create({
      data: {
        pendaftarId: pendaftar.id,
        status: 'SEDANG',
        soalOrder,
        jawaban: {},
        soalSaatIni: 0,
        mulaiAt: now,
        // batasWaktuSoal sengaja TIDAK di-set di sini — klien masih akan meminta izin
        // kamera setelah panggilan ini sukses, dan itu bisa makan beberapa detik (dialog
        // izin browser). Kalau jatah waktu soal 1 mulai dihitung dari sini, peserta yang
        // agak lama memberi izin kamera bisa kehabisan waktu sebelum sempat membaca soal
        // pertama. ambilAttemptTerkini() di lib/kuis.ts baru mengisi batasWaktuSoal saat
        // soal benar-benar diambil untuk ditampilkan (GET /api/kuis/soal).
      },
    });
  } catch (err: any) {
    // Dua request "mulai" nyaris bersamaan (mis. React StrictMode di dev, atau
    // klik ganda) bisa sama-sama lolos pengecekan "belum ada attempt" di atas.
    // Kalau ini pelanggaran unique constraint pendaftarId, attempt yang lain
    // sudah berhasil dibuat duluan — anggap sukses, bukan error.
    if (err?.code !== 'P2002') throw err;
  }

  return NextResponse.json({ ok: true, status: 'SEDANG' });
}
