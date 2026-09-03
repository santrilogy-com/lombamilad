import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { LOMBA } from '@/lib/data';
import PenilaianTable from './PenilaianTable';
import { PageHeader, chipStyle } from '../../ui';

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
    email: p.email,
    asalLembaga: p.asalLembaga,
    cabangId: p.cabangId,
    cabangNama: LOMBA.find((c) => c.id === p.cabangId)?.name || p.cabangId,
    status: p.status,
    nilaiPenyisihan: p.nilai?.nilaiPenyisihan ?? null,
    nilaiBabak2: p.nilai?.nilaiBabak2 ?? null,
    nilaiFinal: p.nilai?.nilaiFinal ?? null,
    peringkatPenyisihan: p.nilai?.peringkatPenyisihan ?? null,
    peringkatBabak2: p.nilai?.peringkatBabak2 ?? null,
    peringkatFinal: p.nilai?.peringkatFinal ?? null,
  }));

  return (
    <div>
      <PageHeader
        title="Penilaian & Seleksi"
        description={
          <>
            Input nilai penyisihan/final. Tombol &quot;Proses Kelulusan&quot; menghitung peringkat dan menandai
            otomatis status LOLOS/GUGUR (kuota final disesuaikan per cabang).
          </>
        }
      />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
        <Link href="/admin/penilaian" style={chipStyle(!cabangId)}>
          Semua cabang
        </Link>
        {LOMBA.map((c) => (
          <Link key={c.id} href={`/admin/penilaian?cabang=${c.id}&tahap=${tahap}`} style={chipStyle(cabangId === c.id)}>
            {c.short}
          </Link>
        ))}
      </div>

      <PenilaianTable pendaftar={serialized} cabangId={cabangId} tahap={tahap} />
    </div>
  );
}