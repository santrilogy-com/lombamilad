import { prisma } from '@/lib/prisma';
import { LOMBA } from '@/lib/data';
import PendaftarAdminTable from './PendaftarAdminTable';

export const dynamic = 'force-dynamic';

const STATUS_MAP: Record<string, string> = {
  MENUNGGU_VERIFIKASI: 'Menunggu verifikasi',
  TERVERIFIKASI: 'Terverifikasi',
  DITOLAK: 'Ditolak',
  LOLOS_PENYISIHAN: 'Lolos penyisihan',
  GUGUR_PENYISIHAN: 'Gugur penyisihan',
  LOLOS_FINAL: 'Lolos final',
  JUARA_1: 'Juara 1',
  JUARA_2: 'Juara 2',
  JUARA_3: 'Juara 3',
};

export default async function AdminPendaftaranPage({
  searchParams,
}: {
  searchParams: { cabang?: string; q?: string };
}) {
  const cabangId = searchParams.cabang || '';
  const q = (searchParams.q || '').trim();

  const where: any = {
    ...(cabangId ? { cabangId } : {}),
    ...(q
      ? {
          OR: [
            { nama: { contains: q, mode: 'insensitive' } },
            { nomorPendaftaran: { contains: q, mode: 'insensitive' } },
            { asalLembaga: { contains: q, mode: 'insensitive' } },
            { whatsapp: { contains: q } },
          ],
        }
      : {}),
  };

  const [pendaftar, total, perCabang] = await Promise.all([
    prisma.pendaftar.findMany({
      where,
      include: { nilai: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.pendaftar.count(),
    Promise.all(
      LOMBA.map(async (c) => ({ id: c.id, short: c.short, jumlah: await prisma.pendaftar.count({ where: { cabangId: c.id } }) }))
    ),
  ]);

  const serialized = pendaftar.map((p) => ({
    id: p.id,
    nomorPendaftaran: p.nomorPendaftaran,
    nama: p.nama,
    asalLembaga: p.asalLembaga,
    whatsapp: p.whatsapp,
    cabangId: p.cabangId,
    cabangNama: LOMBA.find((c) => c.id === p.cabangId)?.name || p.cabangId,
    status: STATUS_MAP[p.status] || p.status,
    statusKode: p.status,
    usia: p.usia,
    tanggalDaftar: p.createdAt.toISOString(),
    catatan: p.verifikasiCatatan,
    fileIdentitas: p.fileIdentitas,
    fileSubmisi: p.fileSubmisi,
    nilaiPenyisihan: p.nilai?.nilaiPenyisihan ?? null,
    nilaiFinal: p.nilai?.nilaiFinal ?? null,
  }));

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(28px,3vw,40px)', letterSpacing: '-0.04em', margin: '0 0 8px' }}>
        Kelola Pendaftaran
      </h1>
      <p style={{ fontSize: 14, color: '#5a554c', margin: '0 0 24px' }}>
        Total {total} pendaftar. Verifikasi berkas dan kelola status peserta.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
        <a
          href="/admin/pendaftaran"
          style={{
            padding: '8px 14px',
            fontSize: 12.5,
            fontWeight: 600,
            borderRadius: 99,
            background: !cabangId ? 'var(--olive)' : 'var(--paper2)',
            color: !cabangId ? '#fff' : 'var(--ink)',
          }}
        >
          Semua ({total})
        </a>
        {perCabang.map((c) => (
          <a
            key={c.id}
            href={`/admin/pendaftaran?cabang=${c.id}`}
            style={{
              padding: '8px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 99,
              background: cabangId === c.id ? 'var(--olive)' : 'var(--paper2)',
              color: cabangId === c.id ? '#fff' : 'var(--ink)',
            }}
          >
            {c.short} ({c.jumlah})
          </a>
        ))}
      </div>

      <PendaftarAdminTable pendaftar={serialized} searchQuery={q} cabangId={cabangId} />
    </div>
  );
}