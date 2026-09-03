import { prisma } from '@/lib/prisma';
import { LOMBA } from '@/lib/data';
import KuotaForm from './KuotaForm';
import { PageHeader, cardStyle } from '../../ui';

export const dynamic = 'force-dynamic';

export default async function AdminKapasitasPage() {
  const cabangs = await prisma.cabang.findMany();
  const perCabang = await Promise.all(
    LOMBA.map(async (c) => {
      const db = cabangs.find((x) => x.id === c.id);
      const jumlah = await prisma.pendaftar.count({ where: { cabangId: c.id } });
      return { ...c, kuotaDb: db?.kuota ?? c.kuota, jumlah };
    })
  );

  const total = perCabang.reduce((a, b) => a + b.jumlah, 0);
  const kapasitas = perCabang.reduce((a, b) => a + b.kuotaDb, 0);

  return (
    <div>
      <PageHeader
        title="Kuota & Kapasitas"
        description={`Total ${total} dari ${kapasitas} slot terisi (${total ? Math.round((total / Math.max(1, kapasitas)) * 100) : 0}%).`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 16 }}>
        {perCabang.map((c) => (
          <div key={c.id} style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--olive-d)' }}>{c.short}</div>
            <div style={{ fontFamily: 'var(--disp)', fontWeight: 600, fontSize: 14.5, marginTop: 6, lineHeight: 1.3 }}>{c.name}</div>
            <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 26, marginTop: 14, letterSpacing: '-0.01em' }}>
              {c.jumlah} <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--grey)' }}>/ {c.kuotaDb}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(36,33,28,0.1)', borderRadius: 99, marginTop: 12, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: c.jumlah >= c.kuotaDb ? '#a94442' : 'var(--olive)', width: `${Math.min(100, (c.jumlah / Math.max(1, c.kuotaDb)) * 100)}%` }} />
            </div>
            {c.jumlah >= c.kuotaDb ? (
              <div style={{ fontSize: 12, fontWeight: 700, color: '#a94442', marginTop: 10 }}>Kuota penuh — pendaftaran otomatis tertutup.</div>
            ) : null}
            <KuotaForm cabangId={c.id} nama={c.name} currentKuota={c.kuotaDb} />
          </div>
        ))}
      </div>
    </div>
  );
}