'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Soal = {
  id: string;
  soal: string;
  pilihanA: string;
  pilihanB: string;
  pilihanC: string;
  pilihanD: string;
  kategori: string | null;
};

type SoalResponse =
  | {
      selesai: false;
      soal: Soal;
      nomorSoal: number;
      total: number;
      sisaDetik: number;
      jumlahMencurigakan: number;
    }
  | { selesai: true; skor: number | null; benar: number; total: number };

type Step = 'login' | 'sedang' | 'selesai';

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
} as const;

export default function KuisMqkClient() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('login');
  const [nomor, setNomor] = useState(searchParams.get('nomor') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [soal, setSoal] = useState<Soal | null>(null);
  const [nomorSoal, setNomorSoal] = useState(0);
  const [total, setTotal] = useState(0);
  const [sisaDetik, setSisaDetik] = useState(0);
  const [hasil, setHasil] = useState<{ skor: number | null; benar: number; total: number } | null>(null);
  const [toast, setToast] = useState('');

  const credRef = useRef({ nomor: '', token: '' });
  const lapoRef = useRef(0);
  const pendingWarnRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function tampilkanToast(pesan: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(pesan);
    toastTimerRef.current = setTimeout(() => setToast(''), 1800);
  }

  const muatSoal = useCallback(async () => {
    const { nomor: n, token: t } = credRef.current;
    try {
      const res = await fetch(`/api/kuis/soal?${new URLSearchParams({ nomor: n, token: t })}`);
      const raw = await res.text();
      let data: SoalResponse | { error: string } | null = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error('Gagal memuat soal berikutnya. Periksa koneksi internet Anda dan coba lagi.');
      }
      if (!res.ok || !data || 'error' in data) {
        setError((data as any)?.error || 'Terjadi kesalahan memuat soal.');
        return;
      }
      if (data.selesai) {
        setHasil({ skor: data.skor, benar: data.benar, total: data.total });
        setStep('selesai');
      } else {
        setSoal(data.soal);
        setNomorSoal(data.nomorSoal);
        setTotal(data.total);
        setSisaDetik(data.sisaDetik);
        setStep('sedang');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat soal berikutnya. Periksa koneksi internet Anda dan coba lagi.');
    }
  }, []);

  async function mulai(nomorArg?: string, tokenArg?: string) {
    const n = nomorArg ?? nomor;
    const t = tokenArg ?? token;
    if (!n || !t) return;
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/kuis/mulai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomor: n, token: t }),
      });
      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error('Tidak dapat memulai kuis. Periksa koneksi internet Anda dan coba lagi.');
      }
      if (!res.ok) throw new Error(data?.error || 'Tidak dapat memulai kuis.');
      credRef.current = { nomor: n.trim().toUpperCase(), token: t.trim() };
      await muatSoal();
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  }

  // Auto-mulai bila nomor & token dibawa lewat URL (mis. tautan dari Dashboard Peserta).
  useEffect(() => {
    const n = searchParams.get('nomor');
    const t = searchParams.get('token');
    if (n && t) mulai(n, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function jawab(pilihan: 'A' | 'B' | 'C' | 'D' | null) {
    if (!soal || busy) return;
    setBusy(true);
    setError('');
    try {
      const { nomor: n, token: t } = credRef.current;
      const res = await fetch('/api/kuis/jawab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomor: n, token: t, soalId: soal.id, pilihan }),
      });
      const raw = await res.text();
      let data: SoalResponse | { error: string } | null = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error('Gagal mengirim jawaban. Periksa koneksi internet Anda dan coba lagi.');
      }
      if (!res.ok || !data || 'error' in data) throw new Error((data as any)?.error || 'Gagal mengirim jawaban.');
      if (data.selesai) {
        setHasil({ skor: data.skor, benar: data.benar, total: data.total });
        setStep('selesai');
      } else {
        tampilkanToast('Jawaban terkirim');
        setSoal(data.soal);
        setNomorSoal(data.nomorSoal);
        setTotal(data.total);
        setSisaDetik(data.sisaDetik);
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  }

  // Timer lokal per detik — hanya kosmetik, waktu sesungguhnya divalidasi di server.
  useEffect(() => {
    if (step !== 'sedang') return;
    if (sisaDetik <= 0) {
      tampilkanToast('Waktu habis — soal berikutnya dimuat');
      muatSoal();
      return;
    }
    const t = setTimeout(() => setSisaDetik((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sisaDetik, muatSoal]);

  // Lapor bila peserta pindah tab / minimize saat kuis berlangsung, dan beri
  // tahu peserta secara terbuka bahwa ini tercatat (bukan diam-diam).
  useEffect(() => {
    if (step !== 'sedang') return;
    function onVisibility() {
      if (document.hidden) {
        const now = Date.now();
        if (now - lapoRef.current < 3000) return;
        lapoRef.current = now;
        pendingWarnRef.current = true;
        const { nomor: n, token: t } = credRef.current;
        fetch('/api/kuis/mencurigakan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nomor: n, token: t }),
        }).catch(() => {});
      } else if (pendingWarnRef.current) {
        pendingWarnRef.current = false;
        tampilkanToast('Anda berpindah tab — aktivitas ini tercatat');
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Peringatkan sebelum menutup/memuat ulang halaman saat kuis berlangsung,
  // supaya peserta tidak kehilangan waktu soal karena refresh tidak sengaja.
  useEffect(() => {
    if (step !== 'sedang') return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [step]);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(44px, 5vw, 80px) clamp(20px, 4vw, 40px)' }}>
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: `translateX(-50%) translateY(${toast ? '0' : '-16px'})`,
          zIndex: 200,
          background: 'var(--ink)',
          color: 'var(--paper)',
          fontSize: 13,
          fontWeight: 600,
          padding: '12px 20px',
          borderRadius: 3,
          boxShadow: '0 8px 24px rgba(36,33,28,0.22)',
          opacity: toast ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 260ms ease, transform 260ms ease',
        }}
      >
        {toast || ' '}
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--olive)' }}>
        MQK — Babak I
      </div>
      <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.045em', margin: '16px 0 10px' }}>
        Kuis Penyisihan
      </h1>

      {step === 'login' ? (
        <>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4b4740', margin: '0 0 32px' }}>
            50 soal nahwu, fikih, dan sharaf dari Kitab Fathul-Mu&rsquo;in Bab Ubudiyah. Waktu 15 detik
            per soal, tidak bisa kembali ke soal sebelumnya, dan kuis hanya dapat dikerjakan satu kali.
            Pastikan koneksi internet stabil sebelum memulai — jangan tutup atau muat ulang halaman
            selama kuis berlangsung. Sistem mencatat bila Anda berpindah tab/aplikasi lain saat
            mengerjakan; hindari melakukannya agar tidak dianggap mencurigakan oleh panitia.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); mulai(); }} style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="nomor" style={labelStyle}>Nomor pendaftaran</label>
              <input id="nomor" value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="MS290-MQK-????" style={inputStyle} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="token" style={labelStyle}>Token</label>
              <input id="token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="8 karakter (mis. 3KZ7MA2P)" style={inputStyle} required />
            </div>
            <button type="submit" disabled={busy} style={{ height: 50, padding: '0 28px', background: 'var(--ink)', color: 'var(--paper)', border: 0, borderRadius: 2, fontSize: 14, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', justifySelf: 'start' }}>
              {busy ? 'Memeriksa...' : 'Mulai Kuis'}
            </button>
          </form>
        </>
      ) : null}

      {step === 'sedang' && soal ? (
        <div style={{ background: 'var(--paper2)', borderRadius: 4, padding: 'clamp(24px, 3vw, 36px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--olive-d)' }}>
              Soal {nomorSoal} / {total}
            </span>
            <span
              style={{
                fontFamily: 'var(--disp)',
                fontSize: 22,
                fontWeight: 500,
                color: sisaDetik <= 5 ? '#a94442' : 'var(--ink)',
                minWidth: 40,
                textAlign: 'right',
              }}
            >
              {sisaDetik}s
            </span>
          </div>
          <div style={{ height: 5, background: 'rgba(36,33,28,0.1)', borderRadius: 99, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: sisaDetik <= 5 ? '#a94442' : 'var(--olive)', width: `${(sisaDetik / 15) * 100}%`, transition: 'width 1s linear' }} />
          </div>

          <div style={{ fontSize: 17, lineHeight: 1.55, marginBottom: 24 }}>{soal.soal}</div>

          <div style={{ display: 'grid', gap: 10 }}>
            {(['A', 'B', 'C', 'D'] as const).map((huruf) => (
              <button
                key={huruf}
                type="button"
                disabled={busy}
                onClick={() => jawab(huruf)}
                style={{
                  textAlign: 'left',
                  padding: '14px 16px',
                  background: 'var(--paper)',
                  border: '1px solid rgba(36,33,28,0.16)',
                  borderRadius: 2,
                  fontSize: 14.5,
                  cursor: busy ? 'wait' : 'pointer',
                  display: 'flex',
                  gap: 12,
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--olive-d)' }}>{huruf}.</span>
                <span>{soal[`pilihan${huruf}` as const]}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 'selesai' && hasil ? (
        <div style={{ background: 'var(--paper2)', borderRadius: 4, padding: 'clamp(24px, 3vw, 36px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>
            Kuis selesai
          </div>
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 44, margin: '10px 0' }}>{hasil.skor ?? '–'}</div>
          <div style={{ fontSize: 14, color: '#4b4740' }}>
            Benar {hasil.benar} dari {hasil.total} soal.
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#5a554c', marginTop: 18 }}>
            Terima kasih telah mengerjakan Kuis Babak I. 10 peserta dengan nilai tertinggi akan
            diumumkan oleh panitia dan lanjut ke Babak II. Pantau status Anda melalui{' '}
            <Link href="/cek-status" style={{ fontWeight: 600 }}>Cek Status</Link>.
          </p>
        </div>
      ) : null}

      {error ? (
        <div style={{ marginTop: 20, background: '#f4dede', borderLeft: '3px solid #a94442', borderRadius: 2, padding: '14px 16px', fontSize: 13, color: '#7a2f2d' }}>
          {error}
        </div>
      ) : null}
    </main>
  );
}
