'use client';

import { useEffect, useRef, useState } from 'react';
import { cardStyle } from '../../ui';

type Soal = {
  id: string;
  soal: string;
  pilihanA: string;
  pilihanB: string;
  pilihanC: string;
  pilihanD: string;
  jawaban: string;
  kategori: string | null;
  aktif: boolean;
  urutan: number;
};

type Attempt = {
  id: string;
  nomorPendaftaran: string;
  nama: string;
  status: string;
  skor: number | null;
  soalSaatIni: number;
  totalSoal: number;
  jumlahMencurigakan: number;
  rincianMencurigakan: string[];
  fotoAwal: boolean;
  fotoAkhir: boolean;
  mulaiAt: string | null;
  selesaiAt: string | null;
};

type Ringkasan = { belumMulai: number; sedang: number; selesai: number; rataSkor: number | null };

const inputStyle = {
  height: 40,
  padding: '0 10px',
  background: 'var(--paper)',
  border: '1px solid rgba(36,33,28,0.18)',
  borderRadius: 2,
  fontSize: 13.5,
  color: 'var(--ink)',
} as const;

const btnStyle = {
  height: 40,
  padding: '0 16px',
  background: 'var(--olive)',
  color: '#fff',
  border: 0,
  borderRadius: 2,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
} as const;

export default function SoalKuisManager({
  soalAwal,
  statusAwal,
  ringkasan,
  attempts,
}: {
  soalAwal: Soal[];
  statusAwal: 'dibuka' | 'tertutup';
  ringkasan: Ringkasan;
  attempts: Attempt[];
}) {
  const [soal, setSoal] = useState<Soal[]>(soalAwal);
  const [statusKuis, setStatusKuis] = useState(statusAwal);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [tambah, setTambah] = useState({ soal: '', pilihanA: '', pilihanB: '', pilihanC: '', pilihanD: '', jawaban: 'A', kategori: '' });
  const [teksImpor, setTeksImpor] = useState('');
  const [hasilImpor, setHasilImpor] = useState<{ berhasil: number; gagal: { baris: number; alasan: string }[] } | null>(null);
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());
  const [konfirmasiHapusMassal, setKonfirmasiHapusMassal] = useState(false);
  const timerHapusMassalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [konfirmasiHapusId, setKonfirmasiHapusId] = useState('');
  const timerHapusRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tampilBankSoal, setTampilBankSoal] = useState(true);

  // Baca preferensi tersimpan setelah mount (bukan di initializer useState) agar render
  // pertama di klien tetap sama dengan HTML dari server — localStorage tidak tersedia
  // saat SSR, jadi membacanya di initializer akan memicu hydration mismatch.
  useEffect(() => {
    try {
      setTampilBankSoal(window.localStorage.getItem('admin-kuis-bank-soal-terbuka') !== '0');
    } catch {
      // localStorage tidak tersedia — biarkan tetap terbuka (default).
    }
  }, []);

  function toggleTampilBankSoal() {
    setTampilBankSoal((v) => {
      const next = !v;
      try {
        window.localStorage.setItem('admin-kuis-bank-soal-terbuka', next ? '1' : '0');
      } catch {
        // localStorage tidak tersedia — cukup abaikan, tidak mempengaruhi fungsi utama.
      }
      return next;
    });
  }

  function tampilkanPesan(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  async function ubahStatusKuis(status: 'dibuka' | 'tertutup') {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/kuis/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Gagal mengubah status');
      setStatusKuis(status);
      tampilkanPesan(status === 'dibuka' ? 'Kuis dibuka untuk peserta.' : 'Kuis ditutup.');
    } catch (e: any) {
      tampilkanPesan(e.message || 'Gagal');
    } finally {
      setBusy(false);
    }
  }

  async function tambahSoal(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/admin/soal-kuis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tambah, urutan: soal.length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Gagal menambah soal');
      setSoal((s) => [...s, data.soal]);
      setTambah({ soal: '', pilihanA: '', pilihanB: '', pilihanC: '', pilihanD: '', jawaban: 'A', kategori: '' });
      tampilkanPesan('Soal ditambahkan.');
    } catch (e: any) {
      tampilkanPesan(e.message || 'Gagal');
    } finally {
      setBusy(false);
    }
  }

  async function toggleAktif(id: string, aktif: boolean) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/soal-kuis/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aktif }),
      });
      if (!res.ok) throw new Error('Gagal mengubah soal');
      setSoal((s) => s.map((x) => (x.id === id ? { ...x, aktif } : x)));
    } catch (e: any) {
      tampilkanPesan(e.message || 'Gagal');
    } finally {
      setBusy(false);
    }
  }

  async function hapusSoal(id: string) {
    if (konfirmasiHapusId !== id) {
      if (timerHapusRef.current) clearTimeout(timerHapusRef.current);
      setKonfirmasiHapusId(id);
      timerHapusRef.current = setTimeout(() => setKonfirmasiHapusId((cur) => (cur === id ? '' : cur)), 4000);
      return;
    }
    setKonfirmasiHapusId('');
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/soal-kuis/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus soal');
      setSoal((s) => s.filter((x) => x.id !== id));
      setTerpilih((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
      tampilkanPesan('Soal dihapus.');
    } catch (e: any) {
      tampilkanPesan(e.message || 'Gagal');
    } finally {
      setBusy(false);
    }
  }

  function toggleTerpilih(id: string) {
    setTerpilih((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSemuaSoal() {
    setTerpilih((s) => (s.size === soal.length ? new Set() : new Set(soal.map((x) => x.id))));
  }

  async function hapusTerpilih() {
    if (terpilih.size === 0) return;
    if (!konfirmasiHapusMassal) {
      if (timerHapusMassalRef.current) clearTimeout(timerHapusMassalRef.current);
      setKonfirmasiHapusMassal(true);
      timerHapusMassalRef.current = setTimeout(() => setKonfirmasiHapusMassal(false), 5000);
      return;
    }
    setKonfirmasiHapusMassal(false);
    setBusy(true);
    try {
      const ids = Array.from(terpilih);
      const res = await fetch('/api/admin/soal-kuis', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Gagal menghapus soal terpilih');
      setSoal((s) => s.filter((x) => !terpilih.has(x.id)));
      setTerpilih(new Set());
      tampilkanPesan(`${data.dihapus ?? ids.length} soal dihapus.`);
    } catch (e: any) {
      tampilkanPesan(e.message || 'Gagal');
    } finally {
      setBusy(false);
    }
  }

  async function imporMassal() {
    setBusy(true);
    setHasilImpor(null);
    try {
      const res = await fetch('/api/admin/soal-kuis/impor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teks: teksImpor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Gagal mengimpor');
      setHasilImpor(data);
      if (data.berhasil > 0) {
        const listRes = await fetch('/api/admin/soal-kuis');
        const listData = await listRes.json();
        setSoal(listData.soal);
        setTeksImpor('');
      }
      tampilkanPesan(`${data.berhasil} soal berhasil diimpor.`);
    } catch (e: any) {
      tampilkanPesan(e.message || 'Gagal');
    } finally {
      setBusy(false);
    }
  }

  const aktifCount = soal.filter((s) => s.aktif).length;

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      {msg ? (
        <div style={{ background: 'var(--olive-p)', color: '#453d24', fontSize: 13, borderRadius: 2, padding: '12px 16px' }}>{msg}</div>
      ) : null}

      {/* Status kuis & ringkasan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)' }}>Akses kuis</div>
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 600, fontSize: 15.5, margin: '10px 0 14px' }}>
            {statusKuis === 'dibuka' ? 'Dibuka' : 'Tertutup'} · {aktifCount} soal aktif
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={busy || statusKuis === 'dibuka'} onClick={() => ubahStatusKuis('dibuka')} style={{ ...btnStyle, background: statusKuis === 'dibuka' ? 'rgba(36,33,28,0.15)' : 'var(--olive)' }}>
              Buka
            </button>
            <button disabled={busy || statusKuis === 'tertutup'} onClick={() => ubahStatusKuis('tertutup')} style={{ ...btnStyle, background: statusKuis === 'tertutup' ? 'rgba(36,33,28,0.15)' : '#a94442' }}>
              Tutup
            </button>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)' }}>Belum mulai</div>
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 26, marginTop: 8, letterSpacing: '-0.01em' }}>{ringkasan.belumMulai}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)' }}>Sedang mengerjakan</div>
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 26, marginTop: 8, letterSpacing: '-0.01em' }}>{ringkasan.sedang}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)' }}>Selesai · rata-rata</div>
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 26, marginTop: 8, letterSpacing: '-0.01em' }}>
            {ringkasan.selesai} <span style={{ fontSize: 15, color: 'var(--grey)' }}>· {ringkasan.rataSkor ?? '–'}</span>
          </div>
        </div>
      </div>

      {/* Impor massal */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 15, margin: '0 0 10px' }}>Impor soal massal</h3>
        <p style={{ fontSize: 12.5, color: '#5a554c', margin: '0 0 10px' }}>
          Satu baris per soal, format: <code>Soal|PilihanA|PilihanB|PilihanC|PilihanD|Jawaban|Kategori</code> (Kategori opsional).
        </p>
        <textarea
          value={teksImpor}
          onChange={(e) => setTeksImpor(e.target.value)}
          rows={6}
          placeholder={'Apa hukum wudhu bagi orang yang berhadats?|Wajib|Sunnah|Makruh|Mubah|A|Fikih'}
          style={{ width: '100%', padding: 10, fontSize: 12.5, fontFamily: 'monospace', border: '1px solid rgba(36,33,28,0.18)', borderRadius: 2, marginBottom: 10 }}
        />
        <button disabled={busy || !teksImpor.trim()} onClick={imporMassal} style={btnStyle}>
          Impor
        </button>
        {hasilImpor ? (
          <div style={{ marginTop: 12, fontSize: 12.5 }}>
            <div style={{ color: '#2e7d2e', fontWeight: 600 }}>{hasilImpor.berhasil} baris berhasil diimpor.</div>
            {hasilImpor.gagal.length > 0 ? (
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: '#a94442' }}>
                {hasilImpor.gagal.map((g, i) => (
                  <li key={i}>Baris {g.baris}: {g.alasan}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Tambah satu soal */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 15, margin: '0 0 14px' }}>Tambah soal</h3>
        <form onSubmit={tambahSoal} style={{ display: 'grid', gap: 10 }}>
          <textarea
            value={tambah.soal}
            onChange={(e) => setTambah((t) => ({ ...t, soal: e.target.value }))}
            placeholder="Pertanyaan"
            required
            rows={2}
            style={{ ...inputStyle, height: 'auto', padding: 10, fontFamily: 'inherit' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
            <input value={tambah.pilihanA} onChange={(e) => setTambah((t) => ({ ...t, pilihanA: e.target.value }))} placeholder="Pilihan A" required style={inputStyle} />
            <input value={tambah.pilihanB} onChange={(e) => setTambah((t) => ({ ...t, pilihanB: e.target.value }))} placeholder="Pilihan B" required style={inputStyle} />
            <input value={tambah.pilihanC} onChange={(e) => setTambah((t) => ({ ...t, pilihanC: e.target.value }))} placeholder="Pilihan C" required style={inputStyle} />
            <input value={tambah.pilihanD} onChange={(e) => setTambah((t) => ({ ...t, pilihanD: e.target.value }))} placeholder="Pilihan D" required style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={tambah.jawaban} onChange={(e) => setTambah((t) => ({ ...t, jawaban: e.target.value }))} style={inputStyle}>
              {['A', 'B', 'C', 'D'].map((h) => (
                <option key={h} value={h}>Jawaban benar: {h}</option>
              ))}
            </select>
            <input value={tambah.kategori} onChange={(e) => setTambah((t) => ({ ...t, kategori: e.target.value }))} placeholder="Kategori (nahwu/fikih/sharaf)" style={inputStyle} />
            <button type="submit" disabled={busy} style={btnStyle}>Tambah</button>
          </div>
        </form>
      </div>

      {/* Daftar soal */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 15, margin: 0 }}>Bank soal ({soal.length})</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={hapusTerpilih}
              disabled={terpilih.size === 0 || busy}
              style={{
                height: 34,
                padding: '0 14px',
                fontSize: 12.5,
                fontWeight: 600,
                background: terpilih.size === 0 ? 'transparent' : konfirmasiHapusMassal ? '#a94442' : 'transparent',
                color: terpilih.size === 0 ? 'var(--grey)' : konfirmasiHapusMassal ? '#fff' : '#a94442',
                border: `1px solid ${terpilih.size === 0 ? 'rgba(36,33,28,0.2)' : '#a94442'}`,
                borderRadius: 2,
                cursor: terpilih.size === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {konfirmasiHapusMassal ? `Yakin hapus ${terpilih.size} soal? Klik lagi` : `Hapus Terpilih (${terpilih.size})`}
            </button>
            <button
              type="button"
              onClick={toggleTampilBankSoal}
              style={{
                height: 34,
                padding: '0 14px',
                fontSize: 12.5,
                fontWeight: 600,
                background: 'transparent',
                color: 'var(--ink)',
                border: '1px solid rgba(36,33,28,0.2)',
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              {tampilBankSoal ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>
        </div>
        {tampilBankSoal ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)', textAlign: 'left' }}>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>
                  <input
                    type="checkbox"
                    checked={soal.length > 0 && terpilih.size === soal.length}
                    onChange={toggleSemuaSoal}
                    aria-label="Pilih semua soal"
                  />
                </th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Soal</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Jawaban</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Kategori</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Aktif</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }} />
              </tr>
            </thead>
            <tbody>
              {soal.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--line)' }}>
                    <input type="checkbox" checked={terpilih.has(s.id)} onChange={() => toggleTerpilih(s.id)} aria-label={`Pilih soal: ${s.soal}`} />
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 13, maxWidth: 360 }}>{s.soal}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 13, fontWeight: 700 }}>{s.jawaban}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 12.5, color: '#6b665c' }}>{s.kategori || '–'}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--line)' }}>
                    <input type="checkbox" checked={s.aktif} disabled={busy} onChange={(e) => toggleAktif(s.id, e.target.checked)} />
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--line)' }}>
                    <button
                      onClick={() => hapusSoal(s.id)}
                      disabled={busy}
                      style={{
                        fontSize: 12,
                        color: konfirmasiHapusId === s.id ? '#fff' : '#a94442',
                        background: konfirmasiHapusId === s.id ? '#a94442' : 'transparent',
                        border: 0,
                        borderRadius: 2,
                        padding: konfirmasiHapusId === s.id ? '4px 8px' : 0,
                        cursor: 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {konfirmasiHapusId === s.id ? 'Yakin?' : 'Hapus'}
                    </button>
                  </td>
                </tr>
              ))}
              {soal.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '16px 10px', fontSize: 13, color: '#5a554c' }}>Belum ada soal.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        ) : null}
      </div>

      {/* Monitoring peserta */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 15, margin: '0 0 14px' }}>Progres peserta</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)', textAlign: 'left' }}>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Peserta</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Status</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Progres</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Skor</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Mencurigakan</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Foto</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{a.nama}</div>
                    <div style={{ fontSize: 12, color: '#6b665c' }}>{a.nomorPendaftaran}</div>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 12.5 }}>{a.status === 'SEDANG' ? 'Sedang mengerjakan' : 'Selesai'}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 12.5 }}>{a.soalSaatIni}/{a.totalSoal}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 13, fontWeight: 700 }}>{a.skor ?? '–'}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 12.5, color: a.jumlahMencurigakan > 0 ? '#a94442' : 'inherit' }}>
                    <div style={{ fontWeight: 700 }}>{a.jumlahMencurigakan}</div>
                    {a.rincianMencurigakan.length > 0 ? (
                      <div style={{ fontSize: 11, color: '#8a6a68', marginTop: 2 }}>
                        {a.rincianMencurigakan.join(' · ')}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {a.fotoAwal ? (
                      <a href={`/api/berkas?id=${encodeURIComponent(a.id)}&jenis=kuis-awal`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>
                        Awal ↗
                      </a>
                    ) : (
                      <span style={{ color: 'var(--grey)' }}>Awal –</span>
                    )}
                    {' · '}
                    {a.fotoAkhir ? (
                      <a href={`/api/berkas?id=${encodeURIComponent(a.id)}&jenis=kuis-akhir`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>
                        Akhir ↗
                      </a>
                    ) : (
                      <span style={{ color: 'var(--grey)' }}>Akhir –</span>
                    )}
                  </td>
                </tr>
              ))}
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '16px 10px', fontSize: 13, color: '#5a554c' }}>Belum ada peserta yang memulai kuis.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
