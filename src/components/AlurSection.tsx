import Link from 'next/link';
import { STEPS } from '@/lib/data';

export default function AlurSection() {
  return (
    <section
      id="alur"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 0.85fr) minmax(0, 1.15fr)',
        gap: 'clamp(32px, 5vw, 72px)',
        padding: 'clamp(48px, 6vw, 92px) clamp(20px, 4vw, 64px)',
        borderTop: '1px solid var(--line)',
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
          03 / Pendaftaran
        </div>
        <h2
          style={{
            fontFamily: 'var(--disp)',
            fontWeight: 300,
            fontSize: 'clamp(30px, 3.6vw, 52px)',
            lineHeight: 1.02,
            letterSpacing: '-0.04em',
            margin: '18px 0 22px',
          }}
        >
          Alur pendaftaran
        </h2>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.62,
            color: '#4b4740',
            maxWidth: '44ch',
            margin: '0 0 34px',
            textWrap: 'pretty',
          }}
        >
          Seluruh pendaftaran dan pengiriman karya dilakukan melalui website{' '}
          <strong style={{ fontWeight: 700 }}>miladsidogiri.id</strong>. Kuota tiap lomba 100
          orang dan pendaftaran ditutup setelah kuota terpenuhi.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {STEPS.map((st) => (
            <div
              key={st.num}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr',
                gap: 8,
                padding: '20px 0',
                borderTop: '1px solid var(--line)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--disp)',
                  fontWeight: 300,
                  fontSize: 14,
                  color: 'var(--olive)',
                }}
              >
                {st.num}
              </span>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--disp)',
                    fontWeight: 300,
                    fontSize: 17,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {st.title}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: '#5a554c',
                    marginTop: 6,
                  }}
                >
                  {st.detail}
                </div>
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--line)' }} />
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'var(--paper2)',
          borderRadius: 3,
          padding: 'clamp(28px, 3.5vw, 48px)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: -40,
            bottom: -60,
            width: 300,
            height: 300,
            backgroundImage:
              'radial-gradient(circle, var(--grey-l) 2.1px, transparent 2.2px)',
            backgroundSize: '16px 16px',
            opacity: 0.42,
            maskImage: 'radial-gradient(circle at 30% 70%, black, transparent 66%)',
            WebkitMaskImage: 'radial-gradient(circle at 30% 70%, black, transparent 66%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div
            style={{
              fontFamily: 'var(--disp)',
              fontWeight: 300,
              fontSize: 'clamp(22px, 2.4vw, 30px)',
              letterSpacing: '-0.03em',
              marginBottom: 14,
            }}
          >
            Siap mendaftar?
          </div>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.62,
              color: '#4b4740',
              maxWidth: '40ch',
              margin: '0 0 30px',
            }}
          >
            Isi formulir pendaftaran lengkap — data diri, unggah identitas, dan pilihan cabang
            lomba — pada satu halaman khusus.
          </p>
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
            Isi Formulir Pendaftaran
          </Link>
          <div style={{ fontSize: 13, color: 'var(--grey)', marginTop: 18 }}>
            Kuota 100 peserta per cabang. Ditutup saat kuota penuh.
          </div>
        </div>
      </div>
    </section>
  );
}
