'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CONTACT_WA } from '@/lib/data';
import PageOrnaments from '@/components/PageOrnaments';

type Hasil = { nomorPendaftaran: string; tokenCek: string; cabang: string };

export default function LupaStatusPage() {
  const [nomorIdentitas, setNomorIdentitas] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hasil, setHasil] = useState<Hasil[] | null>(null);

  async function cari(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setHasil(null);
    setBusy(true);
    try {
      const res = await fetch('/api/lupa-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomorIdentitas: nomorIdentitas.trim(), whatsapp: whatsapp.trim() }),
      });
      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(`Terjadi kesalahan pada server. Silakan coba lagi, atau hubungi panitia via WhatsApp di ${CONTACT_WA[0]} bila masalah berlanjut.`);
      }
      if (!res.ok) throw new Error(data?.error || 'Data tidak ditemukan');
      setHasil(data.hasil);
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan');
    } finally {
      setBusy(false);
    }
  }

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'var(--grey)',
  };
  const inputStyle = {
    height: 48,
    padding: '0 14px',
    background: 'var(--paper)',
    border: '1px solid rgba(36,33,28,0.18)',
    borderRadius: 2,
    fontSize: 14,
    color: 'var(--ink)',
    outline: 'none',
    transition: 'border-color 320ms ease',
  } as const;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', flex: 1 }}>
      <PageOrnaments />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(44px, 5vw, 80px) clamp(20px, 4vw, 40px)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--olive)' }}>
        Lupa Nomor / Token
      </div>
      <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.045em', margin: '16px 0 10px' }}>
        Lupa Nomor Pendaftaran atau Token?
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4b4740', margin: '0 0 32px' }}>
        Masukkan nomor identitas (KTP/KTM/KTS) dan nomor WhatsApp yang sama persis seperti saat Anda
        mendaftar. Sistem akan menampilkan kembali nomor pendaftaran dan token Anda.
      </p>

      <form onSubmit={cari} style={{ display: 'grid', gap: 16, marginBottom: 36 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor="nomorIdentitas" style={labelStyle}>Nomor identitas (KTP/KTM/KTS)</label>
          <input
            id="nomorIdentitas"
            value={nomorIdentitas}
            onChange={(e) => setNomorIdentitas(e.target.value)}
            placeholder="Nomor identitas saat mendaftar"
            style={inputStyle}
            required
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor="whatsapp" style={labelStyle}>Nomor WhatsApp aktif</label>
          <input
            id="whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="08xxxxxxxxxx"
            style={inputStyle}
            required
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="submit-hover"
          style={{ height: 50, padding: '0 28px', background: 'var(--ink)', color: 'var(--paper)', border: 0, borderRadius: 2, fontSize: 14, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', justifySelf: 'start' }}
        >
          {busy ? 'Mencari...' : 'Cari Data Pendaftaran'}
        </button>
      </form>

      {error ? (
        <div style={{ background: '#f4dede', borderLeft: '3px solid #a94442', borderRadius: 2, padding: '14px 16px', fontSize: 13, lineHeight: 1.55, color: '#7a2f2d', marginBottom: 24 }}>
          {error}
        </div>
      ) : null}

      {hasil ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--grey)' }}>
            Ditemukan {hasil.length} pendaftaran. Simpan nomor dan token di bawah ini
            {hasil.length > 0 ? ' (juga sudah dikirim ke email Anda bila diisi saat mendaftar).' : '.'}
          </div>
          {hasil.map((h) => (
            <div key={h.nomorPendaftaran} style={{ background: 'var(--paper2)', borderRadius: 4, padding: 'clamp(20px, 3vw, 28px)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--olive)' }}>
                {h.cabang}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16, marginTop: 12 }}>
                <div>
                  <div style={labelStyle}>Nomor pendaftaran</div>
                  <div style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 20, color: 'var(--olive-d)', marginTop: 4 }}>
                    {h.nomorPendaftaran}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Token</div>
                  <div style={{ fontFamily: 'var(--disp)', fontWeight: 500, fontSize: 20, letterSpacing: '0.06em', marginTop: 4 }}>
                    {h.tokenCek}
                  </div>
                </div>
              </div>
              <Link
                href={`/cek-status?nomor=${encodeURIComponent(h.nomorPendaftaran)}&token=${encodeURIComponent(h.tokenCek)}`}
                className="btn-ink"
                style={{ display: 'inline-flex', alignItems: 'center', height: 44, padding: '0 22px', background: 'var(--ink)', color: 'var(--paper)', fontSize: 13, fontWeight: 600, borderRadius: 2, marginTop: 18 }}
              >
                Cek Status Sekarang
              </Link>
            </div>
          ))}
        </div>
      ) : null}
      </main>
    </div>
  );
}
