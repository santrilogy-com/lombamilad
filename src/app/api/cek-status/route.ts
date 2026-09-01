import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LOMBA } from '@/lib/data';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const nomor = (url.searchParams.get('nomor') || '').trim().toUpperCase();
  const token = (url.searchParams.get('token') || '').trim();

  if (!nomor || !token) {
    return NextResponse.json({ error: 'Nomor pendaftaran dan token wajib diisi.' }, { status: 400 });
  }

  const p = await prisma.pendaftar.findUnique({
    where: { nomorPendaftaran: nomor },
    include: { nilai: true, cabang: true, kuisAttempt: true },
  });

  if (!p || p.tokenCek !== token) {
    return NextResponse.json({ error: 'Nomor pendaftaran atau token tidak cocok.' }, { status: 404 });
  }

  const cabang = LOMBA.find((c) => c.id === p.cabangId);

  let kuis: { attemptStatus: string | null; skor: number | null; dibuka: boolean } | null = null;
  if (p.cabangId === 'mqk') {
    const setting = await prisma.pengaturan.findUnique({ where: { key: 'kuis_mqk_status' } });
    kuis = {
      attemptStatus: p.kuisAttempt?.status ?? null,
      skor: p.kuisAttempt?.skor ?? null,
      dibuka: setting?.value === 'dibuka',
    };
  }

  const pengumuman = await prisma.pengumuman.findMany({
    where: { published: true, tipe: { in: ['seleksi', 'final', 'umum'] } },
    orderBy: { createdAt: 'desc' },
  });
  const labelStatus: Record<string, string> = {
    MENUNGGU_VERIFIKASI: 'Menunggu verifikasi berkas',
    TERVERIFIKASI: 'Berkas terverifikasi — terdaftar',
    DITOLAK: 'Berkas ditolak',
    LOLOS_PENYISIHAN: 'Lolos penyisihan (lanjut ke final)',
    GUGUR_PENYISIHAN: 'Tidak lolos penyisihan',
    LOLOS_FINAL: 'Lolos ke babak final',
    JUARA_1: 'Juara 1',
    JUARA_2: 'Juara 2',
    JUARA_3: 'Juara 3',
  };

  return NextResponse.json({
    nomorPendaftaran: p.nomorPendaftaran,
    nama: p.nama,
    cabangId: p.cabangId,
    cabang: cabang?.name || p.cabang.nama,
    cabangShort: cabang?.short || p.cabang.nama,
    asalLembaga: p.asalLembaga,
    whatsapp: p.whatsapp,
    tanggalDaftar: p.createdAt,
    updatedAt: p.updatedAt,
    status: labelStatus[p.status] || p.status,
    statusKode: p.status,
    nilaiPenyisihan: p.nilai?.nilaiPenyisihan ?? null,
    nilaiBabak2: p.nilai?.nilaiBabak2 ?? null,
    nilaiFinal: p.nilai?.nilaiFinal ?? null,
    peringkatPenyisihan: p.nilai?.peringkatPenyisihan ?? null,
    peringkatBabak2: p.nilai?.peringkatBabak2 ?? null,
    peringkatFinal: p.nilai?.peringkatFinal ?? null,
    verifikasiCatatan: p.verifikasiCatatan,
    kuis,
    pengumuman: pengumuman.map((pg) => ({ id: pg.id, judul: pg.judul, isi: pg.isi, createdAt: pg.createdAt })),
  });
}
