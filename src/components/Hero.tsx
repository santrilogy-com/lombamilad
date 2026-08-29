'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { DEADLINE_MAIN } from '@/lib/data';

function useCountdown(target: number) {
  const compute = useCallback(() => Math.max(0, target - Date.now()), [target]);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    setLeft(compute());
    const t = setInterval(() => setLeft(compute()), 1000);
    return () => clearInterval(t);
  }, [compute]);
  const s = Math.floor((left ?? 0) / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export default function Hero() {
  const { days, hours, minutes, seconds } = useCountdown(DEADLINE_MAIN);

  return (
    <section
      id="atas"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 'clamp(48px, 7vw, 104px) clamp(20px, 4vw, 64px) clamp(40px, 5vw, 76px)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-6%',
          bottom: '-12%',
          width: '62%',
          height: '90%',
          backgroundImage: 'radial-gradient(circle, var(--grey-l) 2.1px, transparent 2.2px)',
          backgroundSize: '16px 16px',
          opacity: 0.5,
          maskImage: 'radial-gradient(ellipse at 20% 85%, black 0%, transparent 68%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 20% 85%, black 0%, transparent 68%)',
          animation: 'bloom 11000ms ease-in-out infinite',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '-4%',
          top: '-14%',
          width: '46%',
          height: '80%',
          backgroundImage: 'radial-gradient(circle, var(--olive-l) 2.4px, transparent 2.5px)',
          backgroundSize: '19px 19px',
          opacity: 0.45,
          maskImage: 'radial-gradient(ellipse at 78% 18%, black 0%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 78% 18%, black 0%, transparent 65%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
          gap: 'clamp(32px, 5vw, 72px)',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 26,
              animation: 'riseIn 900ms cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            <span
              style={{
                width: 40,
                height: 2,
                background: 'var(--olive)',
                transformOrigin: 'left',
                animation: 'ruleIn 1100ms cubic-bezier(0.16,1,0.3,1) 200ms both',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--olive-d)',
              }}
            >
              1158 — 1448 H
            </span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--disp)',
              fontWeight: 300,
              fontSize: 'clamp(44px, 6.4vw, 92px)',
              lineHeight: 0.94,
              letterSpacing: '-0.045em',
              margin: 0,
              color: 'var(--ink)',
              textWrap: 'balance',
            }}
          >
            <span
              style={{
                display: 'block',
                animation: 'wipeIn 1200ms cubic-bezier(0.16,1,0.3,1) 160ms both',
              }}
            >
              Lomba Nasional
            </span>
            <span
              style={{
                display: 'block',
                color: 'var(--olive)',
                animation: 'wipeIn 1200ms cubic-bezier(0.16,1,0.3,1) 340ms both',
              }}
            >
              Milad Sidogiri 290
            </span>
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              margin: '30px 0 26px',
              animation: 'riseIn 1000ms cubic-bezier(0.16,1,0.3,1) 620ms both',
            }}
          >
            <span
              className="letter-spacer"
              style={{
                fontFamily: 'var(--disp)',
                fontSize: 'clamp(16px, 1.7vw, 22px)',
                fontWeight: 200,
                letterSpacing: '0.42em',
                textTransform: 'uppercase',
                color: 'var(--grey)',
                transition: 'letter-spacing 700ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              Satu Arah
            </span>
            <span
              style={{
                flex: 1,
                height: 1,
                background: 'linear-gradient(90deg, var(--grey-l), transparent)',
                transformOrigin: 'left',
                animation: 'ruleIn 1400ms cubic-bezier(0.16,1,0.3,1) 800ms both',
              }}
            />
          </div>
          <p
            style={{
              fontSize: 'clamp(15px, 1.15vw, 18px)',
              lineHeight: 1.62,
              maxWidth: '52ch',
              color: '#4b4740',
              margin: '0 0 34px',
              textWrap: 'pretty',
              animation: 'riseIn 1000ms cubic-bezier(0.16,1,0.3,1) 720ms both',
            }}
          >
            Lima cabang lomba tingkat nasional dalam rangkaian Milad ke-290 Pondok Pesantren
            Sidogiri dan Ikhtibar ke-91 Madrasah Miftahul Ulum. Terbuka untuk delegasi pesantren,
            lembaga pendidikan, dan pendaftar mandiri.
          </p>
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              animation: 'riseIn 1000ms cubic-bezier(0.16,1,0.3,1) 820ms both',
            }}
          >
            <Link
              href="/daftar"
              className="btn-ink"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 52,
                padding: '0 30px',
                background: 'var(--ink)',
                color: 'var(--paper)',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Daftar Sekarang
            </Link>
            <Link
              href="/#lomba"
              className="btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 52,
                padding: '0 30px',
                border: '1px solid rgba(36,33,28,0.3)',
                color: 'var(--ink)',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Lihat Ketentuan Lomba
            </Link>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div
            aria-hidden="true"
            data-bloom
            style={{
              position: 'absolute',
              left: '50%',
              top: '48%',
              width: '118%',
              paddingBottom: '118%',
              marginLeft: '-59%',
              transform: 'translateY(-50%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(163,161,155,0.42) 0%, transparent 62%)',
              animation: 'bloom 9000ms ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', animation: 'floaty 8000ms ease-in-out infinite' }}>
            <div
              id="logo-lockup"
              role="img"
              aria-label="Milad ke-290 Pondok Pesantren Sidogiri — Satu Arah"
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1292 / 736',
                transformStyle: 'preserve-3d',
                filter: 'drop-shadow(0 10px 26px rgba(36,33,28,0.16))',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-2.png"
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  animation: 'cmpPop 1000ms cubic-bezier(0.16,1,0.3,1) 120ms both',
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-needle.png"
                alt=""
                className="hero-needle"
                style={{
                  position: 'absolute',
                  left: '72.581%',
                  top: '44.531%',
                  width: '10.217%',
                  height: 'auto',
                  transformOrigin: '50% 50%',
                  animation: 'ndlSweep 1700ms cubic-bezier(0.16,1,0.3,1) 700ms both',
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-3.png"
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  animation: 'numWipe 1300ms cubic-bezier(0.16,1,0.3,1) 1900ms both',
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-1.png"
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  animation: 'layerRise 1000ms cubic-bezier(0.16,1,0.3,1) 2500ms both',
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-4.png"
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  animation: 'layerRise 1000ms cubic-bezier(0.16,1,0.3,1) 2900ms both',
                }}
              />
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              marginTop: 'clamp(20px, 3vw, 40px)',
              background: 'var(--paper2)',
              borderRadius: 3,
              padding: '22px 24px',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--grey)',
                marginBottom: 16,
              }}
            >
              Pendaftaran ditutup dalam
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
              }}
            >
              {[
                { value: days, label: 'Hari' },
                { value: hours, label: 'Jam' },
                { value: minutes, label: 'Menit' },
                { value: seconds, label: 'Detik' },
              ].map((u) => (
                <div key={u.label}>
                  <div
                    style={{
                      fontFamily: 'var(--disp)',
                      fontWeight: 300,
                      fontSize: 'clamp(24px, 2.6vw, 36px)',
                      lineHeight: 1,
                      letterSpacing: '-0.04em',
                      color: 'var(--olive-d)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {String(u.value).padStart(2, '0')}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: 'var(--grey)',
                      marginTop: 8,
                    }}
                  >
                    {u.label}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 16 }}>
              Rabu, 17 Jumadal Ula 1448 H. | 28 Oktober 2026 M.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
