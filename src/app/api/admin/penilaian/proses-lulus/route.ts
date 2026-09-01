import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JUMLAH_FINALIST = 5;

export async function POST() {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  // Ambil semua peserta terverifikasi (yang sudah di-input nilai penyisihan)
  const peserta = await prisma.pendaftar.findMany({
    where: {
      status: { in: ['TERVERIFIKASI', 'LOLOS_PENYISIHAN', 'GUGUR_PENYISIHAN', 'LOLOS_FINAL', 'JUARA_1', 'JUARA_2', 'JUARA_3'] },
    },
    include: { nilai: true },
  });

  // MQK punya alur dua-tahap tersendiri (lihat /api/admin/kuis/proses-babak1 & proses-babak2)
  const cabangIds = [...new Set(peserta.map((p) => p.cabangId))].filter((c) => c !== 'mqk');

  const result: Record<string, { lolos: string[]; gugur: string[]; belumDinilai: number }> = {};

  for (const cid of cabangIds) {
    const daftar = peserta
      .filter((p) => p.cabangId === cid && p.nilai?.nilaiPenyisihan !== null)
      .sort((a, b) => (b.nilai!.nilaiPenyisihan as number) - (a.nilai!.nilaiPenyisihan as number));

    const lolos = daftar.slice(0, JUMLAH_FINALIST);
    const gugur = daftar.slice(JUMLAH_FINALIST);
    const belumDinilai = peserta.filter((p) => p.cabangId === cid && p.nilai?.nilaiPenyisihan === null).length;

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < daftar.length; i++) {
        const p = daftar[i];
        const top = i < JUMLAH_FINALIST;
        await tx.pendaftar.update({
          where: { id: p.id },
          data: { status: top ? 'LOLOS_PENYISIHAN' : 'GUGUR_PENYISIHAN' },
        });
        if (p.nilai) {
          await tx.nilai.update({
            where: { pendaftarId: p.id },
            data: { peringkatPenyisihan: i + 1 },
          });
        }
      }
    });

    result[cid] = { lolos: lolos.map((p) => p.nomorPendaftaran), gugur: gugur.map((p) => p.nomorPendaftaran), belumDinilai };
  }

  return NextResponse.json({ ok: true, result });
}