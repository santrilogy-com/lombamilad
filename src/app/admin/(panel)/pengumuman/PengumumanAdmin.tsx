'use client';

import { useState } from 'react';

type Item = {
  id: string;
  judul: string;
  isi: string;
  tipe: string;
  published: boolean;
  createdAt: string;
};

export default function PengumumanAdmin({ list }: { list: Item[] }) {
  const [items, setItems] = useState<Item[]>(list);
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [tipe, setTipe] = useState('seleksi');
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmHapusId, setConfirmHapusId] = useState('');

  async function buat(e: React.FormEvent) {
    e.preventDefault();
    if (!judul.trim() || !isi.trim()) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/pengumuman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judul, isi, tipe, published }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Gagal');
      setItems((arr) => [{ id: data.pengumuman.id, judul, isi, tipe, published, createdAt: new Date().toISOString() }, ...arr]);
      setJudul('');
      setIsi('');
      setMsg('Pengumuman berhasil dibuat.');
      setTimeout(() => setMsg(''), 2500);
    } catch (e: any) {
      setMsg(e.message || 'Gagal membuat');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, pub: boolean) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/pengumuman', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, published: !pub }),
      });
      if (!res.ok) throw new Error('Gagal');
      setItems((arr) => arr.map((x) => (x.id === id ? { ...x, published: !pub } : x)));
    } catch (e: any) {
      setMsg(e.message || 'Gagal');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setBusy(false);
    }
  }

  async function hapus(id: string) {
    if (confirmHapusId !== id) {
      // Klik pertama hanya meminta konfirmasi (ganti label tombol jadi "Yakin?"),
      // supaya penghapusan tidak terjadi karena klik tidak sengaja.
      setConfirmHapusId(id);
      setTimeout(() => setConfirmHapusId((cur) => (cur === id ? '' : cur)), 4000);
      return;
    }
    setConfirmHapusId('');
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/pengumuman?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal');
      setItems((arr) => arr.filter((x) => x.id !== id));
    } catch (e: any) {
      setMsg(e.message || 'Gagal');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
      <form onSubmit={buat} style={{ background: 'var(--paper2)', borderRadius: 4, padding: '26px 26px' }}>
        <h2 style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 18, letterSpacing: '-0.02em', margin: '0 0 18px' }}>
          Buat pengumuman baru
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Judul</label>
            <input value={judul} onChange={(e) => setJudul(e.target.value)} required style={{ width: '100%', height: 44, padding: '0 12px', fontSize: 14, background: 'var(--paper)', border: '1px solid rgba(36,33,28,0.2)', borderRadius: 2 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Tipe</label>
              <select value={tipe} onChange={(e) => setTipe(e.target.value)} style={{ width: '100%', height: 44, padding: '0 10px', fontSize: 14, background: 'var(--paper)', border: '1px solid rgba(36,33,28,0.2)', borderRadius: 2 }}>
                <option value="seleksi">Seleksi / Penyisihan</option>
                <option value="final">Final</option>
                <option value="umum">Umum</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#8a7c4c' }} />
                Langsung terbit
              </label>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Isi</label>
          <textarea value={isi} onChange={(e) => setIsi(e.target.value)} required rows={5} style={{ width: '100%', padding: '12px', fontSize: 14, background: 'var(--paper)', border: '1px solid rgba(36,33,28,0.2)', borderRadius: 2, resize: 'vertical' }} />
        </div>
        <button type="submit" disabled={busy} className="submit-hover" style={{ height: 44, padding: '0 22px', background: 'var(--ink)', color: 'var(--paper)', border: 0, borderRadius: 2, fontSize: 13.5, fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? 'Menyimpan...' : 'Terbitkan'}
        </button>
        {msg ? <span style={{ fontSize: 13, color: '#4f6b1f', marginLeft: 12 }}>{msg}</span> : null}
      </form>

      <div>
        <h2 style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 18, letterSpacing: '-0.02em', margin: '0 0 14px' }}>
          Daftar pengumuman ({items.length})
        </h2>
        {items.length === 0 ? (
          <div style={{ background: 'var(--paper2)', borderRadius: 4, padding: '28px', fontSize: 14, color: '#5a554c' }}>Belum ada pengumuman.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((p) => (
              <div key={p.id} style={{ background: 'var(--paper2)', borderRadius: 4, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--disp)', fontWeight: 500, fontSize: 15.5 }}>{p.judul}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 2, padding: '3px 8px', background: p.published ? 'var(--olive-p)' : '#ecece6', color: p.published ? '#4f6b1f' : '#7a7a72' }}>
                      {p.published ? 'Terbit' : 'Draf'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggle(p.id, p.published)} disabled={busy} style={{ height: 30, padding: '0 12px', fontSize: 12, background: 'transparent', border: '1px solid rgba(36,33,28,0.25)', borderRadius: 2, cursor: 'pointer' }}>
                      {p.published ? 'Tarik' : 'Terbitkan'}
                    </button>
                    <button
                      onClick={() => hapus(p.id)}
                      disabled={busy}
                      style={{
                        height: 30,
                        padding: '0 12px',
                        fontSize: 12,
                        fontWeight: confirmHapusId === p.id ? 700 : 400,
                        background: confirmHapusId === p.id ? '#a94442' : 'transparent',
                        color: confirmHapusId === p.id ? '#fff' : '#a94442',
                        border: '1px solid #a94442',
                        borderRadius: 2,
                        cursor: 'pointer',
                      }}
                    >
                      {confirmHapusId === p.id ? 'Yakin? Klik lagi' : 'Hapus'}
                    </button>
                  </div>
                </div>
                {p.isi ? (
                  <div style={{ fontSize: 13, color: '#4b4740', lineHeight: 1.55, marginTop: 10, whiteSpace: 'pre-wrap' }}>{p.isi}</div>
                ) : null}
                <div style={{ fontSize: 11.5, color: 'var(--grey)', marginTop: 12 }}>
                  {p.tipe} · {new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}