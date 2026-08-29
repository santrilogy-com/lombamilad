'use client';

import { useState } from 'react';

type Row = {
  id: string;
  nomorPendaftaran: string;
  nama: string;
  asalLembaga: string;
  whatsapp: string;
  cabangId: string;
  cabangNama: string;
  status: string;
  statusKode: string;
  usia: number;
  tanggalDaftar: string;
  catatan: string | null;
  fileIdentitas: string | null;
  fileSubmisi: string | null;
  nilaiPenyisihan: number | null;
  nilaiFinal: number | null;
};

const STATUS_OPTIONS = [
  { k: 'MENUNGGU_VERIFIKASI', l: 'Menunggu verifikasi' },
  { k: 'TERVERIFIKASI', l: 'Terverifikasi' },
  { k: 'DITOLAK', l: 'Ditolak' },
  { k: 'LOLOS_PENYISIHAN', l: 'Lolos penyisihan' },
  { k: 'GUGUR_PENYISIHAN', l: 'Gugur penyisihan' },
  { k: 'LOLOS_FINAL', l: 'Lolos final' },
  { k: 'JUARA_1', l: 'Juara 1' },
  { k: 'JUARA_2', l: 'Juara 2' },
  { k: 'JUARA_3', l: 'Juara 3' },
];

export default function PendaftarAdminTable({
  pendaftar,
  searchQuery,
  cabangId,
}: {
  pendaftar: Row[];
  searchQuery?: string;
  cabangId?: string;
}) {
  const [rows, setRows] = useState<Row[]>(pendaftar);
  const [busyId, setBusyId] = useState('');
  const [msg, setMsg] = useState<{ id: string; text: string } | null>(null);

  async function update(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/pendaftar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Gagal');
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patchRow(data.pendaftar) } : r)));
      setMsg({ id, text: 'Tersimpan' });
      setTimeout(() => setMsg(null), 2000);
    } catch (e: any) {
      setMsg({ id, text: e.message || 'Gagal' });
      setTimeout(() => setMsg(null), 3000);
    } finally {
      setBusyId('');
    }
  }

  function patchRow(p: any) {
    return {
      statusKode: p.status,
      status: STATUS_OPTIONS.find((s) => s.k === p.status)?.l || p.status,
      catatan: p.verifikasiCatatan,
      nilaiPenyisihan: p.nilai?.nilaiPenyisihan ?? null,
      nilaiFinal: p.nilai?.nilaiFinal ?? null,
    };
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
        <thead>
          <tr style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)', textAlign: 'left' }}>
            <th style={{ padding: '10px 10px', borderBottom: '2px solid var(--ink)' }}>No.</th>
            <th style={{ padding: '10px 10px', borderBottom: '2px solid var(--ink)' }}>Nama / Lembaga</th>
            <th style={{ padding: '10px 10px', borderBottom: '2px solid var(--ink)' }}>Cabang</th>
            <th style={{ padding: '10px 10px', borderBottom: '2px solid var(--ink)' }}>Status</th>
            <th style={{ padding: '10px 10px', borderBottom: '2px solid var(--ink)' }}>Nilai (P/F)</th>
            <th style={{ padding: '10px 10px', borderBottom: '2px solid var(--ink)' }}>Berkas</th>
            <th style={{ padding: '10px 10px', borderBottom: '2px solid var(--ink)' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: '30px', fontSize: 14, color: '#8a8578' }}>
                Tidak ada pendaftar.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <PendaftarRow
                key={r.id}
                row={r}
                busy={busyId === r.id}
                msg={msg?.id === r.id ? msg.text : null}
                onStatus={(status) => update(r.id, { status })}
                onVerify={() => update(r.id, { status: 'TERVERIFIKASI' })}
                onReject={() => update(r.id, { status: 'DITOLAK' })}
                onCatatan={(c) => update(r.id, { verifikasiCatatan: c })}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function PendaftarRow({
  row,
  busy,
  msg,
  onStatus,
  onVerify,
  onReject,
  onCatatan,
}: {
  row: Row;
  busy: boolean;
  msg: string | null;
  onStatus: (s: string) => void;
  onVerify: () => void;
  onReject: () => void;
  onCatatan: (c: string) => void;
}) {
  const [catatan, setCatatan] = useState(row.catatan || '');

  return (
    <tr style={{ verticalAlign: 'top' }}>
      <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--line)', fontSize: 12.5, fontWeight: 600, color: 'var(--olive-d)', whiteSpace: 'nowrap' }}>
        {row.nomorPendaftaran}
      </td>
      <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{row.nama}</div>
        <div style={{ fontSize: 12, color: '#6b665c' }}>{row.asalLembaga || '-'}</div>
        <div style={{ fontSize: 11.5, color: 'var(--grey)' }}>WA: {row.whatsapp} · {row.usia} th</div>
      </td>
      <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--line)', fontSize: 12.5 }}>{row.cabangNama}</td>
      <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--line)' }}>
        <select
          value={row.statusKode}
          onChange={(e) => onStatus(e.target.value)}
          disabled={busy}
          style={{
            height: 34,
            padding: '0 8px',
            background: 'var(--paper)',
            border: '1px solid rgba(36,33,28,0.2)',
            borderRadius: 2,
            fontSize: 12,
            maxWidth: 170,
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.k} value={s.k}>{s.l}</option>
          ))}
        </select>
      </td>
      <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--line)', fontSize: 12.5, whiteSpace: 'nowrap' }}>
        {row.nilaiPenyisihan ?? '–'} / {row.nilaiFinal ?? '–'}
      </td>
      <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--line)' }}>
        {row.fileIdentitas ? (
          <a
            href={`/api/berkas?file=${encodeURIComponent(row.fileIdentitas)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, display: 'inline-block', fontWeight: 600 }}
          >
            Kartu identitas ↗
          </a>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--grey)' }}>–</span>
        )}
        {row.fileSubmisi ? (
          <a
            href={`/api/berkas?file=${encodeURIComponent(row.fileSubmisi)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, display: 'inline-block', fontWeight: 600, marginLeft: 10 }}
          >
            Submisi ↗
          </a>
        ) : null}
      </td>
      <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={onVerify}
            disabled={busy}
            style={{ height: 32, padding: '0 12px', background: '#2e7d2e', color: '#fff', border: 0, borderRadius: 2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Verifikasi
          </button>
          <button
            onClick={onReject}
            disabled={busy}
            style={{ height: 32, padding: '0 12px', background: '#a94442', color: '#fff', border: 0, borderRadius: 2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Tolak
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
          <input
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan (opsional)"
            style={{ height: 30, padding: '0 8px', fontSize: 12, width: 130, background: 'var(--paper)', border: '1px solid rgba(36,33,28,0.2)', borderRadius: 2 }}
          />
          <button onClick={() => onCatatan(catatan)} disabled={busy} style={{ height: 30, padding: '0 10px', fontSize: 12, background: 'transparent', border: '1px solid rgba(36,33,28,0.25)', borderRadius: 2, cursor: 'pointer' }}>
            Simpan
          </button>
        </div>
        {msg ? <div style={{ fontSize: 11.5, color: '#4f6b1f', marginTop: 6 }}>{msg}</div> : null}
      </td>
    </tr>
  );
}