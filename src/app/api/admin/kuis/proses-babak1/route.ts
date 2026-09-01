import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JUMLAH_LOLOS_BABAK2 = 10;

// Proses hasil Kuis Babak I (MQK) -> top 10 lolos ke Babak II.
export async function POST() {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const peserta = await prisma.pendaftar.findMany({
    where: {
      cabangId: 'mqk',
      status: { in: ['TERVERIFIKASI', 'LOLOS_PENYISIHAN', 'GUGUR_PENYISIHAN', 'LOLOS_FINAL', 'JUARA_1', 'JUARA_2', 'JUARA_3'] },
    },
    include: { nilai: true },
  });

  const daftar = peserta
    .filter((p) => p.nilai?.nilaiPenyisihan !== null && p.nilai?.nilaiPenyisihan !== undefined)
    .sort((a, b) => (b.nilai!.nilaiPenyisihan as number) - (a.nilai!.nilaiPenyisihan as number));

  const lolos = daftar.slice(0, JUMLAH_LOLOS_BABAK2);
  const gugur = daftar.slice(JUMLAH_LOLOS_BABAK2);
  const belumDinilai = peserta.filter((p) => p.nilai?.nilaiPenyisihan === null || p.nilai?.nilaiPenyisihan === undefined).length;

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < daftar.length; i++) {
      const p = daftar[i];
      const top = i < JUMLAH_LOLOS_BABAK2;
      await tx.pendaftar.update({
        where: { id: p.id },
        data: { status: top ? 'LOLOS_PENYISIHAN' : 'GUGUR_PENYISIHAN' },
      });
      await tx.nilai.update({
        where: { pendaftarId: p.id },
        data: { peringkatPenyisihan: i + 1 },
      });
    }
  });

  return NextResponse.json({
    ok: true,
    lolos: lolos.map((p) => p.nomorPendaftaran),
    gugur: gugur.map((p) => p.nomorPendaftaran),
    belumDinilai,
  });
}
