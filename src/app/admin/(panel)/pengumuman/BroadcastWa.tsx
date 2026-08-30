'use client';

import { useMemo, useState } from 'react';
import { LOMBA } from '@/lib/data';
import { buatTautanWa } from '@/lib/whatsapp';

type Peserta = {
  id: string;
  nama: string;
  email: string | null;
  whatsapp: string;
  cabangId: string;
  cabangShort: string;
  status: string;
};

type Pengumuman = {
  id: string;
  judul: string;
  isi: string;
};

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU_VERIFIKASI: 'Menunggu verifikasi',
  TERVERIFIKASI: 'Terverifikasi',
  DITOLAK: 'Ditolak',
  LOLOS_PENYISIHAN: 'Lolos penyisihan',
  GUGUR_PENYISIHAN: 'Gugur penyisihan',
  LOLOS_FINAL: 'Lolos final',
  JUARA_1: 'Juara 1',
  JUARA_2: 'Juara 2',
  JUARA_3: 'Juara 3',
};
const SEMUA_STATUS = Object.keys(STATUS_LABEL);
const UKURAN_BATCH = 15;

const inputStyle = {
  height: 42,
  padding: '0 12px',
  background: 'var(--paper)',
  border: '1px solid rgba(36,33,28,0.2)',
  borderRadius: 2,
  fontSize: 13.5,
} as const;

type StatusKirim = 'menunggu' | 'terkirim' | 'gagal';

export default function BroadcastWa({ peserta, pengumuman }: { peserta: Peserta[]; pengumuman: Pengumuman[] }) {
  const [judul, setJudul] = useState('');
  const [pesan, setPesan] = useState('');
  const [cabangId, setCabangId] = useState('');
  const [statusDipilih, setStatusDipilih] = useState<string[]>(SEMUA_STATUS);
  const [cari, setCari] = useState('');
  const [waTerkirim, setWaTerkirim] = useState<Record<string, boolean>>({});
  const [statusEmail, setStatusEmail] = useState<Record<string, StatusKirim>>({});
  const [pesanError, setPesanError] = useState<Record<string, string>>({});
  const [kirimBusy, setKirimBusy] = useState(false);
  const [progres, setProgres] = useState({ selesai: 0, total: 0 });

  function pilihPengumuman(id: string) {
    const p = pengumuman.find((x) => x.id === id);
    if (!p) return;
    setJudul(p.judul);
    setPesan(`Assalamu'alaikum {nama},\n\n${p.isi}`);
  }

  function toggleStatus(s: string) {
    setStatusDipilih((arr) => (arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]));
  }

  const filtered = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return peserta.filter((p) => {
      if (cabangId && p.cabangId !== cabangId) return false;
      if (!statusDipilih.includes(p.status)) return false;
      if (q && !p.nama.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [peserta, cabangId, statusDipilih, cari]);

  const bisaKirim = judul.trim() && pesan.trim();

  async function kirimEmailMassal() {
    if (!bisaKirim || kirimBusy) return;
    const target = filtered.filter((p) => p.email);
    if (target.length === 0) return;
    setKirimBusy(true);
    setProgres({ selesai: 0, total: target.length });
    const statusBaru: Record<string, StatusKirim> = {};
    target.forEach((p) => (statusBaru[p.id] = 'menunggu'));
    setStatusEmail((s) => ({ ...s, ...statusBaru }));

    for (let i = 0; i < target.length; i += UKURAN_BATCH) {
      const batch = target.slice(i, i + UKURAN_BATCH);
      try {
        const res = await fetch('/api/admin/pengumuman/kirim-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ judul, pesan, pesertaIds: batch.map((p) => p.id) }),
        });
        const data = await res.json();
        const berhasilSet = new Set<string>(data.terkirim || []);
        const errMap: Record<string, string> = {};
        (data.gagal || []).forEach((g: any) => { errMap[g.id] = g.error; });
        setStatusEmail((s) => {
          const next = { ...s };
          batch.forEach((p) => { next[p.id] = berhasilSet.has(p.id) ? 'terkirim' : 'gagal'; });
          return next;
        });
        setPesanError((s) => ({ ...s, ...errMap }));
      } catch {
        setStatusEmail((s) => {
          const next = { ...s };
          batch.forEach((p) => { next[p.id] = 'gagal'; });
          return next;
        });
      }
      setProgres((pr) => ({ ...pr, selesai: Math.min(target.length, pr.selesai + batch.length) }));
    }
    setKirimBusy(false);
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 18, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
        Kirim Pengumuman ke Peserta
      </h2>
      <p style={{ fontSize: 13, color: '#5a554c', margin: '0 0 18px', maxWidth: '70ch' }}>
        Pakai <code>{'{nama}'}</code> di pesan untuk otomatis diganti nama masing-masing peserta. Email terkirim
        otomatis lewat server (bertahap per {UKURAN_BATCH} peserta); WhatsApp masih lewat tautan wa.me — klik satu
        per satu untuk membuka WhatsApp Web/App dengan pesan sudah terisi.
      </p>

      <div style={{ background: 'var(--paper2)', borderRadius: 4, padding: '22px 24px', marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', display: 'block', marginBottom: 6 }}>
              Isi dari pengumuman yang sudah ada (opsional)
            </label>
            <select onChange={(e) => pilihPengumuman(e.target.value)} defaultValue="" style={{ ...inputStyle, width: '100%' }}>
              <option value="" disabled>
                — pilih untuk mengisi otomatis —
              </option>
              {pengumuman.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.judul}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', display: 'block', marginBottom: 6 }}>
              Judul (dipakai sebagai subjek email)
            </label>
            <input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Mis. Jadwal & Link Zoom Penyisihan" style={{ ...inputStyle, width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', display: 'block', marginBottom: 6 }}>
              Pesan
            </label>
            <textarea
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              rows={6}
              placeholder={"Assalamu'alaikum {nama},\n\nIsi pengumuman..."}
              style={{ width: '100%', padding: 12, fontSize: 13.5, background: 'var(--paper)', border: '1px solid rgba(36,33,28,0.2)', borderRadius: 2, resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', display: 'block', marginBottom: 6 }}>
              Cabang
            </label>
            <select value={cabangId} onChange={(e) => setCabangId(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
              <option value="">Semua cabang</option>
              {LOMBA.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.short}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', display: 'block', marginBottom: 6 }}>
              Cari nama
            </label>
            <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Ketik nama peserta..." style={{ ...inputStyle, width: '100%' }} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', display: 'block', marginBottom: 8 }}>
            Status peserta
          </label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {SEMUA_STATUS.map((s) => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={statusDipilih.includes(s)} onChange={() => toggleStatus(s)} style={{ width: 14, height: 14, accentColor: '#8a7c4c' }} />
                {STATUS_LABEL[s]}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={kirimEmailMassal}
          disabled={!bisaKirim || kirimBusy || filtered.filter((p) => p.email).length === 0}
          style={{ height: 44, padding: '0 22px', background: 'var(--ink)', color: 'var(--paper)', border: 0, borderRadius: 2, fontSize: 13.5, fontWeight: 600, cursor: kirimBusy ? 'wait' : 'pointer' }}
        >
          {kirimBusy ? `Mengirim email... ${progres.selesai}/${progres.total}` : `Kirim Email ke ${filtered.filter((p) => p.email).length} Peserta`}
        </button>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 10 }}>
        {filtered.length} peserta cocok filter
      </div>

      {!bisaKirim ? (
        <div style={{ background: 'var(--paper2)', borderRadius: 4, padding: '20px', fontSize: 13.5, color: '#5a554c' }}>
          Isi judul dan pesan terlebih dahulu untuk memunculkan aksi kirim per peserta.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)', textAlign: 'left' }}>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Nama</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Cabang</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Email</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>WhatsApp</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const pesanPersonal = pesan.replace(/\{nama\}/g, p.nama);
                const st = statusEmail[p.id];
                return (
                  <tr key={p.id}>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 13, fontWeight: 600 }}>{p.nama}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 12.5 }}>{p.cabangShort}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 12.5 }}>
                      {p.email || <span style={{ color: '#a94442' }}>—</span>}
                      {st === 'terkirim' ? <span style={{ marginLeft: 6, color: '#2e7d2e', fontWeight: 700 }}>✓ terkirim</span> : null}
                      {st === 'gagal' ? <span title={pesanError[p.id]} style={{ marginLeft: 6, color: '#a94442', fontWeight: 700 }}>✗ gagal</span> : null}
                      {st === 'menunggu' ? <span style={{ marginLeft: 6, color: 'var(--grey)' }}>mengirim…</span> : null}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 12.5 }}>{p.whatsapp}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)' }}>
                      <a
                        href={buatTautanWa(p.whatsapp, pesanPersonal)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setWaTerkirim((m) => ({ ...m, [p.id]: true }))}
                        style={{ display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 14px', background: waTerkirim[p.id] ? 'transparent' : 'var(--ink)', color: waTerkirim[p.id] ? 'var(--grey)' : 'var(--paper)', border: waTerkirim[p.id] ? '1px solid rgba(36,33,28,0.25)' : 'none', borderRadius: 2, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                      >
                        {waTerkirim[p.id] ? 'Sudah dibuka' : 'Kirim WA →'}
                      </a>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '16px 10px', fontSize: 13, color: '#5a554c' }}>
                    Tidak ada peserta yang cocok dengan filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
