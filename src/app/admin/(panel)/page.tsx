import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { LOMBA } from '@/lib/data';
import GantiPasswordCard from './GantiPasswordCard';
import { Badge, PageHeader, SectionHeader, StatTile, cardStyle, thStyle, tdStyle } from '../ui';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [total, grouped, recent, menunggu] = await Promise.all([
    prisma.pendaftar.count(),
    prisma.pendaftar.groupBy({ by: ['cabangId'], _count: { _all: true } }),
    prisma.pendaftar.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nomorPendaftaran: true,
        nama: true,
        asalLembaga: true,
        cabangId: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.pendaftar.count({ where: { status: 'MENUNGGU_VERIFIKASI' } }),
  ]);

  const countByCabang = new Map(grouped.map((g) => [g.cabangId, g._count._all]));
  const perCabang = LOMBA.map((c) => ({ cabang: c, jumlah: countByCabang.get(c.id) || 0 }));

  return (
    <div>
      <PageHeader title="Dashboard" description="Ringkasan pendaftaran Lomba Nasional Milad Sidogiri 290." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
        <StatTile label="Total pendaftar" value={total} />
        <StatTile label="Menunggu verifikasi" value={menunggu} tone="warn" />
      </div>

      <section style={{ marginBottom: 36 }}>
        <SectionHeader title="Kuota per cabang" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 14 }}>
          {perCabang.map(({ cabang, jumlah }) => (
            <div key={cabang.id} style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--olive-d)' }}>{cabang?.short ?? cabang.id}</div>
              <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 24, marginTop: 8, letterSpacing: '-0.01em' }}>
                {jumlah} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--grey)' }}>/ {cabang?.kuota ?? 100}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(36,33,28,0.1)', borderRadius: 99, marginTop: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--olive)', width: `${Math.min(100, (jumlah / (cabang?.kuota ?? 100)) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Pendaftar terbaru"
          actions={
            <Link href="/admin/pendaftaran" style={{ fontSize: 13, fontWeight: 600 }}>
              Lihat semua →
            </Link>
          }
        />
        {recent.length === 0 ? (
          <div style={{ ...cardStyle, fontSize: 14, color: 'var(--grey)' }}>
            Belum ada pendaftar. Formulir pendaftaran aktif di halaman publik.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 6 }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={thStyle}>No. Pendaftaran</th>
                  <th style={thStyle}>Nama</th>
                  <th style={thStyle}>Asal</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r: any) => (
                  <tr key={r.id}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--olive-d)', whiteSpace: 'nowrap' }}>{r.nomorPendaftaran}</td>
                    <td style={{ ...tdStyle, fontSize: 13.5 }}>{r.nama}</td>
                    <td style={tdStyle}>{r.asalLembaga}</td>
                    <td style={tdStyle}>
                      <Badge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div style={{ marginTop: 36 }}>
        <GantiPasswordCard />
      </div>
    </div>
  );
}