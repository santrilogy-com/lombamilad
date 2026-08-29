import Link from 'next/link';

export default function CTABanner() {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--ink)',
        color: 'var(--paper)',
        padding: 'clamp(60px, 8vw, 120px) clamp(20px, 4vw, 64px)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '-6%',
          top: '-20%',
          width: '60%',
          height: '140%',
          backgroundImage:
            'radial-gradient(circle, rgba(195,182,139,0.6) 2.4px, transparent 2.5px)',
          backgroundSize: '20px 20px',
          opacity: 0.5,
          maskImage: 'radial-gradient(ellipse at 70% 40%, black, transparent 68%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 70% 40%, black, transparent 68%)',
        }}
      />
      <div style={{ position: 'relative', maxWidth: '46ch' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--olive-l)',
          }}
        >
          Milad ke-290 Pondok Pesantren Sidogiri
        </div>
        <div
          style={{
            fontFamily: 'var(--disp)',
            fontWeight: 300,
            fontSize: 'clamp(48px, 9vw, 128px)',
            lineHeight: 0.9,
            letterSpacing: '-0.05em',
            margin: '26px 0 8px',
          }}
        >
          Satu Arah
        </div>
        <div
          style={{
            fontFamily: 'var(--disp)',
            fontSize: 'clamp(13px, 1.3vw, 17px)',
            fontWeight: 200,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: 'var(--olive-l)',
            marginBottom: 30,
          }}
        >
          dalam Bermanhaj dan Bermadzhab
        </div>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            margin: '0 0 34px',
            maxWidth: '40ch',
            color: 'rgba(239,237,231,0.78)',
          }}
        >
          Kuota tiap cabang terbatas 100 peserta. Pendaftaran ditutup setelah kuota terpenuhi.
        </p>
        <Link
          href="/daftar"
          className="btn-paper"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 54,
            padding: '0 32px',
            background: 'var(--paper)',
            color: 'var(--ink)',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Daftar Sekarang
        </Link>
      </div>
    </section>
  );
}
