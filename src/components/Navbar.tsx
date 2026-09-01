'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const navLinks = [
  { href: '/#lomba', label: 'Cabang Lomba' },
  { href: '/#jadwal', label: 'Jadwal' },
  { href: '/#alur', label: 'Pendaftaran' },
  { href: '/#hadiah', label: 'Hadiah' },
  { href: '/#kontak', label: 'Narahubung' },
];

export default function Navbar({ inverted = false }: { inverted?: boolean }) {
  const [open, setOpen] = useState(false);
  const ink = inverted ? 'var(--paper)' : 'var(--ink)';

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
        <Image
          src="/logo.png"
          alt="Milad ke-290 Pondok Pesantren Sidogiri"
          width={53}
          height={30}
          priority
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

      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px, 2vw, 30px)' }}>
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

      <button
        type="button"
        className="nav-toggle"
        aria-label={open ? 'Tutup menu' : 'Buka menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          background: 'transparent',
          border: '1px solid rgba(36,33,28,0.18)',
          borderRadius: 2,
          cursor: 'pointer',
        }}
      >
        <span className={`burger${open ? ' is-open' : ''}`} />
      </button>

      <div className={`mobile-menu${open ? ' is-open' : ''}`}>
        {navLinks.map((l) => (
          <Link key={l.href} href={l.href} className="nav-link" onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
        <Link
          href="/daftar"
          onClick={() => setOpen(false)}
          className="btn-olive"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 46,
            marginTop: 14,
            marginBottom: 16,
            background: 'var(--olive)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Daftar
        </Link>
      </div>
    </nav>
  );
}
