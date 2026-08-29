'use client';

import { useEffect, useRef, useState } from 'react';
import { TIMELINE } from '@/lib/data';

export default function JadwalSection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<SVGSVGElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;

    const update = () => {
      raf = 0;
      const wrap = wrapRef.current;
      const needle = needleRef.current;
      if (!wrap || !needle) return;
      const rect = wrap.getBoundingClientRect();
      const viewportMid = window.innerHeight * 0.5;
      const progress = Math.min(1, Math.max(0, (viewportMid - rect.top) / rect.height));
      needle.style.top = `${progress * 100}%`;
      needle.style.opacity = progress > 0.01 && progress < 0.99 ? '1' : '0';
      if (!reduce) {
        needle.style.transform = `translate(-50%, -50%) rotate(${180 + progress * 10}deg)`;
      }

      let idx = -1;
      rowRefs.current.forEach((el, i) => {
        if (!el) return;
        if (el.getBoundingClientRect().top <= viewportMid) idx = i;
      });
      setActiveIndex((prev) => (prev === idx ? prev : idx));
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="jadwal" style={{ padding: 'clamp(48px, 6vw, 92px) clamp(20px, 4vw, 64px)' }}>
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
      </div>

      <div ref={wrapRef} style={{ position: 'relative' }}>
        <div
          aria-hidden="true"
          className="jadwal-line"
          style={{
            position: 'absolute',
            top: 6,
            bottom: 6,
            width: 2,
            marginLeft: -1,
            background: 'var(--line)',
          }}
        />
        <svg
          ref={needleRef}
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="jadwal-needle"
          style={{
            position: 'absolute',
            top: 0,
            width: 26,
            height: 26,
            opacity: 0,
            transform: 'translate(-50%, -50%) rotate(180deg)',
            transition: 'top 100ms linear, opacity 320ms ease',
            filter: 'drop-shadow(0 3px 8px rgba(36,33,28,0.3))',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <path d="M12 1 L17.5 21.5 L12 17 Z" fill="var(--olive-d)" />
          <path d="M12 1 L6.5 21.5 L12 17 Z" fill="var(--olive-l)" />
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {TIMELINE.map((t, i) => {
            const visited = i <= activeIndex;
            const current = i === activeIndex;
            return (
              <div
                key={t.num}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                className="section-hover reveal jadwal-row"
                style={{
                  position: 'relative',
                  display: 'grid',
                  gap: 'clamp(16px, 3vw, 44px)',
                  alignItems: 'start',
                  padding: '20px 0',
                  transition:
                    'background-color 460ms cubic-bezier(0.16,1,0.3,1), opacity 820ms cubic-bezier(0.16,1,0.3,1), transform 820ms cubic-bezier(0.16,1,0.3,1)',
                  transitionDelay: `${Math.min(i, 5) * 60}ms`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 5 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: current ? 16 : 12,
                      height: current ? 16 : 12,
                      borderRadius: '50%',
                      background: visited ? 'var(--olive)' : 'var(--paper)',
                      border: `2px solid ${visited ? 'var(--olive)' : 'var(--grey-l)'}`,
                      boxShadow: current ? '0 0 0 6px var(--olive-p)' : 'none',
                      transition: 'all 420ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--disp)',
                      fontSize: 13,
                      fontWeight: 500,
                      letterSpacing: '0.14em',
                      color: visited ? 'var(--olive)' : 'var(--grey-l)',
                      transition: 'color 420ms ease',
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
                      marginTop: 4,
                      color: visited ? 'var(--ink)' : 'var(--grey)',
                      transition: 'color 420ms ease',
                    }}
                  >
                    {t.title}
                  </div>
                </div>
                <div className="jadwal-detail" style={{ fontSize: 14, lineHeight: 1.6, color: '#4b4740' }}>
                  {t.detail}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
