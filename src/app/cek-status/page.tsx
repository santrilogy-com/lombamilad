'use client';

import { useState } from 'react';
import Link from 'next/link';

type StatusResult = {
  nomorPendaftaran: string;
  nama: string;
  cabang: string;
  cabangShort: string;
  asalLembaga: string;
  whatsapp: string;
  tanggalDaftar: string;
  status: string;
  statusKode: string;
  nilaiPenyisihan: number | null;
  nilaiFinal: number | null;
  peringkatPenyisihan: number | null;
  peringkatFinal: number | null;
  verifikasiCatatan: string | null;
};

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  MENUNGGU_VERIFIKASI: { label: 'Menunggu verifikasi', bg: '#f7ecd0', color: '#8a6d1f' },
  TERVERIFIKASI: { label: 'Berkas terverifikasi', bg: 'var(--olive-p)', color: '#4f6b1f' },
  DITOLAK: { label: 'Berkas ditolak', bg: '#f4dede', color: '#a94442' },
  LOLOS_PENYISIHAN: { label: 'Lolos penyisihan', bg: '#dbeedb', color: '#2e7d2e' },
  GUGUR_PENYISIHAN: { label: 'Tidak lolos penyisihan', bg: '#ecece6', color: '#7a7a72' },
  LOLOS_FINAL: { label: 'Lolos ke final', bg: '#dbeedb', color: '#2e7d2e' },
  JUARA_1: { label: 'Juara 1', bg: 'var(--olive-p)', color: '#675c37' },
  JUARA_2: { label: 'Juara 2', bg: 'var(--olive-p)', color: '#675c37' },
  JUARA_3: { label: 'Juara 3', bg: 'var(--olive-p)', color: '#675c37' },
};

export default function CekStatusPage() {
  const [nomor, setNomor] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<StatusResult | null>(null);

  async function cari(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setBusy(true);
    try {
      const q = new URLSearchParams({ nomor: nomor.trim(), token: token.trim() });
      const res = await fetch(`/api/cek-status?${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Tidak ditemukan');
      setResult(data);
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

  const st = result ? STATUS_STYLE[result.statusKode] : null;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(44px, 5vw, 80px) clamp(20px, 4vw, 40px)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--olive)' }}>
        Cek Status
      </div>
      <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.045em', margin: '16px 0 10px' }}>
        Status Pendaftaran Anda
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4b4740', margin: '0 0 32px' }}>
        Masukkan nomor pendaftaran dan token yang Anda terima saat mendaftar (tertera pada email /
        halaman sukses pendaftaran).
      </p>

      <form onSubmit={cari} style={{ display: 'grid', gap: 16, marginBottom: 36 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor="nomor" style={labelStyle}>Nomor pendaftaran</label>
          <input id="nomor" value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="MS290-XXXX-????" style={inputStyle} required />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor="token" style={labelStyle}>Token</label>
          <input id="token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="8 karakter (mis. 3KZ7MA2P)" style={inputStyle} required />
        </div>
        <button type="submit" disabled={busy} className="submit-hover" style={{ height: 50, padding: '0 28px', background: 'var(--ink)', color: 'var(--paper)', border: 0, borderRadius: 2, fontSize: 14, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', justifySelf: 'start' }}>
          {busy ? 'Memeriksa...' : 'Periksa Status'}
        </button>
      </form>

      {error ? (
        <div style={{ background: '#f4dede', borderLeft: '3px solid #a94442', borderRadius: 2, padding: '14px 16px', fontSize: 13, color: '#7a2f2d' }}>
          {error}
        </div>
      ) : null}

      {result ? (
        <div style={{ background: 'var(--paper2)', borderRadius: 4, padding: 'clamp(24px, 3vw, 36px)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>Nomor pendaftaran</div>
              <div style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 22, color: 'var(--olive-d)', marginTop: 4 }}>{result.nomorPendaftaran}</div>
            </div>
            {st ? (
              <span style={{ background: st.bg, color: st.color, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 2, padding: '8px 14px', whiteSpace: 'nowrap' }}>
                {st.label}
              </span>
            ) : null}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 18 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>Nama</div>
              <div style={{ fontSize: 15, marginTop: 4 }}>{result.nama}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>Cabang</div>
              <div style={{ fontSize: 15, marginTop: 4 }}>{result.cabang}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>Asal lembaga</div>
              <div style={{ fontSize: 15, marginTop: 4 }}>{result.asalLembaga || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>Terdaftar sejak</div>
              <div style={{ fontSize: 15, marginTop: 4 }}>{new Date(result.tanggalDaftar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          {result.nilaiPenyisihan !== null ? (
            <div style={{ marginTop: 24, borderTop: '1px solid var(--line)', paddingTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>Nilai penyisihan</div>
                <div style={{ fontFamily: 'var(--disp)', fontSize: 24, marginTop: 4 }}>{result.nilaiPenyisihan}</div>
              </div>
              {result.peringkatPenyisihan !== null ? (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>Peringkat penyisihan</div>
                  <div style={{ fontFamily: 'var(--disp)', fontSize: 24, marginTop: 4 }}>{result.peringkatPenyisihan}</div>
                </div>
              ) : null}
              {result.nilaiFinal !== null ? (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>Nilai final</div>
                  <div style={{ fontFamily: 'var(--disp)', fontSize: 24, marginTop: 4 }}>{result.nilaiFinal}</div>
                </div>
              ) : null}
            </div>
          ) : null}

          {result.verifikasiCatatan ? (
            <div style={{ marginTop: 20, fontSize: 13, color: '#7a2f2d', background: '#faf0f0', borderRadius: 2, padding: '12px 14px' }}>
              Catatan: {result.verifikasiCatatan}
            </div>
          ) : null}

          <div style={{ marginTop: 24 }}>
            <Link href="/info-peserta" style={{ fontSize: 14, fontWeight: 600 }}>
              Baca informasi untuk peserta →
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}