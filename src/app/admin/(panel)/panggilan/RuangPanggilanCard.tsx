'use client';

import { useState } from 'react';
import type { RuangPanggilan } from '@/lib/panggilan';
import { cardStyle } from '../../ui';

export default function RuangPanggilanCard({
  ruang,
  judul,
  keterangan,
  statusAwal,
}: {
  ruang: RuangPanggilan;
  judul: string;
  keterangan: string;
  statusAwal: 'dibuka' | 'tertutup';
}) {
  const [status, setStatus] = useState(statusAwal);
  const [busy, setBusy] = useState(false);
  const [busyMasuk, setBusyMasuk] = useState(false);
  const [msg, setMsg] = useState('');

  async function ubahStatus(dibuka: boolean) {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/panggilan/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruang, status: dibuka ? 'dibuka' : 'tertutup' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Gagal mengubah status.');
      setStatus(data.status);
    } catch (e: any) {
      setMsg(e.message || 'Gagal mengubah status.');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setBusy(false);
    }
  }

  async function masukSebagaiPanitia() {
    setBusyMasuk(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/panggilan/masuk?ruang=${ruang}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Gagal membuka ruang.');
      window.open(`https://meet.jit.si/${data.roomName}#userInfo.displayName="${encodeURIComponent(data.displayName)}"`, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      setMsg(e.message || 'Gagal membuka ruang.');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setBusyMasuk(false);
    }
  }

  const dibuka = status === 'dibuka';

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 15.5, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
            {judul}
          </div>
          <p style={{ fontSize: 13, color: 'var(--grey)', margin: '6px 0 0', maxWidth: '60ch' }}>{keterangan}</p>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '6px 12px',
            borderRadius: 999,
            background: dibuka ? 'rgba(79,107,31,0.14)' : 'rgba(36,33,28,0.08)',
            color: dibuka ? '#4f6b1f' : 'var(--grey)',
          }}
        >
          {dibuka ? 'Ruang dibuka' : 'Ruang tertutup'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
        <button
          onClick={() => ubahStatus(!dibuka)}
          disabled={busy}
          style={{
            height: 38,
            padding: '0 16px',
            fontSize: 13,
            fontWeight: 600,
            background: dibuka ? 'transparent' : 'var(--ink)',
            color: dibuka ? 'var(--ink)' : 'var(--paper)',
            border: dibuka ? '1px solid rgba(36,33,28,0.25)' : 0,
            borderRadius: 2,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {dibuka ? 'Tutup Ruang' : 'Buka Ruang'}
        </button>
        <button
          onClick={masukSebagaiPanitia}
          disabled={busyMasuk}
          style={{
            height: 38,
            padding: '0 16px',
            fontSize: 13,
            fontWeight: 600,
            background: 'transparent',
            color: 'var(--olive-d)',
            border: '1px solid rgba(79,107,31,0.35)',
            borderRadius: 2,
            cursor: busyMasuk ? 'wait' : 'pointer',
          }}
        >
          {busyMasuk ? 'Membuka...' : 'Masuk sebagai Panitia ↗'}
        </button>
        {msg ? <span style={{ fontSize: 12, color: '#a13b2e', alignSelf: 'center' }}>{msg}</span> : null}
      </div>
    </div>
  );
}
