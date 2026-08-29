'use client';

import { useState } from 'react';

export default function KuotaForm({
  cabangId,
  nama,
  currentKuota,
}: {
  cabangId: string;
  nama: string;
  currentKuota: number;
}) {
  const [value, setValue] = useState(String(currentKuota));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function save() {
    const v = parseInt(value, 10);
    if (!v || v < 1) return setMsg('Masukkan angka kuota yang valid.');
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/cabang', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cabangId, kuota: v }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Gagal');
      setMsg('Kuota diperbarui.');
      setTimeout(() => setMsg(''), 2000);
    } catch (e: any) {
      setMsg(e.message || 'Gagal');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
      <label htmlFor={`kuota-${cabangId}`} style={{ fontSize: 12, color: 'var(--grey)' }}>
        Kuota maksimal:
      </label>
      <input
        id={`kuota-${cabangId}`}
        type="number"
        min={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ width: 80, height: 34, padding: '0 10px', fontSize: 13, background: 'var(--paper)', border: '1px solid rgba(36,33,28,0.2)', borderRadius: 2 }}
      />
      <button
        onClick={save}
        disabled={busy}
        style={{ height: 34, padding: '0 14px', fontSize: 12.5, fontWeight: 600, background: 'var(--ink)', color: 'var(--paper)', border: 0, borderRadius: 2, cursor: busy ? 'wait' : 'pointer' }}
      >
        {busy ? '...' : 'Simpan'}
      </button>
      {msg ? (
        <span style={{ fontSize: 12, color: '#4f6b1f' }}>{msg}</span>
      ) : null}
    </div>
  );
}