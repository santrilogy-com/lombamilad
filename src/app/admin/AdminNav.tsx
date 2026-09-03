'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { ReactNode } from 'react';

const ICON_PROPS = {
  width: 17,
  height: 17,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const icons: Record<string, ReactNode> = {
  dashboard: (
    <svg {...ICON_PROPS}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  ),
  pendaftaran: (
    <svg {...ICON_PROPS}>
      <path d="M8 20v-2a4 4 0 0 1 4-4h1" />
      <circle cx="10" cy="7" r="3.3" />
      <path d="M16 11h5M18.5 8.5v5" />
    </svg>
  ),
  penilaian: (
    <svg {...ICON_PROPS}>
      <path d="M9 11.5l2 2 4-4.2" />
      <circle cx="12" cy="12" r="8.5" />
    </svg>
  ),
  kuis: (
    <svg {...ICON_PROPS}>
      <path d="M5 4.5h11l3 3V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z" />
      <path d="M9 10h6M9 13.5h6M9 6.5h3" />
    </svg>
  ),
  panggilan: (
    <svg {...ICON_PROPS}>
      <rect x="3" y="6.5" width="12" height="11" rx="1.4" />
      <path d="M15 10.2l5-2.6v9l-5-2.6" />
    </svg>
  ),
  kapasitas: (
    <svg {...ICON_PROPS}>
      <path d="M4 20V10.5M11 20V4M18 20v-6.5" />
    </svg>
  ),
  pengumuman: (
    <svg {...ICON_PROPS}>
      <path d="M4 10.5v3a1.3 1.3 0 0 0 1.3 1.3H7l4.4 3.6a.6.6 0 0 0 1-.46V6.06a.6.6 0 0 0-1-.46L7 9.2H5.3A1.3 1.3 0 0 0 4 10.5z" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
    </svg>
  ),
};

const links = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/pendaftaran', label: 'Pendaftaran', icon: 'pendaftaran' },
  { href: '/admin/penilaian', label: 'Penilaian', icon: 'penilaian' },
  { href: '/admin/kuis', label: 'Bank Soal (MQK)', icon: 'kuis' },
  { href: '/admin/panggilan', label: 'Sidang Video', icon: 'panggilan' },
  { href: '/admin/kapasitas', label: 'Kuota & Status', icon: 'kapasitas' },
  { href: '/admin/pengumuman', label: 'Pengumuman', icon: 'pengumuman' },
];

export default function AdminNav({ email, nama }: { email: string; nama: string }) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px 16px' }}>
        <Image src="/logo.png" alt="Milad 290" width={30} height={17} style={{ height: 17, width: 'auto' }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--paper)', textTransform: 'uppercase', opacity: 0.85 }}>
          Panel Admin
        </span>
      </div>

      <nav className="admin-sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 0', flex: 1 }}>
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== '/admin' && pathname.startsWith(l.href));
          return (
            <Link key={l.href} href={l.href} className={`admin-nav-link${active ? ' active' : ''}`}>
              {icons[l.icon]}
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-foot" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, color: 'rgba(239,237,231,0.65)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <div style={{ fontWeight: 600, color: 'var(--paper)' }}>{nama}</div>
          <div>{email}</div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          style={{
            height: 34,
            padding: '0 14px',
            background: 'transparent',
            border: '1px solid rgba(239,237,231,0.28)',
            borderRadius: 4,
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--paper)',
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          Keluar
        </button>
      </div>
    </aside>
  );
}
