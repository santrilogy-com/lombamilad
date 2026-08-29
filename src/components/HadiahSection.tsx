import { LOMBA, FASILITAS, PRIZE_SECTION_HEADERS } from '@/lib/data';

export default function HadiahSection() {
  return (
    <section
      id="hadiah"
      style={{
        padding: 'clamp(48px, 6vw, 92px) clamp(20px, 4vw, 64px)',
        borderTop: '1px solid var(--line)',
      }}
    >
      <div className="reveal">
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--olive)',
          }}
        >
          04 / Hadiah &amp; Fasilitas
        </div>
        <h2
          style={{
            fontFamily: 'var(--disp)',
            fontWeight: 300,
            fontSize: 'clamp(30px, 3.6vw, 52px)',
            lineHeight: 1.02,
            letterSpacing: '-0.04em',
            margin: '18px 0 40px',
          }}
        >
          Total hadiah seluruh cabang
        </h2>
      </div>

      <div className="table-scroll">
        <div style={{ minWidth: 620 }}>
          <div
            className="g-hadiah-grid"
            style={{
              display: 'grid',
              gap: 20,
              paddingBottom: 14,
              borderBottom: '2px solid var(--ink)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--grey)',
            }}
          >
            {PRIZE_SECTION_HEADERS.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          {LOMBA.map((row, i) => (
            <div
              key={row.id}
              className="section-hover g-hadiah-grid reveal"
              style={{
                display: 'grid',
                gap: 20,
                padding: '20px 0',
                borderBottom: '1px solid var(--line)',
                transition: 'background-color 420ms ease, opacity 820ms cubic-bezier(0.16,1,0.3,1), transform 820ms cubic-bezier(0.16,1,0.3,1)',
                transitionDelay: `${Math.min(i, 5) * 60}ms`,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--disp)',
                  fontWeight: 300,
                  fontSize: 17,
                  letterSpacing: '-0.02em',
                }}
              >
                {row.name}
              </span>
              <span style={{ fontSize: 14, color: 'var(--olive-d)', fontWeight: 600 }}>
                {row.p[0]}
              </span>
              <span style={{ fontSize: 14, color: '#4b4740' }}>{row.p[1]}</span>
              <span style={{ fontSize: 14, color: '#4b4740' }}>{row.p[2]}</span>
            </div>
          ))}
        </div>
      </div>

      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: '#5a554c',
          margin: '30px 0 36px',
        }}
      >
        Setiap juara menerima uang tunai, medali, trofi, dan sertifikat juara.
      </p>

      <div
        className="g-facilities"
        style={{
          display: 'grid',
          gap: 20,
        }}
      >
        {FASILITAS.map((f, i) => (
          <div
            key={f.title}
            className="card-lift reveal"
            style={{
              background: 'var(--paper2)',
              borderRadius: 3,
              padding: '26px 24px',
              transition: 'transform 520ms cubic-bezier(0.16,1,0.3,1), box-shadow 520ms cubic-bezier(0.16,1,0.3,1), opacity 820ms cubic-bezier(0.16,1,0.3,1)',
              transitionDelay: `${i * 80}ms`,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--disp)',
                fontWeight: 300,
                fontSize: 17,
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
              }}
            >
              {f.title}
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: '#5a554c',
                marginTop: 10,
              }}
            >
              {f.detail}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
