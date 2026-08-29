import { TIMELINE } from '@/lib/data';

export default function JadwalSection() {
  return (
    <section id="jadwal" style={{ padding: 'clamp(48px, 6vw, 92px) clamp(20px, 4vw, 64px)' }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--olive)',
        }}
      >
        02 / Jadwal
      </div>
      <h2
        style={{
          fontFamily: 'var(--disp)',
          fontWeight: 300,
          fontSize: 'clamp(30px, 3.6vw, 52px)',
          lineHeight: 1.02,
          letterSpacing: '-0.04em',
          margin: '18px 0 44px',
        }}
      >
        Rangkaian pelaksanaan
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {TIMELINE.map((t) => (
          <div
            key={t.num}
            className="section-hover"
            style={{
              display: 'grid',
              gridTemplateColumns: '88px minmax(0, 1fr) minmax(0, 1.3fr)',
              gap: 'clamp(16px, 3vw, 44px)',
              alignItems: 'start',
              padding: '26px 0',
              borderTop: '1px solid var(--line)',
              transition: 'background-color 460ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--disp)',
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.14em',
                color: 'var(--olive)',
              }}
            >
              {t.num}
            </div>
            <div
              style={{
                fontFamily: 'var(--disp)',
                fontSize: 'clamp(17px, 1.6vw, 22px)',
                fontWeight: 500,
                letterSpacing: '-0.025em',
                lineHeight: 1.22,
              }}
            >
              {t.title}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: '#4b4740' }}>{t.detail}</div>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--line)' }} />
      </div>
    </section>
  );
}
