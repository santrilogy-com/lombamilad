import { prisma } from '@/lib/prisma';
import SoalKuisManager from './SoalKuisManager';

export const dynamic = 'force-dynamic';

export default async function AdminKuisPage() {
  const [soal, setting, attempts] = await Promise.all([
    prisma.soalKuis.findMany({ where: { cabangId: 'mqk' }, orderBy: [{ urutan: 'asc' }, { createdAt: 'asc' }] }),
    prisma.pengaturan.findUnique({ where: { key: 'kuis_mqk_status' } }),
    prisma.kuisAttempt.findMany({
      where: { pendaftar: { cabangId: 'mqk' } },
      include: { pendaftar: { select: { nomorPendaftaran: true, nama: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const totalPeserta = await prisma.pendaftar.count({ where: { cabangId: 'mqk', status: 'TERVERIFIKASI' } });

  const ringkasan = {
    belumMulai: totalPeserta - attempts.length,
    sedang: attempts.filter((a) => a.status === 'SEDANG').length,
    selesai: attempts.filter((a) => a.status === 'SELESAI').length,
    rataSkor:
      attempts.filter((a) => a.skor !== null).length > 0
        ? Math.round(
            attempts.filter((a) => a.skor !== null).reduce((sum, a) => sum + (a.skor as number), 0) /
              attempts.filter((a) => a.skor !== null).length
          )
        : null,
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(28px,3vw,40px)', letterSpacing: '-0.04em', margin: '0 0 8px' }}>
        Kuis Babak I — MQK
      </h1>
      <p style={{ fontSize: 14, color: '#5a554c', margin: '0 0 22px' }}>
        Kelola bank soal, buka/tutup akses kuis, dan pantau progres peserta. Nilai otomatis tersimpan
        sebagai Nilai Penyisihan dan bisa diproses di halaman Penilaian.
      </p>

      <SoalKuisManager
        soalAwal={soal.map((s) => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() }))}
        statusAwal={setting?.value === 'dibuka' ? 'dibuka' : 'tertutup'}
        ringkasan={ringkasan}
        attempts={attempts.map((a) => ({
          id: a.id,
          nomorPendaftaran: a.pendaftar.nomorPendaftaran,
          nama: a.pendaftar.nama,
          status: a.status,
          skor: a.skor,
          soalSaatIni: a.soalSaatIni,
          totalSoal: (a.soalOrder as string[]).length,
          jumlahMencurigakan: a.jumlahMencurigakan,
          fotoAwal: Boolean(a.fotoAwal),
          fotoAkhir: Boolean(a.fotoAkhir),
          mulaiAt: a.mulaiAt ? a.mulaiAt.toISOString() : null,
          selesaiAt: a.selesaiAt ? a.selesaiAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
