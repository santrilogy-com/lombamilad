import { prisma } from '@/lib/prisma';
import { LOMBA } from '@/lib/data';
import KuotaForm from './KuotaForm';

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
      <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(28px,3vw,40px)', letterSpacing: '-0.04em', margin: '0 0 8px' }}>
        Kuota &amp; Kapasitas
      </h1>
      <p style={{ fontSize: 14, color: '#5a554c', margin: '0 0 24px' }}>
        Total {total} dari {kapasitas} slot terisi ({total ? Math.round((total / Math.max(1, kapasitas)) * 100) : 0}%).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 16 }}>
        {perCabang.map((c) => (
          <div key={c.id} style={{ background: 'var(--paper2)', borderRadius: 4, padding: '22px 22px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--olive-d)' }}>{c.short}</div>
            <div style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 15, marginTop: 6, lineHeight: 1.3 }}>{c.name}</div>
            <div style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 30, marginTop: 14 }}>
              {c.jumlah} <span style={{ fontSize: 15, color: 'var(--grey)' }}>/ {c.kuotaDb}</span>
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