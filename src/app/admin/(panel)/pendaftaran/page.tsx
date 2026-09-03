import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { LOMBA } from '@/lib/data';
import PendaftarAdminTable from './PendaftarAdminTable';
import { PageHeader, chipStyle, statusMeta } from '../../ui';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export default async function AdminPendaftaranPage({
  searchParams,
}: {
  searchParams: { cabang?: string; q?: string; page?: string };
}) {
  const cabangId = searchParams.cabang || '';
  const q = (searchParams.q || '').trim();
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);

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

  const [pendaftar, matchCount, total, grouped] = await Promise.all([
    prisma.pendaftar.findMany({
      where,
      include: { nilai: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.pendaftar.count({ where }),
    prisma.pendaftar.count(),
    prisma.pendaftar.groupBy({ by: ['cabangId'], _count: { _all: true } }),
  ]);

  const countByCabang = new Map(grouped.map((g) => [g.cabangId, g._count._all]));
  const perCabang = LOMBA.map((c) => ({ id: c.id, short: c.short, jumlah: countByCabang.get(c.id) || 0 }));
  const totalPages = Math.max(1, Math.ceil(matchCount / PAGE_SIZE));

  const serialized = pendaftar.map((p) => ({
    id: p.id,
    nomorPendaftaran: p.nomorPendaftaran,
    nama: p.nama,
    asalLembaga: p.asalLembaga,
    whatsapp: p.whatsapp,
    cabangId: p.cabangId,
    cabangNama: LOMBA.find((c) => c.id === p.cabangId)?.name || p.cabangId,
    status: statusMeta(p.status).label,
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
      <PageHeader
        title="Kelola Pendaftaran"
        description={`Total ${total} pendaftar. Verifikasi berkas dan kelola status peserta.`}
      />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
        <Link href="/admin/pendaftaran" style={chipStyle(!cabangId)}>
          Semua ({total})
        </Link>
        {perCabang.map((c) => (
          <Link key={c.id} href={`/admin/pendaftaran?cabang=${c.id}`} style={chipStyle(cabangId === c.id)}>
            {c.short} ({c.jumlah})
          </Link>
        ))}
      </div>

      <PendaftarAdminTable pendaftar={serialized} searchQuery={q} cabangId={cabangId} />

      {totalPages > 1 ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 22 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            if (cabangId) params.set('cabang', cabangId);
            if (q) params.set('q', q);
            if (p > 1) params.set('page', String(p));
            const qs = params.toString();
            return (
              <Link
                key={p}
                href={`/admin/pendaftaran${qs ? `?${qs}` : ''}`}
                style={{
                  minWidth: 34,
                  height: 34,
                  padding: '0 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 2,
                  background: p === page ? 'var(--olive)' : 'var(--paper2)',
                  color: p === page ? '#fff' : 'var(--ink)',
                }}
              >
                {p}
              </Link>
            );
          })}
          <span style={{ fontSize: 12.5, color: 'var(--grey)', marginLeft: 8 }}>
            Halaman {page} dari {totalPages} ({matchCount} pendaftar)
          </span>
        </div>
      ) : null}
    </div>
  );
}