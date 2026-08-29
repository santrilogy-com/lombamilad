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
    include: { nilai: true, cabang: true },
  });

  if (!p || p.tokenCek !== token) {
    return NextResponse.json({ error: 'Nomor pendaftaran atau token tidak cocok.' }, { status: 404 });
  }

  const cabang = LOMBA.find((c) => c.id === p.cabangId);
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
    cabang: cabang?.name || p.cabang.nama,
    cabangShort: cabang?.short || p.cabang.nama,
    asalLembaga: p.asalLembaga,
    whatsapp: p.whatsapp,
    tanggalDaftar: p.createdAt,
    status: labelStatus[p.status] || p.status,
    statusKode: p.status,
    nilaiPenyisihan: p.nilai?.nilaiPenyisihan ?? null,
    nilaiFinal: p.nilai?.nilaiFinal ?? null,
    peringkatPenyisihan: p.nilai?.peringkatPenyisihan ?? null,
    peringkatFinal: p.nilai?.peringkatFinal ?? null,
    verifikasiCatatan: p.verifikasiCatatan,
  });
}
