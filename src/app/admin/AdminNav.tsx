'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/pendaftaran', label: 'Pendaftaran' },
  { href: '/admin/penilaian', label: 'Penilaian' },
  { href: '/admin/kuis', label: 'Bank Soal (MQK)' },
  { href: '/admin/kapasitas', label: 'Kuota & Status' },
  { href: '/admin/pengumuman', label: 'Pengumuman' },
];

export default function AdminNav({ email, nama }: { email: string; nama: string }) {
  const pathname = usePathname();
  return (
    <header
      style={{
        borderBottom: '1px solid var(--line)',
        background: 'var(--paper2)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '14px clamp(20px, 4vw, 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/logo.png" alt="Milad 290" width={42} height={24} style={{ height: 24, width: 'auto' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--olive)', textTransform: 'uppercase' }}>
            Panel Admin
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12.5, color: 'var(--grey)' }}>
            {nama} · {email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            style={{
              height: 34,
              padding: '0 14px',
              background: 'transparent',
              border: '1px solid rgba(36,33,28,0.25)',
              borderRadius: 2,
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--ink)',
              cursor: 'pointer',
            }}
          >
            Keluar
          </button>
        </div>
      </div>
      <nav
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '0 clamp(20px, 4vw, 64px)',
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== '/admin' && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                padding: '12px 14px',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--olive-d)' : 'var(--grey)',
                borderBottom: active ? '2px solid var(--olive)' : '2px solid transparent',
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}