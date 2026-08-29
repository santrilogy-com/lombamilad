import Link from 'next/link';
import { CONTACT_WA, WEBSITE, SIDOGIRI_NET } from '@/lib/data';

export default function KontakFooter() {
  return (
    <>
      <section
        id="kontak"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 'clamp(24px, 4vw, 56px)',
          padding: 'clamp(48px, 6vw, 88px) clamp(20px, 4vw, 64px)',
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
            05 / Narahubung
          </div>
          <h2
            style={{
              fontFamily: 'var(--disp)',
              fontWeight: 300,
              fontSize: 'clamp(24px, 2.6vw, 36px)',
              lineHeight: 1.06,
              letterSpacing: '-0.035em',
              margin: '18px 0 0',
            }}
          >
            Sekretaris Sie. Lomba
          </h2>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--grey)',
              marginBottom: 16,
            }}
          >
            WhatsApp
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CONTACT_WA.map((n) => (
              <a
                key={n}
                href={`https://wa.me/62${n.slice(1)}`}
                style={{
                  fontFamily: 'var(--disp)',
                  fontWeight: 300,
                  fontSize: 22,
                  letterSpacing: '-0.02em',
                }}
              >
                {n}
              </a>
            ))}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--grey)',
              marginBottom: 16,
            }}
          >
            Website resmi
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a
              href={`https://${WEBSITE}`}
              style={{
                fontFamily: 'var(--disp)',
                fontWeight: 300,
                fontSize: 22,
                letterSpacing: '-0.02em',
              }}
            >
              {WEBSITE}
            </a>
            <a
              href={`https://${SIDOGIRI_NET}`}
              style={{
                fontFamily: 'var(--disp)',
                fontWeight: 300,
                fontSize: 22,
                letterSpacing: '-0.02em',
              }}
            >
              {SIDOGIRI_NET}
            </a>
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.55,
              color: 'var(--grey)',
              marginTop: 18,
            }}
          >
            Pengumuman kejuaraan disampaikan melalui sidogiri.net dan media sosial resmi Pondok
            Pesantren Sidogiri.
          </div>
        </div>
      </section>

      <footer
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 32,
          flexWrap: 'wrap',
          padding: '36px clamp(20px, 4vw, 64px) 44px',
          borderTop: '1px solid var(--line)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Milad ke-290 Pondok Pesantren Sidogiri"
              style={{ display: 'block', height: 38, width: 'auto' }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: 'var(--olive)',
              }}
            >
              1158 — 1448 H
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--grey)',
              marginTop: 12,
              lineHeight: 1.6,
            }}
          >
            Panitia Milad ke-290 Pondok Pesantren Sidogiri
            <br />
            Ikhtibar ke-91 Madrasah Miftahul Ulum
          </div>
        </div>
        <div style={{ display: 'flex', gap: 22, fontSize: 12, fontWeight: 600 }}>
          <Link href="/#lomba" style={{ color: 'var(--grey)' }}>
            Cabang Lomba
          </Link>
          <Link href="/#jadwal" style={{ color: 'var(--grey)' }}>
            Jadwal
          </Link>
          <Link href="/#alur" style={{ color: 'var(--grey)' }}>
            Pendaftaran
          </Link>
          <Link href="/#kontak" style={{ color: 'var(--grey)' }}>
            Narahubung
          </Link>
        </div>
      </footer>
    </>
  );
}
