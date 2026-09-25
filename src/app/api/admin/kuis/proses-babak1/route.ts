import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';
import { finalisasiSkor, GRACE_MS } from '@/lib/kuis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JUMLAH_LOLOS_BABAK2 = 10;

// Proses hasil Kuis Babak I (MQK) -> top 10 lolos ke Babak II.
export async function POST() {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  // Peserta yang menutup halaman di tengah kuis tidak pernah memicu finalisasi, jadi
  // nilainya kosong dan sebelumnya tidak ikut diperingkat sama sekali. Finalisasi dulu
  // attempt yang sudah ditinggalkan (batas waktu soalnya lewat): soal yang belum
  // dijawab dihitung salah. Attempt yang batas soalnya masih berjalan dibiarkan —
  // peserta itu mungkin sedang mengerjakan.
  const batasTinggal = new Date(Date.now() - GRACE_MS);
  const ditinggalkan = await prisma.kuisAttempt.findMany({
    where: { status: 'SEDANG', batasWaktuSoal: { lt: batasTinggal } },
    select: { id: true },
  });
  for (const a of ditinggalkan) await finalisasiSkor(a.id);
  const masihMengerjakan = await prisma.kuisAttempt.count({ where: { status: 'SEDANG' } });

  const peserta = await prisma.pendaftar.findMany({
    where: {
      cabangId: 'mqk',
      status: { in: ['TERVERIFIKASI', 'LOLOS_PENYISIHAN', 'GUGUR_PENYISIHAN', 'LOLOS_FINAL', 'JUARA_1', 'JUARA_2', 'JUARA_3'] },
    },
    include: { nilai: true, kuisAttempt: true },
  });

  // Urutan peringkat: nilai tertinggi; bila sama, aktivitas mencurigakan lebih
  // sedikit; bila masih sama, waktu pengerjaan (mulai s.d. selesai) lebih cepat.
  // Tanpa penentu ini, siapa yang lolos di antara nilai kembar di batas 10 besar
  // bergantung pada urutan acak baris database.
  const durasi = (p: (typeof peserta)[number]) => {
    const a = p.kuisAttempt;
    return a?.mulaiAt && a.selesaiAt ? a.selesaiAt.getTime() - a.mulaiAt.getTime() : Number.MAX_SAFE_INTEGER;
  };
  const daftar = peserta
    .filter((p) => p.nilai?.nilaiPenyisihan != null)
    .sort(
      (a, b) =>
        (b.nilai!.nilaiPenyisihan as number) - (a.nilai!.nilaiPenyisihan as number) ||
        (a.kuisAttempt?.jumlahMencurigakan ?? 0) - (b.kuisAttempt?.jumlahMencurigakan ?? 0) ||
        durasi(a) - durasi(b)
    );

  const lolos = daftar.slice(0, JUMLAH_LOLOS_BABAK2);
  const gugur = daftar.slice(JUMLAH_LOLOS_BABAK2);
  const belumDinilai = peserta.filter((p) => p.nilai?.nilaiPenyisihan === null || p.nilai?.nilaiPenyisihan === undefined).length;

  // Peserta yang statusnya benar-benar berubah — klien mengirimi mereka email hasil
  // otomatis (bertahap per batch lewat /api/admin/penilaian/kirim-hasil).
  const berubah: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < daftar.length; i++) {
      const p = daftar[i];
      const top = i < JUMLAH_LOLOS_BABAK2;
      const statusBaru = top ? 'LOLOS_PENYISIHAN' : 'GUGUR_PENYISIHAN';
      if (statusBaru !== p.status) berubah.push(p.id);
      await tx.pendaftar.update({
        where: { id: p.id },
        data: { status: statusBaru },
      });
      await tx.nilai.update({
        where: { pendaftarId: p.id },
        data: { peringkatPenyisihan: i + 1 },
      });
    }
  });

  return NextResponse.json({
    ok: true,
    berubah,
    lolos: lolos.map((p) => p.nomorPendaftaran),
    gugur: gugur.map((p) => p.nomorPendaftaran),
    belumDinilai,
    masihMengerjakan,
    difinalisasi: ditinggalkan.length,
  });
}
