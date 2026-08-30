'use client';

import { useRef, useState } from 'react';
import { LOMBA } from '@/lib/data';

export default function LombaSection() {
  const [active, setActive] = useState(0);
  const current = LOMBA[active];
  const panelRef = useRef<HTMLDivElement>(null);

  function selectTab(i: number) {
    setActive(i);
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return (
    <section id="lomba" style={{ padding: 'clamp(48px, 6vw, 92px) clamp(20px, 4vw, 64px)' }}>
      <div
        className="reveal"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 40,
          flexWrap: 'wrap',
          marginBottom: 36,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--olive)',
            }}
          >
            01 / Cabang Lomba
          </div>
          <h2
            style={{
              fontFamily: 'var(--disp)',
              fontWeight: 300,
              fontSize: 'clamp(30px, 3.6vw, 52px)',
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              margin: '18px 0 0',
            }}
          >
            Lima cabang, satu arah
          </h2>
        </div>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.6,
            maxWidth: '40ch',
            color: '#4b4740',
            margin: 0,
          }}
        >
          Pilih cabang untuk membaca persyaratan, teknis pelaksanaan, kriteria penilaian, dan
          hadiahnya.
        </p>
      </div>

      <div className="reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {LOMBA.map((tab, i) => {
          const isActive = i === active;
          return (
            <button
              key={tab.id}
              type="button"
              className="tab-btn"
              onClick={() => selectTab(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                height: 44,
                padding: '0 18px',
                background: isActive ? 'var(--olive)' : 'transparent',
                color: isActive ? '#fff' : 'var(--ink)',
                border: `1px solid ${isActive ? 'var(--olive)' : 'rgba(36,33,28,0.18)'}`,
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  opacity: 0.65,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{tab.short}</span>
            </button>
          );
        })}
      </div>

      <div
        ref={panelRef}
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--paper2)',
          borderRadius: 3,
          padding: 'clamp(28px, 3.5vw, 52px)',
          scrollMarginTop: 88,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: -60,
            top: -60,
            width: 340,
            height: 340,
            backgroundImage: 'url(/ornamen-atas.png)',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'right top',
            opacity: 0.55,
            animation: 'ornamentGlow 10000ms ease-in-out infinite 200ms',
          }}
        />
        <div
          key={current.id}
          className="g-lomba-detail"
          style={{
            position: 'relative',
            display: 'grid',
            gap: 'clamp(28px, 4vw, 60px)',
            animation: 'riseIn 560ms cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--olive)',
              }}
            >
              {current.kicker}
            </div>
            <h3
              style={{
                fontFamily: 'var(--disp)',
                fontWeight: 300,
                fontSize: 'clamp(24px, 2.4vw, 34px)',
                lineHeight: 1.08,
                letterSpacing: '-0.035em',
                margin: '16px 0 16px',
              }}
            >
              {current.name}
            </h3>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.62,
                color: '#4b4740',
                margin: '0 0 26px',
                textWrap: 'pretty',
              }}
            >
              {current.intro}
            </p>
            <div
              style={{
                display: 'inline-block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--olive-d)',
                border: '1px solid var(--olive-l)',
                borderRadius: 2,
                padding: '8px 14px',
              }}
            >
              {current.deadlineTag}
            </div>
            <div style={{ marginTop: 32, borderTop: '1px solid var(--line)' }}>
              {current.prizes.map((p) => (
                <div
                  key={p.juara}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 18,
                    padding: '14px 0',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--grey)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.juara}
                  </span>
                  <span style={{ fontSize: 14, lineHeight: 1.45, textAlign: 'right' }}>
                    {p.hadiah}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div
            className="g-lomba-inner"
            style={{
              display: 'grid',
              gap: 'clamp(20px, 2.4vw, 34px)',
            }}
          >
            {current.sections.map((sec) => (
              <div key={sec.h}>
                <div
                  style={{
                    fontFamily: 'var(--disp)',
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--ink)',
                    paddingBottom: 12,
                    borderBottom: '2px solid var(--olive)',
                  }}
                >
                  {sec.h}
                </div>
                <ul
                  style={{
                    margin: '16px 0 0',
                    padding: 0,
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {sec.items.map((item, idx) => (
                    <li
                      key={idx}
                      style={{
                        fontSize: 14,
                        lineHeight: 1.55,
                        color: '#4b4740',
                        paddingLeft: 16,
                        position: 'relative',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '0.75em',
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: 'var(--olive)',
                        }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
