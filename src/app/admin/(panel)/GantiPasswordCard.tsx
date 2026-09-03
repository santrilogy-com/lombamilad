'use client';

import { useState } from 'react';
import { SectionHeader, buttonStyle } from '../ui';

const inputStyle = {
  height: 42,
  padding: '0 12px',
  background: 'var(--paper)',
  border: '1px solid rgba(36,33,28,0.18)',
  borderRadius: 2,
  fontSize: 13.5,
  color: 'var(--ink)',
} as const;

export default function GantiPasswordCard() {
  const [open, setOpen] = useState(false);
  const [passwordLama, setPasswordLama] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sukses, setSukses] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSukses(false);

    if (passwordBaru !== konfirmasi) {
      setError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/admin/akun/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwordLama, passwordBaru }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Gagal mengganti password.');
      setSukses(true);
      setPasswordLama('');
      setPasswordBaru('');
      setKonfirmasi('');
      setTimeout(() => setSukses(false), 4000);
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <SectionHeader
        title="Akun"
        actions={
          <button onClick={() => setOpen((v) => !v)} style={buttonStyle('ghost', { small: true })}>
            {open ? 'Tutup' : 'Ganti Password'}
          </button>
        }
      />

      {open ? (
        <form onSubmit={onSubmit} style={{ background: 'var(--paper2)', borderRadius: 4, padding: '24px 26px', display: 'grid', gap: 14, maxWidth: 420 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="passwordLama" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)' }}>
              Password lama
            </label>
            <input
              id="passwordLama"
              type="password"
              value={passwordLama}
              onChange={(e) => setPasswordLama(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="passwordBaru" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)' }}>
              Password baru (minimal 8 karakter)
            </label>
            <input
              id="passwordBaru"
              type="password"
              value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)}
              minLength={8}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="konfirmasi" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)' }}>
              Konfirmasi password baru
            </label>
            <input
              id="konfirmasi"
              type="password"
              value={konfirmasi}
              onChange={(e) => setKonfirmasi(e.target.value)}
              minLength={8}
              required
              style={inputStyle}
            />
          </div>

          {error ? (
            <div style={{ background: '#f4dede', borderLeft: '3px solid #a94442', borderRadius: 2, padding: '10px 14px', fontSize: 13, color: '#7a2f2d' }}>
              {error}
            </div>
          ) : null}
          {sukses ? (
            <div style={{ background: 'var(--olive-p)', borderRadius: 2, padding: '10px 14px', fontSize: 13, color: '#453d24' }}>
              Password berhasil diganti.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            style={{ ...buttonStyle('primary'), cursor: busy ? 'wait' : 'pointer', justifySelf: 'start' }}
          >
            {busy ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>
      ) : null}
    </section>
  );
}
