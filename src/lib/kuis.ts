import { prisma } from '@/lib/prisma';
import type { Pendaftar, KuisAttempt, SoalKuis } from '@prisma/client';

export const DETIK_PER_SOAL = 15;
const GRACE_MS = 2000;

export async function verifikasiPeserta(nomor: string, token: string): Promise<Pendaftar | null> {
  const pendaftar = await prisma.pendaftar.findUnique({ where: { nomorPendaftaran: nomor } });
  if (!pendaftar || pendaftar.tokenCek !== token || pendaftar.cabangId !== 'mqk') return null;
  return pendaftar;
}

export type SoalPublik = Pick<SoalKuis, 'id' | 'soal' | 'pilihanA' | 'pilihanB' | 'pilihanC' | 'pilihanD' | 'kategori'>;

/**
 * Ambil attempt milik peserta. Jika soal saat ini sudah lewat batas waktu (mis. peserta
 * reload lama setelah timeout), tandai tidak terjawab dan maju satu soal (atau finalisasi
 * bila itu soal terakhir) sebelum mengembalikan state terbaru.
 */
export async function ambilAttemptTerkini(pendaftarId: string): Promise<KuisAttempt | null> {
  let attempt = await prisma.kuisAttempt.findUnique({ where: { pendaftarId } });
  if (!attempt || attempt.status !== 'SEDANG') return attempt;

  if (attempt.batasWaktuSoal && new Date() > attempt.batasWaktuSoal) {
    const soalOrder = attempt.soalOrder as string[];
    const soalIdSaatIni = soalOrder[attempt.soalSaatIni];
    const jawabanBaru = { ...(attempt.jawaban as Record<string, string | null>) };
    if (soalIdSaatIni && !(soalIdSaatIni in jawabanBaru)) jawabanBaru[soalIdSaatIni] = null;

    const soalSaatIniBaru = attempt.soalSaatIni + 1;
    if (soalSaatIniBaru >= soalOrder.length) {
      attempt = await finalisasiSkor(attempt.id, jawabanBaru);
    } else {
      const now = new Date();
      attempt = await prisma.kuisAttempt.update({
        where: { id: attempt.id },
        data: {
          jawaban: jawabanBaru,
          soalSaatIni: soalSaatIniBaru,
          batasWaktuSoal: new Date(now.getTime() + DETIK_PER_SOAL * 1000),
        },
      });
    }
  }

  return attempt;
}

export async function finalisasiSkor(attemptId: string, jawabanFinal?: Record<string, string | null>): Promise<KuisAttempt> {
  const attempt = await prisma.kuisAttempt.findUniqueOrThrow({ where: { id: attemptId } });
  const jawaban = jawabanFinal ?? (attempt.jawaban as Record<string, string | null>);
  const soalOrder = attempt.soalOrder as string[];

  const soalList = await prisma.soalKuis.findMany({ where: { id: { in: soalOrder } } });
  const kunci = new Map(soalList.map((s) => [s.id, s.jawaban]));

  let benar = 0;
  for (const id of soalOrder) {
    if (jawaban[id] && jawaban[id] === kunci.get(id)) benar++;
  }
  const skor = soalOrder.length > 0 ? Math.round((benar / soalOrder.length) * 100) : 0;
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const a = await tx.kuisAttempt.update({
      where: { id: attemptId },
      data: {
        jawaban,
        soalSaatIni: soalOrder.length,
        status: 'SELESAI',
        selesaiAt: now,
        skor,
        batasWaktuSoal: null,
      },
    });
    await tx.nilai.upsert({
      where: { pendaftarId: attempt.pendaftarId },
      update: { nilaiPenyisihan: skor },
      create: { pendaftarId: attempt.pendaftarId, nilaiPenyisihan: skor },
    });
    return a;
  });

  return updated;
}

export function soalPublikDari(soal: SoalKuis): SoalPublik {
  return {
    id: soal.id,
    soal: soal.soal,
    pilihanA: soal.pilihanA,
    pilihanB: soal.pilihanB,
    pilihanC: soal.pilihanC,
    pilihanD: soal.pilihanD,
    kategori: soal.kategori,
  };
}

export function sisaWaktuDetik(batasWaktuSoal: Date | null): number {
  if (!batasWaktuSoal) return 0;
  return Math.max(0, Math.round((batasWaktuSoal.getTime() - Date.now()) / 1000));
}

export { GRACE_MS };
