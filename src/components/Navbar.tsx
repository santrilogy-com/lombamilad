import Link from 'next/link';

const navLinks = [
  { href: '/#lomba', label: 'Cabang Lomba' },
  { href: '/#jadwal', label: 'Jadwal' },
  { href: '/#alur', label: 'Pendaftaran' },
  { href: '/#hadiah', label: 'Hadiah' },
  { href: '/#kontak', label: 'Narahubung' },
];

export default function Navbar({ inverted = false }: { inverted?: boolean }) {
  const ink = inverted ? 'var(--paper)' : 'var(--ink)';
  const hover = inverted ? 'var(--olive-l)' : 'var(--olive)';
  return (
    <nav
      style={{
        position: inverted ? 'relative' : 'sticky',
        top: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        padding: '14px clamp(20px, 4vw, 64px)',
        background: 'rgba(239,237,231,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--ink)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Milad ke-290 Pondok Pesantren Sidogiri"
          style={{ display: 'block', height: 30, width: 'auto' }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--grey)',
            lineHeight: 1.4,
          }}
        >
          Lomba Nasional
          <br />
          Milad Sidogiri 290
        </span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px, 2vw, 30px)' }}>
        {navLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="nav-link"
            style={{ fontSize: 13, fontWeight: 500, color: ink }}
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="/daftar"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 40,
            padding: '0 22px',
            background: 'var(--olive)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.02em',
            borderRadius: 2,
          }}
          className="btn-olive"
        >
          Daftar
        </Link>
      </div>
    </nav>
  );
}
