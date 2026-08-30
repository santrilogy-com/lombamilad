'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CONTACT_WA } from '@/lib/data';

const TAUTAN_CEPAT = [
  { href: '/cek-status', label: 'Dashboard Peserta / Cek Status' },
  { href: '/daftar', label: 'Formulir Pendaftaran' },
  { href: '/lupa-status', label: 'Lupa Nomor / Token' },
  { href: '/seleksi', label: 'Jadwal & Seleksi' },
  { href: '/info-peserta', label: 'Info untuk Peserta' },
];

const FAQ = [
  {
    q: 'Bagaimana cara cek status pendaftaran saya?',
    a: 'Buka halaman Dashboard Peserta, masukkan nomor pendaftaran dan token yang Anda terima saat mendaftar. Status, nilai, dan pengumuman akan tampil di sana.',
    href: '/cek-status',
    label: 'Buka Dashboard Peserta',
  },
  {
    q: 'Saya lupa nomor pendaftaran atau token, bagaimana?',
    a: 'Gunakan halaman Lupa Nomor/Token dan masukkan nomor WhatsApp yang Anda daftarkan — nomor pendaftaran dan token akan dikirimkan ulang.',
    href: '/lupa-status',
    label: 'Buka Lupa Nomor / Token',
  },
  {
    q: 'Bagaimana cara mengerjakan Kuis Babak I MQK?',
    a: 'Kuis Babak I hanya untuk cabang MQK, dapat diakses dari kartu "Kuis Babak I" di Dashboard Peserta setelah panitia membuka aksesnya. 50 soal, 15 detik per soal, hanya bisa dikerjakan satu kali.',
    href: '/cek-status',
    label: 'Buka Dashboard Peserta',
  },
  {
    q: 'Kapan jadwal penyisihan dan final?',
    a: 'Jadwal lengkap tiap tahap (penyisihan, technical meeting, final) ada di halaman Jadwal & Seleksi.',
    href: '/seleksi',
    label: 'Lihat Jadwal & Seleksi',
  },
  {
    q: 'Bagaimana cara menghubungi panitia?',
    a: `Hubungi panitia via WhatsApp di ${CONTACT_WA.join(' atau ')}.`,
  },
];

export default function HelpFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const hidden = pathname?.startsWith('/admin') || pathname === '/kuis-mqk';
  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Tutup bantuan' : 'Buka bantuan'}
        aria-expanded={open}
        style={{
          position: 'fixed',
          right: 'clamp(16px, 3vw, 28px)',
          bottom: 'clamp(16px, 3vw, 28px)',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--ink)',
          color: 'var(--paper)',
          border: 0,
          boxShadow: '0 10px 28px rgba(36,33,28,0.28)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 150,
        }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5h16v11H8l-4 4V5z" />
            <path d="M8 9h8M8 12h5" />
          </svg>
        )}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Bantuan dan pertanyaan umum"
          style={{
            position: 'fixed',
            right: 'clamp(12px, 3vw, 28px)',
            bottom: 'clamp(80px, 12vw, 96px)',
            width: 'min(380px, calc(100vw - 24px))',
            maxHeight: 'min(560px, calc(100vh - 140px))',
            overflowY: 'auto',
            background: 'var(--paper)',
            borderRadius: 6,
            boxShadow: '0 18px 48px rgba(36,33,28,0.28)',
            zIndex: 149,
            border: '1px solid var(--line)',
          }}
        >
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line)', background: 'var(--paper2)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--olive-d)' }}>
              Bantuan
            </div>
            <div style={{ fontFamily: 'var(--disp)', fontWeight: 500, fontSize: 18, letterSpacing: '-0.02em', marginTop: 4 }}>
              FAQ & Navigasi Cepat
            </div>
          </div>

          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 10 }}>
              Tautan cepat
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
              {TAUTAN_CEPAT.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={() => setOpen(false)}
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    padding: '9px 12px',
                    borderRadius: 3,
                    background: 'var(--paper2)',
                  }}
                >
                  {t.label} →
                </Link>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 10 }}>
              Pertanyaan umum
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FAQ.map((f, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 3, overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '11px 12px',
                        background: 'transparent',
                        border: 0,
                        cursor: 'pointer',
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: 'var(--ink)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <span>{f.q}</span>
                      <span style={{ flexShrink: 0, color: 'var(--grey)' }}>{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen ? (
                      <div style={{ padding: '0 12px 12px', fontSize: 13, lineHeight: 1.55, color: '#4b4740' }}>
                        {f.a}
                        {f.href ? (
                          <div style={{ marginTop: 8 }}>
                            <Link href={f.href} onClick={() => setOpen(false)} style={{ fontSize: 12.5, fontWeight: 700 }}>
                              {f.label} →
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
