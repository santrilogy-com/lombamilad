'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CONTACT_WA } from '@/lib/data';

type KuisInfo = {
  attemptStatus: string | null;
  skor: number | null;
  dibuka: boolean;
};

type Pengumuman = {
  id: string;
  judul: string;
  isi: string;
  createdAt: string;
};

type StatusResult = {
  nomorPendaftaran: string;
  nama: string;
  cabangId: string;
  cabang: string;
  cabangShort: string;
  asalLembaga: string;
  whatsapp: string;
  tanggalDaftar: string;
  updatedAt: string;
  status: string;
  statusKode: string;
  nilaiPenyisihan: number | null;
  nilaiBabak2: number | null;
  nilaiFinal: number | null;
  peringkatPenyisihan: number | null;
  peringkatBabak2: number | null;
  peringkatFinal: number | null;
  verifikasiCatatan: string | null;
  kuis: KuisInfo | null;
  pengumuman: Pengumuman[];
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

const ALUR_UTAMA = ['MENUNGGU_VERIFIKASI', 'TERVERIFIKASI', 'LOLOS_PENYISIHAN', 'LOLOS_FINAL'] as const;
const LABEL_TAHAP: Record<string, string> = {
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  TERVERIFIKASI: 'Terverifikasi',
  LOLOS_PENYISIHAN: 'Lolos Penyisihan',
  LOLOS_FINAL: 'Lolos Final',
};

const SESI_KEY = 'ms290_peserta';

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'var(--grey)',
};

export default function CekStatusPage() {
  return (
    <Suspense fallback={null}>
      <CekStatusForm />
    </Suspense>
  );
}

function CekStatusForm() {
  const searchParams = useSearchParams();
  const [nomor, setNomor] = useState(searchParams.get('nomor') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<StatusResult | null>(null);

  async function cari(nomorArg?: string, tokenArg?: string) {
    const n = (nomorArg ?? nomor).trim();
    const t = (tokenArg ?? token).trim();
    if (!n || !t) return;
    setError('');
    setResult(null);
    setBusy(true);
    try {
      const q = new URLSearchParams({ nomor: n, token: t });
      const res = await fetch(`/api/cek-status?${q}`);
      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(`Terjadi kesalahan pada server. Silakan coba lagi, atau hubungi panitia via WhatsApp di ${CONTACT_WA[0]} bila masalah berlanjut.`);
      }
      if (!res.ok) throw new Error(data?.error || 'Tidak ditemukan');
      setResult(data);
      setNomor(n);
      setToken(t);
      localStorage.setItem(SESI_KEY, JSON.stringify({ nomor: n, token: t }));
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan');
    } finally {
      setBusy(false);
    }
  }

  function keluar() {
    localStorage.removeItem(SESI_KEY);
    setResult(null);
    setNomor('');
    setToken('');
    setError('');
  }

  // Auto-periksa: prioritaskan nomor & token dari URL (mis. tautan dari email),
  // jika tidak ada coba sesi tersimpan di browser dari kunjungan sebelumnya.
  useEffect(() => {
    const n = searchParams.get('nomor');
    const t = searchParams.get('token');
    if (n && t) {
      cari(n, t);
      return;
    }
    try {
      const saved = localStorage.getItem(SESI_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.nomor && parsed?.token) cari(parsed.nomor, parsed.token);
      }
    } catch {
      // localStorage tidak tersedia / data rusak — abaikan, tampilkan form login biasa.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        Dashboard Peserta
      </div>
      <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.045em', margin: '16px 0 10px' }}>
        {result ? `Selamat Datang, ${result.nama.split(' ')[0]}` : 'Masuk ke Dashboard'}
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4b4740', margin: '0 0 32px' }}>
        {result
          ? 'Berikut ringkasan pendaftaran dan progres Anda di Lomba Nasional Milad Sidogiri 290.'
          : 'Masukkan nomor pendaftaran dan token yang Anda terima saat mendaftar (tertera pada email / halaman sukses pendaftaran).'}
      </p>

      {!result ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            cari();
          }}
          style={{ display: 'grid', gap: 16, marginBottom: 36 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="nomor" style={labelStyle}>Nomor pendaftaran</label>
            <input id="nomor" value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="MS290-XXXX-????" style={inputStyle} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="token" style={labelStyle}>Token</label>
            <input id="token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="8 karakter (mis. 3KZ7MA2P)" style={inputStyle} required />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <button type="submit" disabled={busy} className="submit-hover" style={{ height: 50, padding: '0 28px', background: 'var(--ink)', color: 'var(--paper)', border: 0, borderRadius: 2, fontSize: 14, fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}>
              {busy ? 'Memeriksa...' : 'Masuk'}
            </button>
            <Link href="/lupa-status" style={{ fontSize: 13, fontWeight: 600 }}>
              Lupa nomor pendaftaran / token?
            </Link>
          </div>
        </form>
      ) : null}

      {error ? (
        <div style={{ background: '#f4dede', borderLeft: '3px solid #a94442', borderRadius: 2, padding: '14px 16px', fontSize: 13, color: '#7a2f2d', marginBottom: 24 }}>
          {error}
        </div>
      ) : null}

      {result ? (
        <>
          <div style={{ background: 'var(--paper2)', borderRadius: 4, padding: 'clamp(24px, 3vw, 36px)', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>Nomor pendaftaran</div>
                <div style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 22, color: 'var(--olive-d)', marginTop: 4 }}>{result.nomorPendaftaran}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {st ? (
                  <span style={{ background: st.bg, color: st.color, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 2, padding: '8px 14px', whiteSpace: 'nowrap' }}>
                    {st.label}
                  </span>
                ) : null}
                <button
                  onClick={keluar}
                  style={{ height: 36, padding: '0 14px', background: 'transparent', border: '1px solid rgba(36,33,28,0.25)', borderRadius: 2, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}
                >
                  Keluar
                </button>
              </div>
            </div>

            <StatusStepper statusKode={result.statusKode} />
            <div style={{ fontSize: 12, color: 'var(--grey)', marginBottom: 20 }}>
              Diperbarui {new Date(result.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
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

            {result.nilaiPenyisihan !== null || result.nilaiBabak2 !== null || result.nilaiFinal !== null ? (
              <div style={{ marginTop: 24, borderTop: '1px solid var(--line)', paddingTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 16 }}>
                {result.nilaiPenyisihan !== null ? (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>Nilai penyisihan</div>
                    <div style={{ fontFamily: 'var(--disp)', fontSize: 24, marginTop: 4 }}>{result.nilaiPenyisihan}</div>
                  </div>
                ) : null}
                {result.peringkatPenyisihan !== null ? (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>Peringkat penyisihan</div>
                    <div style={{ fontFamily: 'var(--disp)', fontSize: 24, marginTop: 4 }}>{result.peringkatPenyisihan}</div>
                  </div>
                ) : null}
                {result.cabangId === 'mqk' && result.nilaiBabak2 !== null ? (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>Nilai Babak II</div>
                    <div style={{ fontFamily: 'var(--disp)', fontSize: 24, marginTop: 4 }}>{result.nilaiBabak2}</div>
                  </div>
                ) : null}
                {result.cabangId === 'mqk' && result.peringkatBabak2 !== null ? (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>Peringkat Babak II</div>
                    <div style={{ fontFamily: 'var(--disp)', fontSize: 24, marginTop: 4 }}>{result.peringkatBabak2}</div>
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

          {result.cabangId === 'mqk' && result.kuis ? (
            <KuisCard nomor={result.nomorPendaftaran} token={token} kuis={result.kuis} status={result.statusKode} />
          ) : null}

          <PengumumanSection pengumuman={result.pengumuman} />
        </>
      ) : null}
    </main>
  );
}

// Alur linear MENUNGGU_VERIFIKASI -> TERVERIFIKASI -> LOLOS_PENYISIHAN -> LOLOS_FINAL,
// diturunkan murni dari statusKode. DITOLAK/GUGUR_PENYISIHAN adalah jalan buntu (bukan
// bagian dari alur utama) sehingga ditampilkan sebagai penanda berhenti, bukan dipaksa
// masuk salah satu tahap. JUARA_1/2/3 dianggap tahap "Lolos Final" yang selesai penuh.
function StatusStepper({ statusKode }: { statusKode: string }) {
  const juara = statusKode === 'JUARA_1' || statusKode === 'JUARA_2' || statusKode === 'JUARA_3';
  const ditolak = statusKode === 'DITOLAK';
  const gugur = statusKode === 'GUGUR_PENYISIHAN';
  const efektif = juara ? 'LOLOS_FINAL' : statusKode;
  const deadEndIndex = ditolak ? 1 : gugur ? 2 : -1;
  const deadEndLabel = ditolak ? 'Ditolak' : 'Tidak Lolos Penyisihan';
  const deadEndColor = ditolak ? '#a94442' : '#8a8a80';
  const idxAktif = ALUR_UTAMA.indexOf(efektif as (typeof ALUR_UTAMA)[number]);
  const currentIndex = deadEndIndex >= 0 ? deadEndIndex : Math.max(0, idxAktif);

  const state: Array<'done' | 'active' | 'dead' | 'pending'> = ALUR_UTAMA.map((_, i) => {
    if (deadEndIndex >= 0) {
      if (i < deadEndIndex) return 'done';
      if (i === deadEndIndex) return 'dead';
      return 'pending';
    }
    if (i < currentIndex) return 'done';
    if (i === currentIndex) return juara && i === ALUR_UTAMA.length - 1 ? 'done' : 'active';
    return 'pending';
  });

  const warna = (s: string) => (s === 'dead' ? deadEndColor : s === 'pending' ? 'rgba(36,33,28,0.2)' : 'var(--olive)');
  const gridCols = ALUR_UTAMA.map((_, i) => (i === 0 ? '12px' : '1fr 12px')).join(' ');

  return (
    <div style={{ margin: '2px 0 12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, alignItems: 'center' }}>
        {ALUR_UTAMA.flatMap((tahap, i) => {
          const s = state[i];
          const dot = (
            <div
              key={`dot-${tahap}`}
              style={{
                width: 11,
                height: 11,
                borderRadius: '50%',
                justifySelf: i === 0 ? 'start' : i === ALUR_UTAMA.length - 1 ? 'end' : 'center',
                background: s === 'pending' ? 'var(--paper)' : warna(s),
                border: `2px solid ${warna(s)}`,
              }}
            />
          );
          if (i === 0) return [dot];
          const line = (
            <div
              key={`line-${tahap}`}
              style={{ height: 2, background: state[i - 1] === 'done' ? 'var(--olive)' : 'rgba(36,33,28,0.2)' }}
            />
          );
          return [line, dot];
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ALUR_UTAMA.length}, 1fr)`, marginTop: 7 }}>
        {ALUR_UTAMA.map((tahap, i) => {
          const s = state[i];
          const label = s === 'dead' ? deadEndLabel : LABEL_TAHAP[tahap];
          return (
            <div
              key={tahap}
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: s === 'dead' ? deadEndColor : s === 'pending' ? 'var(--grey)' : 'var(--ink)',
                textAlign: i === 0 ? 'left' : i === ALUR_UTAMA.length - 1 ? 'right' : 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
              {juara && s === 'done' && i === ALUR_UTAMA.length - 1 ? ' 🏆' : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KuisCard({ nomor, token, kuis, status }: { nomor: string; token: string; kuis: KuisInfo; status: string }) {
  const href = `/kuis-mqk?${new URLSearchParams({ nomor, token })}`;

  return (
    <div style={{ background: 'var(--olive-p)', borderRadius: 4, padding: 'clamp(22px, 3vw, 30px)', marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--olive-d)' }}>
        Kuis Babak I — MQK
      </div>

      {kuis.attemptStatus === 'SELESAI' ? (
        <>
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 36, margin: '10px 0 4px', color: 'var(--ink)' }}>
            {kuis.skor ?? '–'}
          </div>
          <p style={{ fontSize: 13.5, color: '#4b4740', margin: 0 }}>
            Kuis sudah selesai dikerjakan. 10 peserta nilai tertinggi akan diumumkan panitia untuk lanjut ke Babak II.
          </p>
        </>
      ) : kuis.attemptStatus === 'SEDANG' ? (
        <>
          <p style={{ fontSize: 14, color: '#4b4740', margin: '10px 0 16px' }}>
            Anda sedang mengerjakan kuis ini. Lanjutkan sebelum waktu tiap soal habis.
          </p>
          <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', height: 46, padding: '0 22px', background: 'var(--ink)', color: 'var(--paper)', fontSize: 13.5, fontWeight: 600, borderRadius: 2 }}>
            Lanjutkan Kuis →
          </Link>
        </>
      ) : kuis.dibuka && status === 'TERVERIFIKASI' ? (
        <>
          <p style={{ fontSize: 14, color: '#4b4740', margin: '10px 0 16px' }}>
            50 soal, 15 detik per soal, hanya bisa dikerjakan satu kali. Pastikan siap sebelum memulai.
            Kuis ini memerlukan akses kamera untuk verifikasi wajah — siapkan perangkat dengan kamera
            sebelum memulai.
          </p>
          <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', height: 46, padding: '0 22px', background: 'var(--ink)', color: 'var(--paper)', fontSize: 13.5, fontWeight: 600, borderRadius: 2 }}>
            Mulai Kuis Babak I →
          </Link>
        </>
      ) : (
        <p style={{ fontSize: 14, color: '#4b4740', margin: '10px 0 0' }}>
          Kuis Babak I belum dibuka oleh panitia. Pantau halaman ini untuk info terbaru.
        </p>
      )}
    </div>
  );
}

function PengumumanSection({ pengumuman }: { pengumuman: Pengumuman[] }) {
  if (pengumuman.length === 0) return null;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 12 }}>
        Pengumuman
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pengumuman.map((p) => (
          <div key={p.id} style={{ background: 'var(--paper2)', borderRadius: 4, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
              <div style={{ fontFamily: 'var(--disp)', fontWeight: 500, fontSize: 16, letterSpacing: '-0.02em' }}>{p.judul}</div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)' }}>
                {new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#4b4740', whiteSpace: 'pre-wrap' }}>{p.isi}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
