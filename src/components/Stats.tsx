import { STATS } from '@/lib/data';

export default function Stats() {
  return (
    <section
      aria-hidden="false"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--olive)',
        color: '#fff',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.34) 1.9px, transparent 2px)',
          backgroundSize: '16px 16px',
          animation: 'dotDrift 24000ms linear infinite',
        }}
      />
      <div
        className="g-stats"
        style={{
          position: 'relative',
          display: 'grid',
          gap: 1,
          background: 'rgba(255,255,255,0.22)',
        }}
      >
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="reveal"
            style={{
              background: 'var(--olive)',
              padding: '30px clamp(20px, 3vw, 40px)',
              transitionDelay: `${i * 90}ms`,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--disp)',
                fontWeight: 300,
                fontSize: 'clamp(26px, 2.6vw, 38px)',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                opacity: 0.82,
                marginTop: 12,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
