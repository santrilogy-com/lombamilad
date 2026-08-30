'use client';

import { useMemo, useState } from 'react';
import { LOMBA } from '@/lib/data';
import { buatTautanWa } from '@/lib/whatsapp';

type Peserta = {
  id: string;
  nama: string;
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

const inputStyle = {
  height: 42,
  padding: '0 12px',
  background: 'var(--paper)',
  border: '1px solid rgba(36,33,28,0.2)',
  borderRadius: 2,
  fontSize: 13.5,
} as const;

export default function BroadcastWa({ peserta, pengumuman }: { peserta: Peserta[]; pengumuman: Pengumuman[] }) {
  const [pesan, setPesan] = useState('');
  const [cabangId, setCabangId] = useState('');
  const [statusDipilih, setStatusDipilih] = useState<string[]>(SEMUA_STATUS);
  const [cari, setCari] = useState('');
  const [terkirim, setTerkirim] = useState<Record<string, boolean>>({});

  function pilihPengumuman(id: string) {
    const p = pengumuman.find((x) => x.id === id);
    if (!p) return;
    setPesan(`Assalamu'alaikum {nama},\n\n*${p.judul}*\n\n${p.isi}\n\n— Panitia Lomba Nasional Milad Sidogiri 290`);
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

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 18, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
        Kirim Pengumuman ke WhatsApp Peserta
      </h2>
      <p style={{ fontSize: 13, color: '#5a554c', margin: '0 0 18px', maxWidth: '70ch' }}>
        Sementara memakai tautan wa.me — klik &quot;Kirim&quot; per peserta akan membuka WhatsApp Web/App dengan pesan
        sudah terisi, lalu Anda tinggal menekan kirim di sana. Pakai <code>{'{nama}'}</code> di pesan untuk otomatis
        diganti nama masing-masing peserta.
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

        <div>
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
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 10 }}>
        {filtered.length} peserta cocok filter
      </div>

      {!pesan.trim() ? (
        <div style={{ background: 'var(--paper2)', borderRadius: 4, padding: '20px', fontSize: 13.5, color: '#5a554c' }}>
          Isi pesan terlebih dahulu untuk memunculkan tombol kirim per peserta.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)', textAlign: 'left' }}>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Nama</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>Cabang</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }}>No. WhatsApp</th>
                <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--ink)' }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const pesanPersonal = pesan.replace(/\{nama\}/g, p.nama);
                return (
                  <tr key={p.id} style={{ opacity: terkirim[p.id] ? 0.5 : 1 }}>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 13, fontWeight: 600 }}>{p.nama}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 12.5 }}>{p.cabangShort}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)', fontSize: 12.5 }}>{p.whatsapp}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--line)' }}>
                      <a
                        href={buatTautanWa(p.whatsapp, pesanPersonal)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setTerkirim((m) => ({ ...m, [p.id]: true }))}
                        style={{ display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 14px', background: terkirim[p.id] ? 'transparent' : 'var(--ink)', color: terkirim[p.id] ? 'var(--grey)' : 'var(--paper)', border: terkirim[p.id] ? '1px solid rgba(36,33,28,0.25)' : 'none', borderRadius: 2, fontSize: 12, fontWeight: 600 }}
                      >
                        {terkirim[p.id] ? 'Sudah dibuka' : 'Kirim WA →'}
                      </a>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '16px 10px', fontSize: 13, color: '#5a554c' }}>
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
