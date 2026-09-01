'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      setError('Email atau password salah.');
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'var(--paper)',
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--paper2)',
          borderRadius: 4,
          padding: '40px 36px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 26 }}>
          <Image src="/logo.png" alt="Milad 290" width={49} height={28} style={{ height: 28, width: 'auto' }} priority />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--olive)', textTransform: 'uppercase' }}>
            Panel Admin Milad 290
          </span>
        </div>

        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', display: 'block', marginBottom: 6 }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%',
            height: 46,
            padding: '0 14px',
            background: 'var(--paper)',
            border: '1px solid rgba(36,33,28,0.18)',
            borderRadius: 2,
            fontSize: 14,
            marginBottom: 18,
          }}
        />

        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', display: 'block', marginBottom: 6 }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            height: 46,
            padding: '0 14px',
            background: 'var(--paper)',
            border: '1px solid rgba(36,33,28,0.18)',
            borderRadius: 2,
            fontSize: 14,
            marginBottom: 22,
          }}
        />

        {error ? (
          <div style={{ background: '#f4dede', borderLeft: '3px solid #a94442', borderRadius: 2, padding: '12px 14px', fontSize: 13, color: '#7a2f2d', marginBottom: 18 }}>
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="submit-hover"
          style={{
            width: '100%',
            height: 50,
            background: 'var(--ink)',
            color: 'var(--paper)',
            border: 0,
            borderRadius: 2,
            fontSize: 14,
            fontWeight: 600,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? 'Masuk...' : 'Masuk ke Panel'}
        </button>
      </form>
    </main>
  );
}