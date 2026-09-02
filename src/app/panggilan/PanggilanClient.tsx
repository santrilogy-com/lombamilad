'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { RuangPanggilan } from '@/lib/panggilan';

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApi;
  }
}

type JitsiApi = { dispose: () => void; executeCommand: (cmd: string, ...args: unknown[]) => void };

const JITSI_DOMAIN = 'meet.jit.si';
const JITSI_SCRIPT_SRC = `https://${JITSI_DOMAIN}/external_api.js`;

function muatSkripJitsi(): Promise<void> {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${JITSI_SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Gagal memuat Jitsi Meet.')));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = JITSI_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat Jitsi Meet. Periksa koneksi internet Anda.'));
    document.body.appendChild(script);
  });
}

const inputStyle: React.CSSProperties = {
  height: 48,
  padding: '0 14px',
  background: 'var(--paper)',
  border: '1px solid rgba(36,33,28,0.18)',
  borderRadius: 2,
  fontSize: 14,
  color: 'var(--ink)',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--grey)',
};

export default function PanggilanClient({ ruang, judul }: { ruang: RuangPanggilan; judul: string }) {
  const searchParams = useSearchParams();
  const [nomor, setNomor] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [join, setJoin] = useState<{ roomName: string; displayName: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiApi | null>(null);
  const autoTriedRef = useRef(false);

  const masuk = useCallback(async (n: string, t: string) => {
    if (!n || !t) return;
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/panggilan/masuk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruang, nomor: n, token: t }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Tidak dapat masuk ruang sidang.');
      setJoin({ roomName: data.roomName, displayName: data.displayName });
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  }, [ruang]);

  // Auto-masuk bila nomor & token dibawa lewat tautan (mis. dari Dashboard Peserta / email).
  useEffect(() => {
    if (autoTriedRef.current) return;
    autoTriedRef.current = true;
    const n = searchParams.get('nomor');
    const t = searchParams.get('token');
    if (n && t) {
      setNomor(n);
      setToken(t);
      masuk(n, t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!join || !containerRef.current) return;
    let disposed = false;
    (async () => {
      try {
        await muatSkripJitsi();
        if (disposed || !window.JitsiMeetExternalAPI || !containerRef.current) return;
        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: join.roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName: join.displayName },
          configOverwrite: { prejoinPageEnabled: true, disableDeepLinking: true },
          interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false, SHOW_WATERMARK_FOR_GUESTS: false },
        });
      } catch (err: any) {
        setError(err?.message || 'Gagal memuat sesi video.');
      }
    })();
    return () => {
      disposed = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [join]);

  if (join) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        <div
          style={{
            padding: '12px clamp(16px, 3vw, 32px)',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{judul}</div>
          <div style={{ fontSize: 12, color: 'var(--grey)' }}>{join.displayName}</div>
        </div>
        {error ? (
          <div style={{ padding: '12px clamp(16px, 3vw, 32px)', fontSize: 13, color: '#a13b2e' }}>{error}</div>
        ) : null}
        <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 'clamp(48px, 8vw, 100px) clamp(20px, 4vw, 40px)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--olive)' }}>
        Sidang Video
      </div>
      <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(28px, 3.4vw, 42px)', letterSpacing: '-0.04em', margin: '16px 0 10px' }}>
        {judul}
      </h1>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#4b4740', margin: '0 0 28px' }}>
        Masukkan nomor pendaftaran dan token cek status Anda untuk masuk ke ruang sidang. Pastikan kamera
        dan mikrofon perangkat Anda aktif dan diizinkan oleh peramban.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          masuk(nomor.trim().toUpperCase(), token.trim());
        }}
        style={{ display: 'grid', gap: 16 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor="nomor" style={labelStyle}>Nomor pendaftaran</label>
          <input
            id="nomor"
            required
            value={nomor}
            onChange={(e) => setNomor(e.target.value)}
            placeholder="MS290-XXXX-????"
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor="token" style={labelStyle}>Token</label>
          <input
            id="token"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="8 karakter (mis. 3KZ7MA2P)"
            style={inputStyle}
          />
        </div>
        {error ? <div style={{ fontSize: 13, color: '#a13b2e' }}>{error}</div> : null}
        <button
          type="submit"
          disabled={busy}
          className="btn-ink submit-hover"
          style={{
            height: 50,
            border: 'none',
            background: 'var(--ink)',
            color: 'var(--paper)',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 2,
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Memeriksa...' : 'Masuk Ruang Sidang'}
        </button>
      </form>
    </main>
  );
}
