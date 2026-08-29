import { prisma } from '@/lib/prisma';
import { LOMBA } from '@/lib/data';
import PenilaianTable from './PenilaianTable';

export const dynamic = 'force-dynamic';

export default async function AdminPenilaianPage({
  searchParams,
}: {
  searchParams: { cabang?: string; tahap?: string };
}) {
  const cabangId = searchParams.cabang || '';
  const tahap = searchParams.tahap || 'penyisihan';

  const where: any = {
    status: { in: ['TERVERIFIKASI', 'LOLOS_PENYISIHAN', 'GUGUR_PENYISIHAN', 'LOLOS_FINAL', 'JUARA_1', 'JUARA_2', 'JUARA_3'] },
    ...(cabangId ? { cabangId } : {}),
  };

  const pendaftar = await prisma.pendaftar.findMany({
    where,
    include: { nilai: true },
    orderBy: [{ cabangId: 'asc' }, { createdAt: 'asc' }],
  });

  const serialized = pendaftar.map((p) => ({
    id: p.id,
    nomorPendaftaran: p.nomorPendaftaran,
    nama: p.nama,
    asalLembaga: p.asalLembaga,
    cabangId: p.cabangId,
    cabangNama: LOMBA.find((c) => c.id === p.cabangId)?.name || p.cabangId,
    status: p.status,
    nilaiPenyisihan: p.nilai?.nilaiPenyisihan ?? null,
    nilaiFinal: p.nilai?.nilaiFinal ?? null,
    peringkatPenyisihan: p.nilai?.peringkatPenyisihan ?? null,
    peringkatFinal: p.nilai?.peringkatFinal ?? null,
  }));

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(28px,3vw,40px)', letterSpacing: '-0.04em', margin: '0 0 8px' }}>
        Penilaian &amp; Seleksi
      </h1>
      <p style={{ fontSize: 14, color: '#5a554c', margin: '0 0 22px' }}>
        Input nilai penyisihan/final. Tombol &quot;Proses Kelulusan&quot; menghitung peringkat dan menandai
        otomatis status LOLOS/GUGUR (kuota final disesuaikan per cabang).
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
        <a
          href="/admin/penilaian"
          style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 600, borderRadius: 99, background: !cabangId ? 'var(--olive)' : 'var(--paper2)', color: !cabangId ? '#fff' : 'var(--ink)' }}
        >
          Semua cabang
        </a>
        {LOMBA.map((c) => (
          <a
            key={c.id}
            href={`/admin/penilaian?cabang=${c.id}&tahap=${tahap}`}
            style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 600, borderRadius: 99, background: cabangId === c.id ? 'var(--olive)' : 'var(--paper2)', color: cabangId === c.id ? '#fff' : 'var(--ink)' }}
          >
            {c.short}
          </a>
        ))}
      </div>

      <PenilaianTable pendaftar={serialized} cabangId={cabangId} tahap={tahap} />
    </div>
  );
}