import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JUMLAH_FINALIST = 5;

// Proses hasil Babak II (nilai manual dari sesi Zoom, MQK) -> top 5 lolos final.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const peserta = await prisma.pendaftar.findMany({
    where: { cabangId: 'mqk', status: 'LOLOS_PENYISIHAN' },
    include: { nilai: true },
  });

  const daftar = peserta
    .filter((p) => p.nilai?.nilaiBabak2 !== null && p.nilai?.nilaiBabak2 !== undefined)
    .sort((a, b) => (b.nilai!.nilaiBabak2 as number) - (a.nilai!.nilaiBabak2 as number));

  const lolos = daftar.slice(0, JUMLAH_FINALIST);
  const gugur = daftar.slice(JUMLAH_FINALIST);
  const belumDinilai = peserta.filter((p) => p.nilai?.nilaiBabak2 === null || p.nilai?.nilaiBabak2 === undefined).length;

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < daftar.length; i++) {
      const p = daftar[i];
      const top = i < JUMLAH_FINALIST;
      await tx.pendaftar.update({
        where: { id: p.id },
        data: { status: top ? 'LOLOS_FINAL' : 'GUGUR_PENYISIHAN' },
      });
      await tx.nilai.update({
        where: { pendaftarId: p.id },
        data: { peringkatBabak2: i + 1 },
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
