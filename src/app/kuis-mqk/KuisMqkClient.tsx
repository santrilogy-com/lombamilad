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
      fotoAwalSudahAda: boolean;
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
  const [perluFotoAwal, setPerluFotoAwal] = useState(false);

  const credRef = useRef({ nomor: '', token: '' });
  const lapoRef = useRef(0);
  const pendingWarnRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fotoAwalKirimRef = useRef(false);
  const fotoAkhirKirimRef = useRef(false);
  const lapoKameraRef = useRef(0);

  function tampilkanToast(pesan: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(pesan);
    toastTimerRef.current = setTimeout(() => setToast(''), 1800);
  }

  function laporKameraTerputus() {
    const now = Date.now();
    if (now - lapoKameraRef.current < 3000) return;
    lapoKameraRef.current = now;
    tampilkanToast('Kamera terputus — aktivitas ini tercatat');
    const { nomor: n, token: t } = credRef.current;
    if (!n || !t) return;
    fetch('/api/kuis/mencurigakan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nomor: n, token: t }),
    }).catch(() => {});
  }

  // Minta izin kamera untuk verifikasi wajah. Wajib — kuis tidak bisa dimulai
  // tanpa akses kamera, agar dua foto verifikasi (awal & menjelang selesai)
  // bisa diambil untuk mencegah joki.
  async function mintaKamera(): Promise<boolean> {
    if (streamRef.current && streamRef.current.getVideoTracks().some((t) => t.readyState === 'live')) {
      return true;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => laporKameraTerputus();
      });
      return true;
    } catch {
      setError('Akses kamera diperlukan untuk memulai kuis ini (verifikasi wajah). Izinkan akses kamera pada peramban Anda, lalu coba lagi.');
      return false;
    }
  }

  function hentikanKamera() {
    streamRef.current?.getTracks().forEach((t) => {
      t.onended = null;
      t.stop();
    });
    streamRef.current = null;
  }

  // Sampel kasar untuk mendeteksi frame yang polos gelap (mis. video belum sempat
  // benar-benar merender saat digambar ke canvas) — dipakai untuk retry di tangkapFoto.
  function frameGelap(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): boolean {
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const totalPiksel = data.length / 4;
    const langkah = Math.max(1, Math.floor(totalPiksel / 2000)) * 4;
    let total = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += langkah) {
      total += data[i] + data[i + 1] + data[i + 2];
      n++;
    }
    return n > 0 && total / n < 6;
  }

  // Beberapa kali percobaan menggambar frame video ke canvas — video kadang belum
  // sempat benar-benar merender frame pertama saat pertama digambar, hasilnya polos
  // hitam. Ulangi singkat sebelum menyerah, supaya foto verifikasi tidak sia-sia.
  function tangkapFoto(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !video.videoWidth) {
        resolve(null);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      let percobaan = 0;
      const gambar = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        percobaan++;
        if (frameGelap(ctx, canvas) && percobaan < 5) {
          setTimeout(gambar, 200);
          return;
        }
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
      };
      gambar();
    });
  }

  async function kirimFoto(tipe: 'awal' | 'akhir') {
    const blob = await tangkapFoto();
    if (!blob) return;
    const { nomor: n, token: t } = credRef.current;
    if (!n || !t) return;
    const fd = new FormData();
    fd.append('nomor', n);
    fd.append('token', t);
    fd.append('tipe', tipe);
    fd.append('foto', blob, `${tipe}.jpg`);
    try {
      await fetch('/api/kuis/foto', { method: 'POST', body: fd });
    } catch {
      // Kegagalan kirim foto tidak menghentikan kuis — jangan blokir peserta karena ini.
    }
  }

  // Tunggu video benar-benar sudah menggambar frame (bukan cuma metadata siap)
  // sebelum menangkap foto — mencegah foto verifikasi awal terekam hitam polos
  // karena diambil sebelum frame pertama sempat dirender ke elemen video.
  function tungguFrameVideo(): Promise<void> {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video) {
        resolve();
        return;
      }
      let selesai = false;
      const done = () => {
        if (selesai) return;
        selesai = true;
        resolve();
      };
      if (typeof (video as any).requestVideoFrameCallback === 'function') {
        (video as any).requestVideoFrameCallback(done);
      } else {
        const tunggu2Frame = () => requestAnimationFrame(() => requestAnimationFrame(done));
        if (video.readyState >= 2 && video.videoWidth) {
          tunggu2Frame();
        } else {
          const onLoaded = () => {
            video.removeEventListener('loadeddata', onLoaded);
            tunggu2Frame();
          };
          video.addEventListener('loadeddata', onLoaded);
        }
      }
      setTimeout(done, 1500);
    });
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
        setPerluFotoAwal(!data.fotoAwalSudahAda);
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
      // Kamera hanya diminta bila kuis benar-benar akan dikerjakan (SEDANG) — peserta
      // yang membuka kembali tautan kuis yang sudah selesai tidak perlu diminta izin kamera.
      if (data?.status === 'SEDANG') {
        const kameraOk = await mintaKamera();
        if (!kameraOk) return;
      }
      credRef.current = { nomor: n.trim().toUpperCase(), token: t.trim() };
      await muatSoal();
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan.');
      hentikanKamera();
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
        setPerluFotoAwal(!data.fotoAwalSudahAda);
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

  // Sambungkan preview kamera begitu elemen video (hanya ada saat step === 'sedang')
  // terpasang. Atribut `autoPlay` saja kadang tidak cukup memicu playback saat srcObject
  // dipasang lewat JS (video diam di paused=true walau readyState sudah siap) — panggil
  // play() eksplisit supaya frame benar-benar mengalir sebelum foto ditangkap.
  useEffect(() => {
    if (step === 'sedang' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [step]);

  // Ambil & kirim foto verifikasi awal begitu kamera+video siap. Berlaku juga saat
  // resume (mis. peserta reload sebelum foto awal sempat terkirim) karena dipicu
  // oleh flag fotoAwalSudahAda dari server, bukan hanya sekali di awal sesi klien.
  useEffect(() => {
    if (step !== 'sedang' || !perluFotoAwal || fotoAwalKirimRef.current) return;
    fotoAwalKirimRef.current = true;
    (async () => {
      const kameraOk = await mintaKamera();
      if (!kameraOk) {
        fotoAwalKirimRef.current = false;
        return;
      }
      // srcObject sudah dipasang oleh efek preview di atas (jalan lebih dulu pada render
      // yang sama) — jangan set ulang di sini, karena menimpa srcObject dengan stream yang
      // sama bisa memicu ulang siklus decode video dan membuat frame pertama yang ditangkap
      // kosong/hitam.
      await tungguFrameVideo();
      await kirimFoto('awal');
      setPerluFotoAwal(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, perluFotoAwal]);

  // Ambil & kirim foto verifikasi akhir saat soal terakhir tampil — jaga-jaga ada
  // joki yang menggantikan peserta di tengah kuis.
  useEffect(() => {
    if (step === 'sedang' && total > 0 && nomorSoal === total && !fotoAkhirKirimRef.current) {
      fotoAkhirKirimRef.current = true;
      kirimFoto('akhir');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, nomorSoal, total]);

  // Matikan kamera begitu kuis selesai atau komponen dilepas.
  useEffect(() => {
    if (step === 'selesai') hentikanKamera();
  }, [step]);
  useEffect(() => () => hentikanKamera(), []);

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
          <p style={{ fontSize: 14, lineHeight: 1.6, color: '#4b4740', margin: '0 0 32px', background: 'var(--paper2)', borderRadius: 3, padding: '14px 16px' }}>
            Kuis ini memerlukan akses kamera untuk verifikasi wajah. Sistem mengambil <strong>satu foto
            saat kuis dimulai</strong> dan <strong>satu foto menjelang kuis selesai</strong> untuk
            memastikan peserta yang mengerjakan adalah Anda sendiri (bukan joki). Di antara keduanya,
            kamera tetap menyala sebagai pengawasan namun tidak merekam video maupun mengambil foto
            tambahan. Sistem juga mencatat bila kamera terputus saat kuis berlangsung.
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

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {step === 'sedang' ? (
        <div
          role="status"
          aria-label="Kamera pengawasan kuis aktif"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 112,
            height: 84,
            borderRadius: 4,
            overflow: 'hidden',
            border: '2px solid var(--ink)',
            boxShadow: '0 8px 24px rgba(36,33,28,0.3)',
            zIndex: 150,
            background: '#000',
          }}
        >
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          <span style={{ position: 'absolute', top: 4, left: 6, fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            ● KAMERA AKTIF
          </span>
        </div>
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
