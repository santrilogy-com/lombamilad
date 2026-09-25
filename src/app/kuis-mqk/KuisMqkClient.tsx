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
  const lapoResizeRef = useRef(0);
  const lapoFullscreenRef = useRef(0);
  const lastFullscreenChangeRef = useRef(0);
  const [fullscreenAktif, setFullscreenAktif] = useState(false);
  // iPhone Safari tidak mendukung Fullscreen API untuk halaman — jangan tampilkan
  // peringatan "tidak layar penuh" yang mustahil dipenuhi peserta di sana.
  const [fullscreenDidukung, setFullscreenDidukung] = useState(true);

  // Modal persetujuan pengawasan (kamera + berbagi layar) sebelum kuis dimulai/dilanjutkan.
  const [modalPersetujuan, setModalPersetujuan] = useState(false);
  const [setuju, setSetuju] = useState(false);
  const [kameraSiap, setKameraSiap] = useState(false);
  const [layarAktif, setLayarAktif] = useState(false);
  const [layarError, setLayarError] = useState('');
  // Berbagi layar (getDisplayMedia) hanya ada di peramban desktop; Chrome Android &
  // Safari iOS tidak menyediakannya untuk halaman web, jadi di sana tidak diwajibkan.
  const [layarDidukung, setLayarDidukung] = useState(false);
  const layarRef = useRef<MediaStream | null>(null);
  const stepRef = useRef<Step>('login');
  const lapoLayarRef = useRef(0);

  function tampilkanToast(pesan: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(pesan);
    toastTimerRef.current = setTimeout(() => setToast(''), 1800);
  }

  function laporMencurigakan(tipe: 'tab' | 'fokus' | 'resize' | 'fullscreen' | 'kamera' | 'layar') {
    const { nomor: n, token: t } = credRef.current;
    if (!n || !t) return;
    // keepalive wajib: laporan 'tab' dikirim tepat saat halaman disembunyikan,
    // dan tanpa keepalive peramban HP membekukan/membatalkan request ini
    // sebelum sampai ke server — pelanggaran pindah aplikasi tidak tercatat.
    fetch('/api/kuis/mencurigakan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nomor: n, token: t, tipe }),
      keepalive: true,
    }).catch(() => {});
  }

  function laporKameraTerputus() {
    const now = Date.now();
    if (now - lapoKameraRef.current < 3000) return;
    lapoKameraRef.current = now;
    tampilkanToast('Kamera terputus — aktivitas ini tercatat');
    laporMencurigakan('kamera');
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

  // Minta peserta membagikan SELURUH layar (bukan satu tab/jendela). Wajib dipanggil
  // langsung dari klik tombol — getDisplayMedia menolak dipanggil tanpa gesture.
  // Layar tidak direkam/disimpan; hanya dipastikan tetap dibagikan selama kuis.
  async function bagikanLayar() {
    setLayarError('');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: false,
        // Opsi Chrome: sembunyikan pilihan tab/jendela sendiri & pengalihan sumber di tengah jalan.
        selfBrowserSurface: 'exclude',
        surfaceSwitching: 'exclude',
        monitorTypeSurfaces: 'include',
      } as DisplayMediaStreamOptions);
      const track = stream.getVideoTracks()[0];
      const surface = (track?.getSettings() as { displaySurface?: string }).displaySurface;
      if (surface && surface !== 'monitor') {
        stream.getTracks().forEach((t) => t.stop());
        setLayarError('Pilih "Seluruh layar" (Entire screen), bukan satu tab atau jendela, lalu coba lagi.');
        return;
      }
      layarRef.current?.getTracks().forEach((t) => {
        t.onended = null;
        t.stop();
      });
      layarRef.current = stream;
      track.onended = () => {
        layarRef.current = null;
        setLayarAktif(false);
        if (stepRef.current !== 'sedang') return;
        const now = Date.now();
        if (now - lapoLayarRef.current < 3000) return;
        lapoLayarRef.current = now;
        tampilkanToast('Berbagi layar dihentikan — aktivitas ini tercatat');
        laporMencurigakan('layar');
      };
      setLayarAktif(true);
    } catch (err: any) {
      if (err?.name === 'NotSupportedError' || err?.name === 'TypeError') {
        setLayarDidukung(false);
        return;
      }
      setLayarError('Berbagi layar dibatalkan atau ditolak. Klik "Bagikan Layar" lalu pilih "Seluruh layar".');
    }
  }

  function hentikanLayar() {
    layarRef.current?.getTracks().forEach((t) => {
      t.onended = null;
      t.stop();
    });
    layarRef.current = null;
    setLayarAktif(false);
  }

  async function izinkanKamera() {
    setError('');
    const ok = await mintaKamera();
    setKameraSiap(ok);
  }

  // Sebelum memulai/melanjutkan kuis, cek status dulu: peserta yang kuisnya sudah
  // selesai (atau belum boleh mulai) langsung diteruskan ke mulai() untuk melihat
  // hasil/pesan dari server, tanpa diminta persetujuan kamera & layar.
  async function bukaPersetujuan(nomorArg?: string, tokenArg?: string) {
    const n = (nomorArg ?? nomor).trim();
    const t = (tokenArg ?? token).trim();
    if (!n || !t) return;
    setError('');
    setBusy(true);
    try {
      const res = await fetch(`/api/cek-status?${new URLSearchParams({ nomor: n, token: t })}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Nomor pendaftaran atau token tidak cocok.');
      const kuis = data?.kuis as { attemptStatus: string | null; dibuka: boolean } | null;
      const bisaMengerjakan =
        kuis &&
        (kuis.attemptStatus === 'SEDANG' ||
          (kuis.attemptStatus === null && kuis.dibuka && data.statusKode === 'TERVERIFIKASI'));
      if (!bisaMengerjakan) {
        setBusy(false);
        await mulai(n, t);
        return;
      }
      setNomor(n);
      setToken(t);
      setSetuju(false);
      setLayarError('');
      setKameraSiap(Boolean(streamRef.current?.getVideoTracks().some((tr) => tr.readyState === 'live')));
      setLayarDidukung(typeof navigator.mediaDevices?.getDisplayMedia === 'function');
      setModalPersetujuan(true);
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  }

  function setujuDanMulai() {
    setModalPersetujuan(false);
    mintaFullscreen();
    mulai();
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

  // Bila nomor & token dibawa lewat URL (mis. tautan dari Dashboard Peserta), langsung
  // tampilkan persetujuan pengawasan (atau hasil, bila kuis sudah selesai).
  useEffect(() => {
    const n = searchParams.get('nomor');
    const t = searchParams.get('token');
    if (n && t) bukaPersetujuan(n, t);
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

  // Matikan kamera & berbagi layar begitu kuis selesai atau komponen dilepas.
  useEffect(() => {
    stepRef.current = step;
    if (step === 'selesai') {
      hentikanKamera();
      hentikanLayar();
    }
  }, [step]);
  useEffect(
    () => () => {
      hentikanKamera();
      hentikanLayar();
    },
    []
  );

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
        laporMencurigakan('tab');
      } else if (pendingWarnRef.current) {
        pendingWarnRef.current = false;
        tampilkanToast('Anda berpindah tab — aktivitas ini tercatat');
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Lapor bila jendela kuis kehilangan fokus padahal tab tetap terlihat —
  // mis. alt-tab ke aplikasi AI/jendela lain di sampingnya, monitor kedua,
  // atau split-screen. Kasus ini tidak memicu visibilitychange sama sekali.
  useEffect(() => {
    if (step !== 'sedang') return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    function onBlur() {
      if (timer) clearTimeout(timer);
      // Tunggu sejenak: pindah tab biasa juga memicu blur, dan itu sudah
      // dilaporkan sebagai 'tab' oleh handler visibilitychange di atas.
      timer = setTimeout(() => {
        if (document.hidden || document.hasFocus()) return;
        const now = Date.now();
        if (now - lapoRef.current < 3000) return;
        lapoRef.current = now;
        tampilkanToast('Anda berpindah ke jendela lain — aktivitas ini tercatat');
        laporMencurigakan('fokus');
      }, 400);
    }
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('blur', onBlur);
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Lapor bila jendela browser menyempit signifikan dari ukurannya (panel
  // samping / DevTools terbuka di desktop) — indikasi ekstensi AI aktif.
  useEffect(() => {
    if (step !== 'sedang') return;
    // Di HP, selisih outer/inner berubah-ubah karena bilah alamat & keyboard,
    // jadi indikator ini hanya andal di desktop.
    if (window.matchMedia('(pointer: coarse)').matches) return;
    function onResize() {
      // Masuk/keluar layar penuh juga memicu resize; itu sudah dilaporkan
      // sebagai 'fullscreen', jangan dihitung dua kali.
      if (Date.now() - lastFullscreenChangeRef.current < 1500) return;
      const widthGap = window.outerWidth - window.innerWidth;
      const heightGap = window.outerHeight - window.innerHeight;
      if (widthGap <= 160 && heightGap <= 160) return;
      const now = Date.now();
      if (now - lapoResizeRef.current < 3000) return;
      lapoResizeRef.current = now;
      tampilkanToast('Aktivitas mencurigakan terdeteksi — tercatat');
      laporMencurigakan('resize');
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Minta mode layar penuh agar peserta tidak mudah membuka jendela/aplikasi
  // lain berdampingan (mis. mesin pencari atau AI chat). Dipanggil sinkron di
  // dalam gesture klik "Mulai Kuis" — beberapa peramban (Safari) menolak
  // requestFullscreen bila dipanggil setelah await, jadi jangan pindahkan ini
  // ke dalam fungsi async mulai().
  function mintaFullscreen() {
    try {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } catch {
      // Fullscreen API tidak wajib — kuis tetap bisa dikerjakan tanpanya.
    }
  }

  // Lapor bila peserta keluar dari mode layar penuh saat kuis berlangsung.
  // Tidak dipaksa/diblokir (Esc selalu bisa keluar dari fullscreen di semua
  // peramban) — tapi diberi tombol untuk kembali, dan aktivitasnya tercatat
  // secara terbuka seperti indikator lainnya.
  useEffect(() => {
    if (step !== 'sedang') return;
    function onFullscreenChange() {
      lastFullscreenChangeRef.current = Date.now();
      const aktif = Boolean(document.fullscreenElement);
      setFullscreenAktif(aktif);
      if (aktif) return;
      const now = Date.now();
      if (now - lapoFullscreenRef.current < 3000) return;
      lapoFullscreenRef.current = now;
      tampilkanToast('Anda keluar dari mode layar penuh — aktivitas ini tercatat');
      laporMencurigakan('fullscreen');
    }
    setFullscreenDidukung(Boolean(document.fullscreenEnabled));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    setFullscreenAktif(Boolean(document.fullscreenElement));
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Lepaskan fullscreen begitu kuis selesai.
  useEffect(() => {
    if (step === 'selesai' && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
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
            selama kuis berlangsung. Kuis berjalan dalam mode layar penuh dan di bawah pengawasan penuh
            panitia; setiap indikasi kecurangan tercatat otomatis dan dapat menggugurkan kelulusan Anda.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: '#4b4740', margin: '0 0 32px', background: 'var(--paper2)', borderRadius: 3, padding: '14px 16px' }}>
            Siapkan perangkat dengan kamera yang berfungsi baik. Wajah Anda harus terlihat jelas di
            kamera sepanjang kuis, dan bila mengerjakan dari laptop/PC, seluruh layar wajib dibagikan
            kepada panitia selama kuis berlangsung.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); bukaPersetujuan(); }} style={{ display: 'grid', gap: 16 }}>
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

      {step === 'sedang' && layarDidukung && !layarAktif ? (
        <div style={{ display: 'grid', gap: 8, background: '#f4dede', borderLeft: '3px solid #a94442', borderRadius: 2, padding: '12px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#7a2f2d' }}>Layar Anda tidak sedang dibagikan — aktivitas ini tercatat.</span>
            <button
              type="button"
              onClick={bagikanLayar}
              style={{ flexShrink: 0, height: 32, padding: '0 14px', background: '#a94442', color: '#fff', border: 0, borderRadius: 2, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
            >
              Bagikan Layar
            </button>
          </div>
          {layarError ? <span style={{ fontSize: 12.5, color: '#7a2f2d' }}>{layarError}</span> : null}
        </div>
      ) : null}

      {modalPersetujuan ? (
        <ModalPersetujuan
          setuju={setuju}
          onSetuju={setSetuju}
          kameraSiap={kameraSiap}
          onIzinkanKamera={izinkanKamera}
          layarDidukung={layarDidukung}
          layarAktif={layarAktif}
          layarError={layarError}
          onBagikanLayar={bagikanLayar}
          error={error}
          onMulai={setujuDanMulai}
          onBatal={() => {
            setModalPersetujuan(false);
            hentikanKamera();
            hentikanLayar();
            setKameraSiap(false);
          }}
        />
      ) : null}

      {step === 'sedang' && fullscreenDidukung && !fullscreenAktif ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#f4dede', borderLeft: '3px solid #a94442', borderRadius: 2, padding: '12px 16px', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: '#7a2f2d' }}>Anda tidak dalam mode layar penuh — aktivitas ini tercatat.</span>
          <button
            type="button"
            onClick={mintaFullscreen}
            style={{ flexShrink: 0, height: 32, padding: '0 14px', background: '#a94442', color: '#fff', border: 0, borderRadius: 2, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
          >
            Layar Penuh
          </button>
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

// Persetujuan pengawasan sebelum kuis: jelaskan apa yang dipantau, minta
// centang persetujuan, lalu izin kamera dan (di laptop/PC) berbagi seluruh layar.
// Tombol mulai baru aktif setelah semua syarat terpenuhi.
function ModalPersetujuan(props: {
  setuju: boolean;
  onSetuju: (v: boolean) => void;
  kameraSiap: boolean;
  onIzinkanKamera: () => void;
  layarDidukung: boolean;
  layarAktif: boolean;
  layarError: string;
  onBagikanLayar: () => void;
  error: string;
  onMulai: () => void;
  onBatal: () => void;
}) {
  // Di HP/tablet (peramban tanpa getDisplayMedia) langkah "Bagikan Layar" tetap
  // ditampilkan sebagai langkah persetujuan agar alurnya sama dengan laptop/PC;
  // menekannya hanya menandai langkah selesai.
  const [layarFormal, setLayarFormal] = useState(false);
  const layarBeres = props.layarDidukung ? props.layarAktif : layarFormal;
  const siap = props.setuju && props.kameraSiap && layarBeres;
  const tombolLangkah = (selesai: boolean) =>
    ({
      height: 36,
      padding: '0 16px',
      background: selesai ? '#dbeedb' : 'var(--ink)',
      color: selesai ? '#2e5d2e' : 'var(--paper)',
      border: 0,
      borderRadius: 2,
      fontSize: 13,
      fontWeight: 600,
      cursor: selesai ? 'default' : 'pointer',
      flexShrink: 0,
    }) as const;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="judul-persetujuan"
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(36,33,28,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div style={{ background: 'var(--paper)', borderRadius: 4, width: '100%', maxWidth: 560, maxHeight: '100%', overflowY: 'auto', padding: 'clamp(20px, 4vw, 32px)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--olive)' }}>Sebelum memulai</div>
        <h2 id="judul-persetujuan" style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 24, letterSpacing: '-0.02em', margin: '8px 0 12px' }}>
          Persetujuan Pengawasan Kuis
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#4b4740', margin: '0 0 10px' }}>
          Untuk menjamin kejujuran dan keadilan bagi seluruh peserta, kuis ini berlangsung di bawah{' '}
          <b>pengawasan penuh panitia</b>.
        </p>
        <ul style={{ fontSize: 13.5, lineHeight: 1.6, color: '#4b4740', margin: '0 0 14px', paddingLeft: 20 }}>
          <li>
            {props.layarDidukung
              ? 'Kamera dan seluruh layar Anda wajib aktif dan dipantau sejak awal hingga kuis selesai.'
              : 'Kamera Anda wajib aktif dan seluruh aktivitas pada perangkat ini dipantau sejak awal hingga kuis selesai.'}
          </li>
          <li>Setiap tindakan yang mengarah pada kecurangan tercatat secara otomatis dan dilaporkan langsung kepada panitia.</li>
          <li>Pelanggaran akan ditinjau oleh panitia dan dewan juri, dan dapat berakibat gugurnya kelulusan Anda.</li>
        </ul>

        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 18px', cursor: 'pointer' }}>
          <input type="checkbox" checked={props.setuju} onChange={(e) => props.onSetuju(e.target.checked)} style={{ marginTop: 3 }} />
          <span>
            Saya menyetujui pengawasan selama kuis dan menyatakan akan mengerjakannya sendiri secara jujur, tanpa bantuan orang
            lain maupun alat atau aplikasi apa pun. Saya siap menerima keputusan panitia apabila terbukti melanggar.
          </span>
        </label>

        <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13.5 }}>1. Izinkan akses kamera</span>
            <button type="button" onClick={props.onIzinkanKamera} disabled={props.kameraSiap} style={tombolLangkah(props.kameraSiap)}>
              {props.kameraSiap ? '✓ Kamera aktif' : 'Izinkan Kamera'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13.5 }}>2. Bagikan seluruh layar</span>
            <button
              type="button"
              onClick={props.layarDidukung ? props.onBagikanLayar : () => setLayarFormal(true)}
              disabled={layarBeres}
              style={tombolLangkah(layarBeres)}
            >
              {props.layarDidukung ? (props.layarAktif ? '✓ Layar dibagikan' : 'Bagikan Layar') : layarFormal ? '✓ Siap' : 'Bagikan Layar'}
            </button>
          </div>
          {props.layarError ? <div style={{ fontSize: 12.5, color: '#a94442' }}>{props.layarError}</div> : null}
          {props.error ? <div style={{ fontSize: 12.5, color: '#a94442' }}>{props.error}</div> : null}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={props.onMulai}
            disabled={!siap}
            style={{ height: 48, padding: '0 24px', background: siap ? 'var(--ink)' : 'rgba(36,33,28,0.3)', color: 'var(--paper)', border: 0, borderRadius: 2, fontSize: 14, fontWeight: 600, cursor: siap ? 'pointer' : 'not-allowed' }}
          >
            Setuju &amp; Mulai Kuis
          </button>
          <button
            type="button"
            onClick={props.onBatal}
            style={{ height: 48, padding: '0 20px', background: 'transparent', border: '1px solid rgba(36,33,28,0.25)', borderRadius: 2, fontSize: 14, fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
