'use client';

import { useMemo, useRef, useState } from 'react';
import { Badge, thStyle } from '../../ui';

type Row = {
  id: string;
  nomorPendaftaran: string;
  nama: string;
  email: string | null;
  asalLembaga: string;
  cabangId: string;
  cabangNama: string;
  status: string;
  nilaiPenyisihan: number | null;
  nilaiBabak2: number | null;
  nilaiFinal: number | null;
  peringkatPenyisihan: number | null;
  peringkatBabak2: number | null;
  peringkatFinal: number | null;
};

export default function PenilaianTable({
  pendaftar,
  cabangId,
  tahap,
}: {
  pendaftar: Row[];
  cabangId: string;
  tahap: string;
}) {
  const [rows, setRows] = useState<Row[]>(pendaftar);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [statusHasil, setStatusHasil] = useState<Record<string, 'menunggu' | 'terkirim' | 'gagal'>>({});
  const [kirimHasilCabang, setKirimHasilCabang] = useState<string | null>(null);
  const [konfirmasiKirimHasil, setKonfirmasiKirimHasil] = useState<string | null>(null);
  const konfirmasiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [konfirmasiProses, setKonfirmasiProses] = useState<string | null>(null);
  const konfirmasiProsesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const grouped = useMemo(() => {
    const g = new Map<string, Row[]>();
    for (const r of rows) {
      const arr = g.get(r.cabangId) || [];
      arr.push(r);
      g.set(r.cabangId, arr);
    }
    return Array.from(g.entries());
  }, [rows]);

  async function saveNilai(id: string, field: 'nilaiPenyisihan' | 'nilaiBabak2' | 'nilaiFinal', v: number | null) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/pendaftar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: v }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan nilai');
      setRows((rs) =>
        rs.map((r) => (r.id === id ? { ...r, [field]: v } : r))
      );
      setMsg('Nilai tersimpan');
      setTimeout(() => setMsg(''), 2000);
    } catch (e: any) {
      setMsg(e.message || 'Gagal');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setBusy(false);
    }
  }

  function mintaKonfirmasiProses(aksi: string): boolean {
    // Setiap aksi proses massal (ubah status banyak peserta sekaligus) butuh
    // klik konfirmasi kedua dulu — supaya tidak terpicu karena klik tidak sengaja.
    if (konfirmasiProses !== aksi) {
      if (konfirmasiProsesTimerRef.current) clearTimeout(konfirmasiProsesTimerRef.current);
      setKonfirmasiProses(aksi);
      konfirmasiProsesTimerRef.current = setTimeout(() => setKonfirmasiProses((cur) => (cur === aksi ? null : cur)), 5000);
      return false;
    }
    setKonfirmasiProses(null);
    return true;
  }

  async function prosesKelulusan() {
    if (!mintaKonfirmasiProses('lulus')) return;
    setBusy(true);
    setMsg('');
    try {
      setMsg('Menghitung kelulusan per cabang...');
      const res = await fetch('/api/admin/penilaian/proses-lulus', { method: 'POST' });
      const data = await res.json();
      if (data?.ok) {
        setMsg('Kelulusan berhasil diproses. Muat ulang halaman untuk melihat hasil.');
      } else {
        setMsg(data?.error || 'Gagal memproses');
      }
      setTimeout(() => setMsg(''), 4000);
    } finally {
      setBusy(false);
    }
  }

  async function prosesMqk(tahap: 'babak1' | 'babak2') {
    if (!mintaKonfirmasiProses(tahap)) return;
    setBusy(true);
    setMsg('');
    try {
      setMsg(tahap === 'babak1' ? 'Memproses top 10 Babak I...' : 'Memproses top 5 Babak II...');
      const res = await fetch(`/api/admin/kuis/proses-${tahap}`, { method: 'POST' });
      const data = await res.json();
      if (data?.ok) {
        setMsg('Berhasil diproses. Muat ulang halaman untuk melihat hasil.');
      } else {
        setMsg(data?.error || 'Gagal memproses');
      }
      setTimeout(() => setMsg(''), 4000);
    } finally {
      setBusy(false);
    }
  }

  const UKURAN_BATCH = 15;

  async function kirimHasilKeCabang(cid: string, peserta: Row[]) {
    const target = peserta.filter((p) => p.email && (p.nilaiPenyisihan !== null || p.nilaiBabak2 !== null || p.nilaiFinal !== null));
    if (target.length === 0) return;
    if (konfirmasiKirimHasil !== cid) {
      // Klik pertama hanya meminta konfirmasi — supaya hasil tidak terkirim ke
      // seluruh peserta cabang karena satu klik tidak sengaja.
      if (konfirmasiTimerRef.current) clearTimeout(konfirmasiTimerRef.current);
      setKonfirmasiKirimHasil(cid);
      konfirmasiTimerRef.current = setTimeout(() => setKonfirmasiKirimHasil((cur) => (cur === cid ? null : cur)), 5000);
      return;
    }
    setKonfirmasiKirimHasil(null);
    setKirimHasilCabang(cid);
    const awal: Record<string, 'menunggu'> = {};
    target.forEach((p) => (awal[p.id] = 'menunggu'));
    setStatusHasil((s) => ({ ...s, ...awal }));

    for (let i = 0; i < target.length; i += UKURAN_BATCH) {
      const batch = target.slice(i, i + UKURAN_BATCH);
      try {
        const res = await fetch('/api/admin/penilaian/kirim-hasil', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pesertaIds: batch.map((p) => p.id) }),
        });
        const data = await res.json();
        const berhasilSet = new Set<string>(data.terkirim || []);
        setStatusHasil((s) => {
          const next = { ...s };
          batch.forEach((p) => { next[p.id] = berhasilSet.has(p.id) ? 'terkirim' : 'gagal'; });
          return next;
        });
      } catch {
        setStatusHasil((s) => {
          const next = { ...s };
          batch.forEach((p) => { next[p.id] = 'gagal'; });
          return next;
        });
      }
    }
    setKirimHasilCabang(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--grey)' }}>
          Tahap: {tahap === 'penyisihan' ? 'Penyisihan' : 'Final'} · {cabangId ? rows.filter((r) => r.cabangId === cabangId).length : rows.length} peserta
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {cabangId === 'mqk' ? (
            <>
              <button
                onClick={() => prosesMqk('babak1')}
                disabled={busy}
                style={{ height: 42, padding: '0 18px', background: konfirmasiProses === 'babak1' ? '#a94442' : 'var(--olive)', color: '#fff', border: 0, borderRadius: 2, fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}
              >
                {konfirmasiProses === 'babak1' ? 'Yakin? Klik lagi' : 'Proses Babak I → II (top 10)'}
              </button>
              <button
                onClick={() => prosesMqk('babak2')}
                disabled={busy}
                style={{ height: 42, padding: '0 18px', background: konfirmasiProses === 'babak2' ? '#a94442' : 'var(--olive-d)', color: '#fff', border: 0, borderRadius: 2, fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}
              >
                {konfirmasiProses === 'babak2' ? 'Yakin? Klik lagi' : 'Proses Babak II → Final (top 5)'}
              </button>
            </>
          ) : (
            <button
              onClick={prosesKelulusan}
              disabled={busy}
              style={{ height: 42, padding: '0 20px', background: konfirmasiProses === 'lulus' ? '#a94442' : 'var(--olive)', color: '#fff', border: 0, borderRadius: 2, fontSize: 13.5, fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}
            >
              {busy ? 'Memproses...' : konfirmasiProses === 'lulus' ? 'Yakin? Klik lagi' : 'Proses Kelulusan (top 5 → final)'}
            </button>
          )}
        </div>
      </div>

      {msg ? (
        <div style={{ background: 'var(--olive-p)', color: '#453d24', fontSize: 13, borderRadius: 2, padding: '12px 16px', marginBottom: 18 }}>
          {msg}
        </div>
      ) : null}

      {grouped.map(([cid, peserta]) => {
        const bisaKirim = peserta.filter((p) => p.email && (p.nilaiPenyisihan !== null || p.nilaiBabak2 !== null || p.nilaiFinal !== null));
        return (
        <div key={cid} style={{ marginBottom: 34 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
            <h3 style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 14.5, letterSpacing: '0.01em', margin: 0 }}>
              {peserta[0]?.cabangNama}
            </h3>
            <button
              onClick={() => kirimHasilKeCabang(cid, peserta)}
              disabled={kirimHasilCabang === cid || bisaKirim.length === 0}
              style={{
                height: 36,
                padding: '0 16px',
                background: konfirmasiKirimHasil === cid ? '#a94442' : 'transparent',
                color: konfirmasiKirimHasil === cid ? '#fff' : 'var(--ink)',
                border: `1px solid ${konfirmasiKirimHasil === cid ? '#a94442' : 'rgba(36,33,28,0.25)'}`,
                borderRadius: 2,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: bisaKirim.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {kirimHasilCabang === cid
                ? 'Mengirim…'
                : konfirmasiKirimHasil === cid
                  ? `Yakin kirim ke ${bisaKirim.length} peserta? Klik lagi`
                  : `Kirim Hasil ke Email (${bisaKirim.length})`}
            </button>
          </div>
          <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 6 }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, padding: '9px 10px' }}>No.</th>
                  <th style={{ ...thStyle, padding: '9px 10px' }}>Nama</th>
                  <th style={{ ...thStyle, padding: '9px 10px' }}>Nilai Penyisihan</th>
                  <th style={{ ...thStyle, padding: '9px 10px' }}>Peringkat</th>
                  {cid === 'mqk' ? (
                    <>
                      <th style={{ ...thStyle, padding: '9px 10px' }}>Nilai Babak II</th>
                      <th style={{ ...thStyle, padding: '9px 10px' }}>Peringkat II</th>
                    </>
                  ) : null}
                  <th style={{ ...thStyle, padding: '9px 10px' }}>Nilai Final</th>
                  <th style={{ ...thStyle, padding: '9px 10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {peserta.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 12.5, fontWeight: 600, color: 'var(--olive-d)', whiteSpace: 'nowrap' }}>{p.nomorPendaftaran}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                        {p.nama}
                        {statusHasil[p.id] === 'terkirim' ? <span style={{ marginLeft: 6, fontSize: 11, color: '#2e7d2e' }}>✓ email terkirim</span> : null}
                        {statusHasil[p.id] === 'gagal' ? <span style={{ marginLeft: 6, fontSize: 11, color: '#a94442' }}>✗ email gagal</span> : null}
                        {statusHasil[p.id] === 'menunggu' ? <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--grey)' }}>mengirim…</span> : null}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b665c' }}>{p.asalLembaga}</div>
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)' }}>
                      <NilaiInput value={p.nilaiPenyisihan} disabled={busy} onChange={(v) => saveNilai(p.id, 'nilaiPenyisihan', v)} />
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>{p.peringkatPenyisihan ?? '–'}</td>
                    {cid === 'mqk' ? (
                      <>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--line)' }}>
                          <NilaiInput value={p.nilaiBabak2} disabled={busy} onChange={(v) => saveNilai(p.id, 'nilaiBabak2', v)} />
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>{p.peringkatBabak2 ?? '–'}</td>
                      </>
                    ) : null}
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)' }}>
                      <NilaiInput value={p.nilaiFinal} disabled={busy} onChange={(v) => saveNilai(p.id, 'nilaiFinal', v)} />
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)' }}>
                      <Badge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        );
      })}
      {rows.length === 0 ? (
        <div style={{ background: 'var(--paper2)', borderRadius: 4, padding: '28px', fontSize: 14, color: '#5a554c' }}>
          Belum ada peserta terverifikasi untuk dinilai.
        </div>
      ) : null}
    </div>
  );
}

function NilaiInput({
  value,
  disabled,
  onChange,
}: {
  value: number | null;
  disabled: boolean;
  onChange: (v: number | null) => void;
}) {
  const [local, setLocal] = useState(value === null ? '' : String(value));
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <input
        type="number"
        min={0}
        max={100}
        value={local}
        disabled={disabled}
        onChange={(e) => setLocal(e.target.value)}
        style={{ width: 64, height: 32, padding: '0 8px', fontSize: 13, background: 'var(--paper)', border: '1px solid rgba(36,33,28,0.2)', borderRadius: 2 }}
      />
      <button
        disabled={disabled || local === ''}
        onClick={() => onChange(Number(local))}
        style={{ height: 32, padding: '0 10px', fontSize: 12, background: 'transparent', border: '1px solid rgba(36,33,28,0.25)', borderRadius: 2, cursor: 'pointer' }}
      >
        Simpan
      </button>
    </div>
  );
}