'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { LOMBA, STEPS } from '@/lib/data';

export default function DaftarPage() {
  const [tglLahir, setTglLahir] = useState('');
  const [usia, setUsia] = useState<number | null>(null);
  const [usiaLebih, setUsiaLebih] = useState('');
  const [cabang, setCabang] = useState('');
  const [sent, setSent] = useState(false);
  const [nomor, setNomor] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selected = LOMBA.find((c) => c.id === cabang);

  const usiaText = useMemo(() => {
    if (usia === null) return '';
    return `${usia} tahun`;
  }, [usia]);

  function onTgl(e: React.ChangeEvent<HTMLInputElement>) {
    setTglLahir(e.target.value);
    if (!e.target.value) return;
    const born = new Date(e.target.value);
    const now = new Date();
    let age = now.getFullYear() - born.getFullYear();
    const m = now.getMonth() - born.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age--;
    setUsia(age);
    if (selected && age > maxUsiaFor(selected.id)) {
      setUsiaLebih(`Usia maksimal cabang ini ${maxUsiaFor(selected.id)} tahun.`);
    } else {
      setUsiaLebih('');
    }
  }

  function maxUsiaFor(id: string) {
    return id === 'mtq' ? 18 : id === 'khitobah' || id === 'syair' || id === 'mqk' ? 23 : 100;
  }

  function onCabang(id: string) {
    setCabang(id);
    setUsiaLebih('');
  }

  const MAX_FILE_MB = 4;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (busy) return;
    if (!cabang) {
      setError('Pilih cabang lomba terlebih dahulu.');
      return;
    }
    const fd = new FormData(e.currentTarget);
    const fileIdentitas = fd.get('fileIdentitas');
    const fileSubmisi = fd.get('fileSubmisi');
    const maxBytes = MAX_FILE_MB * 1024 * 1024;
    if (fileIdentitas instanceof File && fileIdentitas.size > maxBytes) {
      setError(`Ukuran kartu tanda pengenal maksimal ${MAX_FILE_MB}MB. Silakan kompres foto/scan-nya lalu unggah ulang.`);
      return;
    }
    if (fileSubmisi instanceof File && fileSubmisi.size > maxBytes) {
      setError(`Ukuran berkas submisi maksimal ${MAX_FILE_MB}MB. Silakan kompres berkasnya lalu unggah ulang.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/pendaftar', { method: 'POST', body: fd });
      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(
          res.status === 413
            ? `Berkas terlalu besar untuk dikirim. Maksimal ${MAX_FILE_MB}MB per berkas.`
            : 'Terjadi kesalahan pada server. Silakan coba lagi.'
        );
      }
      if (!res.ok) throw new Error(data?.error || 'Terjadi kesalahan');
      setSent(true);
      setNomor(data?.nomorPendaftaran || '');
      setToken(data?.tokenCek || '');
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = (readonly = false) => ({
    height: 46,
    padding: '0 14px',
    background: readonly ? 'rgba(36,33,28,0.05)' : 'var(--paper)',
    border: `1px solid ${readonly ? 'rgba(36,33,28,0.12)' : 'rgba(36,33,28,0.18)'}`,
    borderRadius: 2,
    fontSize: 14,
    color: readonly ? 'var(--grey)' : 'var(--ink)',
    outline: 'none',
    transition: 'border-color 320ms ease',
  } as const);

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'var(--grey)',
  } as const;

  if (sent) {
    return (
      <main style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px, 6vw, 90px) clamp(20px,4vw,40px)' }}>
        <div
          style={{
            background: 'var(--paper2)',
            borderRadius: 4,
            padding: 'clamp(32px,4vw,60px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(28px,3vw,42px)', letterSpacing: '-0.03em', marginBottom: 16 }}>
            Pendaftaran berhasil
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: '#4b4740', margin: '0 0 24px' }}>
            Terima kasih telah mendaftar. Simpan nomor pendaftaran dan token Anda untuk memantau
            status seleksi secara berkala.
          </p>
          <div style={{ background: 'var(--paper)', borderRadius: 3, borderLeft: '3px solid var(--olive)', padding: '18px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 8 }}>
              Nomor pendaftaran Anda
            </div>
            <div style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 26, letterSpacing: '-0.02em', color: 'var(--olive-d)' }}>
              {nomor}
            </div>
            {token ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', margin: '16px 0 8px' }}>
                  Token cek status
                </div>
                <div style={{ fontFamily: 'var(--disp)', fontWeight: 500, fontSize: 20, letterSpacing: '0.06em', color: 'var(--ink)' }}>
                  {token}
                </div>
                <div style={{ fontSize: 12.5, color: '#6b665c', marginTop: 8 }}>
                  Gunakan nomor + token di halaman Cek Status untuk memantau hasil seleksi. Token juga dikirim ke email Anda bila diisi.
                </div>
              </>
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href="/cek-status"
              className="btn-ink"
              style={{ display: 'inline-flex', alignItems: 'center', height: 50, padding: '0 26px', background: 'var(--ink)', color: 'var(--paper)', fontSize: 14, fontWeight: 600, borderRadius: 2 }}
            >
              Cek Status Pendaftaran
            </Link>
            <Link
              href="/"
              className="btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', height: 50, padding: '0 26px', border: '1px solid rgba(36,33,28,0.3)', color: 'var(--ink)', fontSize: 14, fontWeight: 600, borderRadius: 2 }}
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(40px, 5vw, 72px) clamp(20px, 4vw, 40px)' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--olive)' }}>
          Formulir Pendaftaran
        </div>
        <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.02, letterSpacing: '-0.045em', margin: '16px 0 0' }}>
          Daftar Lomba Nasional Milad 290
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4b4740', maxWidth: '60ch', margin: '18px 0 0' }}>
          Lengkapi seluruh kolom. Kuota tiap cabang 100 peserta dan ditutup setelah kuota
          terpenuhi. Informasi lebih lanjut tentang setiap cabang dapat dilihat di halaman{' '}
          <Link href="/info-peserta" style={{ fontWeight: 600 }}>Info Peserta</Link>.
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
        <input type="hidden" name="cabang" value={cabang} />
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--paper2)',
            borderRadius: 4,
            padding: 'clamp(24px, 3.5vw, 44px)',
          }}
        >
          <h2 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(20px,2vw,26px)', letterSpacing: '-0.03em', margin: '0 0 24px' }}>
            Data diri
          </h2>
          <div className="g-formulir" style={{ display: 'grid', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="nama" style={labelStyle}>Nama lengkap</label>
              <input id="nama" name="nama" type="text" required placeholder="Nama sesuai identitas" style={inputStyle()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="tempatLahir" style={labelStyle}>Tempat lahir</label>
              <input id="tempatLahir" name="tempatLahir" type="text" required placeholder="Kota / kabupaten" style={inputStyle()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="tglLahir" style={labelStyle}>Tanggal lahir</label>
              <input id="tglLahir" name="tanggalLahir" type="date" required value={tglLahir} onChange={onTgl} style={inputStyle()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={labelStyle}>Usia</label>
              <input readOnly placeholder="Terisi otomatis" value={usiaText} style={inputStyle(true)} />
            </div>
            <div className="g-formulir-span2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="asalLembaga" style={labelStyle}>Asal pesantren / lembaga pendidikan</label>
              <input id="asalLembaga" name="asalLembaga" type="text" placeholder="Nama lembaga (mandiri: isi '-')" style={inputStyle()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="whatsapp" style={labelStyle}>Nomor WhatsApp aktif</label>
              <input id="whatsapp" name="whatsapp" type="text" required placeholder="08xxxxxxxxxx" style={inputStyle()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="email" style={labelStyle}>Email (opsional — untuk token pengumuman)</label>
              <input id="email" name="email" type="email" placeholder="nama@email.com" style={inputStyle()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="nomorIdentitas" style={labelStyle}>Nomor identitas (KTP/KTM/KTS)</label>
              <input id="nomorIdentitas" name="nomorIdentitas" type="text" required placeholder="Nomor identitas" style={inputStyle()} />
            </div>
            <div className="g-formulir-span2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="fileIdentitas" style={labelStyle}>Kartu tanda pengenal (scan/foto KTP/KTM/KTS)</label>
              <input id="fileIdentitas" name="fileIdentitas" type="file" accept="image/*,.pdf" required style={{ padding: '12px 14px', background: 'var(--paper)', border: '1px dashed rgba(36,33,28,0.28)', borderRadius: 2, fontSize: 13 }} />
              <div style={{ fontSize: 12, color: 'var(--grey)' }}>JPG, PNG, atau PDF. Maksimal {MAX_FILE_MB}MB.</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(20px,2vw,26px)', letterSpacing: '-0.03em', margin: '0 0 18px' }}>
            Pilih cabang lomba
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {LOMBA.map((c) => {
              const active = cabang === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onCabang(c.id)}
                  style={{
                    textAlign: 'left',
                    padding: '18px 20px',
                    background: active ? 'var(--olive)' : 'var(--paper2)',
                    color: active ? '#fff' : 'var(--ink)',
                    border: `1px solid ${active ? 'var(--olive)' : 'var(--line)'}`,
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 320ms ease',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', opacity: 0.75 }}>{c.kicker.toUpperCase()}</div>
                  <div style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 15, marginTop: 8, lineHeight: 1.3 }}>{c.name}</div>
                  <div style={{ fontSize: 12, marginTop: 10, opacity: 0.85 }}>{c.deadlineTag}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(20px,2vw,26px)', letterSpacing: '-0.03em', margin: '0 0 8px' }}>
            Kirim naskah / video penyisihan
          </h2>
          <p style={{ fontSize: 13, color: '#5a554c', lineHeight: 1.6, margin: '0 0 16px', maxWidth: '70ch' }}>
            {selected
              ? 'Unggah sesuai ketentuan cabang. (Opsional untuk beberapa cabang; bisa dilengkapi kemudian sebelum batas akhir.)'
              : 'Pilih cabang terlebih dahulu untuk melihat ketentuan unggahan.'}
          </p>
          <label htmlFor="fileSubmisi" style={labelStyle}>Berkas submisi (naskah/video) — opsional</label>
          <input id="fileSubmisi" name="fileSubmisi" type="file" accept=".pdf,.doc,.docx,image/*,.mp4" style={{ marginTop: 8, padding: '12px 14px', background: 'var(--paper2)', border: '1px dashed rgba(36,33,28,0.28)', borderRadius: 2, fontSize: 13, width: '100%' }} />
          <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 8 }}>
            PDF, gambar, atau video. Ikuti format penamaan berkas sesuai cabang pada halaman Info Peserta.
          </div>
        </div>

        {usiaLebih ? (
          <div style={{ marginTop: 24, background: 'var(--olive-p)', borderLeft: '3px solid var(--olive)', borderRadius: 2, padding: '14px 16px', fontSize: 13, lineHeight: 1.55, color: '#453d24' }}>
            {usiaLebih} Pastikan cabang yang Anda pilih sesuai.
          </div>
        ) : null}

        {error ? (
          <div style={{ marginTop: 24, background: '#f4dede', borderLeft: '3px solid #a94442', borderRadius: 2, padding: '14px 16px', fontSize: 13, color: '#7a2f2d' }}>
            {error}
          </div>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 34, flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={busy}
            className="submit-hover"
            style={{ height: 54, padding: '0 34px', background: 'var(--ink)', color: 'var(--paper)', border: 0, borderRadius: 2, fontSize: 15, fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}
          >
            {busy ? 'Mengirim...' : 'Kirim Pendaftaran'}
          </button>
          <a
            href="/cek-status"
            style={{ fontSize: 14, fontWeight: 600 }}
          >
            Sudah daftar? Cek status →
          </a>
        </div>
      </form>

      <div style={{ marginTop: 64, borderTop: '1px solid var(--line)', paddingTop: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 16 }}>
          Alur pendaftaran
        </div>
        <div className="g-steps4" style={{ display: 'grid', gap: 20 }}>
          {STEPS.map((s) => (
            <div key={s.num}>
              <div style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 14, color: 'var(--olive)' }}>{s.num}</div>
              <div style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 15, marginTop: 6 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#5a554c', lineHeight: 1.5, marginTop: 6 }}>{s.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
