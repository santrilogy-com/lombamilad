import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { LOMBA } from '@/lib/data';
import GantiPasswordCard from './GantiPasswordCard';

export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  MENUNGGU_VERIFIKASI: { label: 'Menunggu verifikasi', bg: '#f7ecd0', color: '#8a6d1f' },
  TERVERIFIKASI: { label: 'Terverifikasi', bg: 'var(--olive-p)', color: '#4f6b1f' },
  DITOLAK: { label: 'Ditolak', bg: '#f4dede', color: '#a94442' },
  LOLOS_PENYISIHAN: { label: 'Lolos penyisihan', bg: '#dbeedb', color: '#2e7d2e' },
  GUGUR_PENYISIHAN: { label: 'Gugur penyisihan', bg: '#ecece6', color: '#7a7a72' },
  LOLOS_FINAL: { label: 'Lolos final', bg: '#dbeedb', color: '#2e7d2e' },
  JUARA_1: { label: 'Juara 1', bg: 'var(--olive-p)', color: '#675c37' },
  JUARA_2: { label: 'Juara 2', bg: 'var(--olive-p)', color: '#675c37' },
  JUARA_3: { label: 'Juara 3', bg: 'var(--olive-p)', color: '#675c37' },
};

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

  const badge = (s: string) => STATUS_BADGE[s] || { label: s, bg: '#ecece6', color: '#7a7a72' };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(28px,3vw,40px)', letterSpacing: '-0.04em', margin: '0 0 8px' }}>
        Dashboard
      </h1>
      <p style={{ fontSize: 14, color: '#5a554c', margin: '0 0 28px' }}>
        Ringkasan pendaftaran Lomba Nasional Milad Sidogiri 290.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: 'var(--paper2)', borderRadius: 4, padding: '26px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--grey)' }}>Total pendaftar</div>
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 40, letterSpacing: '-0.04em', marginTop: 8, color: 'var(--ink)' }}>{total}</div>
        </div>
        <div style={{ background: '#f7ecd0', borderRadius: 4, padding: '26px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8a6d1f' }}>Menunggu verifikasi</div>
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 40, letterSpacing: '-0.04em', marginTop: 8, color: '#8a6d1f' }}>{menunggu}</div>
        </div>
      </div>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 20, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
          Kuota per cabang
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 14 }}>
          {perCabang.map(({ cabang, jumlah }) => (
            <div key={cabang.id} style={{ background: 'var(--paper2)', borderRadius: 4, padding: '18px 20px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--olive-d)' }}>{cabang?.short ?? cabang.id}</div>
              <div style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 26, marginTop: 8 }}>
                {jumlah} <span style={{ fontSize: 14, color: 'var(--grey)' }}>/ {cabang?.kuota ?? 100}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(36,33,28,0.1)', borderRadius: 99, marginTop: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--olive)', width: `${Math.min(100, (jumlah / (cabang?.kuota ?? 100)) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 20, letterSpacing: '-0.02em', margin: 0 }}>
            Pendaftar terbaru
          </h2>
          <Link href="/admin/pendaftaran" style={{ fontSize: 13, fontWeight: 600 }}>
            Lihat semua →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div style={{ background: 'var(--paper2)', borderRadius: 4, padding: '28px 30px', fontSize: 14, color: '#5a554c' }}>
            Belum ada pendaftar. Formulir pendaftaran aktif di halaman publik.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--ink)' }}>No. Pendaftaran</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--ink)' }}>Nama</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--ink)' }}>Asal</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--ink)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r: any) => {
                  const b = badge(r.status);
                  return (
                    <tr key={r.id}>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--line)', fontSize: 13, fontWeight: 600, color: 'var(--olive-d)', whiteSpace: 'nowrap' }}>{r.nomorPendaftaran}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--line)', fontSize: 13.5 }}>{r.nama}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>{r.asalLembaga}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--line)' }}>
                        <span style={{ background: b.bg, color: b.color, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 2, padding: '5px 10px', whiteSpace: 'nowrap' }}>{b.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <GantiPasswordCard />
    </div>
  );
}