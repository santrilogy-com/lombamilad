import { CONTACT_WA, LOMBA } from '@/lib/data';
import { normalisasiNomorWa } from '@/lib/whatsapp';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Notifikasi WhatsApp otomatis ke admin panitia lewat gateway Fonnte
 * (https://fonnte.com). Butuh env FONNTE_TOKEN (token device di dashboard
 * Fonnte); nomor tujuan dari ADMIN_WA_NOTIF, default nomor panitia pertama.
 *
 * Semua fungsi di sini "gagal diam-diam": tidak pernah melempar dan dibatasi
 * waktu, supaya gangguan di Fonnte tidak pernah menggagalkan atau menahan lama
 * pendaftaran/unggahan peserta. Tetap di-await di call site karena fungsi
 * serverless bisa dibekukan begitu respons dikirim.
 */

const BATAS_WAKTU_MS = 4000;

function namaCabang(cabangId: string) {
  return LOMBA.find((c) => c.id === cabangId)?.short || cabangId;
}

function jamWib() {
  return new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' });
}

export async function kirimNotifAdmin(pesan: string): Promise<void> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) return;
  const target = normalisasiNomorWa(process.env.ADMIN_WA_NOTIF || CONTACT_WA[0]);
  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: token },
      body: new URLSearchParams({ target, message: `${pesan}\n\n_${jamWib()} WIB · miladsidogiri.id_` }),
      signal: AbortSignal.timeout(BATAS_WAKTU_MS),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.status === false) {
      console.error('Notif WA admin ditolak Fonnte', res.status, data?.reason || data);
    }
  } catch (err) {
    console.error('Notif WA admin gagal', err);
  }
}

export function notifPendaftarBaru(p: {
  nama: string;
  cabangId: string;
  nomorPendaftaran: string;
  asalLembaga: string;
  whatsapp: string;
  adaKarya: boolean;
}) {
  return kirimNotifAdmin(
    `*Pendaftar baru — ${namaCabang(p.cabangId)}*\n` +
      `Nama: ${p.nama}\nNo. pendaftaran: ${p.nomorPendaftaran}\nAsal lembaga: ${p.asalLembaga}\nWhatsApp: ${p.whatsapp}\n` +
      `Karya: ${p.adaKarya ? 'sudah dilampirkan' : 'belum dilampirkan'}`
  );
}

export function notifKaryaDikirim(p: {
  nama: string;
  cabangId: string;
  nomorPendaftaran: string;
  jenis: 'berkas' | 'link';
  mengganti: boolean;
}) {
  return kirimNotifAdmin(
    `*Karya ${p.mengganti ? 'diganti' : 'dikirim'} — ${namaCabang(p.cabangId)}*\n` +
      `Nama: ${p.nama}\nNo. pendaftaran: ${p.nomorPendaftaran}\n` +
      `Bentuk: ${p.jenis === 'link' ? 'link YouTube' : 'berkas unggahan'}`
  );
}

// Peserta bisa memicu puluhan laporan dalam satu kuis; kirim hanya pada
// hitungan tertentu agar WA admin tidak banjir.
const AMBANG_MENCURIGAKAN = new Set([1, 3, 5, 10]);

export function notifMencurigakan(p: { nama: string; nomorPendaftaran: string; jumlah: number; labelTipe: string }) {
  if (!AMBANG_MENCURIGAKAN.has(p.jumlah) && p.jumlah % 10 !== 0) return Promise.resolve();
  return kirimNotifAdmin(
    `*Aktivitas mencurigakan — Kuis MQK*\n` +
      `Nama: ${p.nama}\nNo. pendaftaran: ${p.nomorPendaftaran}\n` +
      `Terakhir: ${p.labelTipe}\nTotal tercatat: ${p.jumlah}×`
  );
}

export function notifErrorServer(konteks: string, err: unknown) {
  // Maksimal 5 notifikasi error per 10 menit per instance, supaya gangguan
  // beruntun (mis. database down) tidak membanjiri WA admin.
  if (!rateLimit('notif-error-server', 5, 10 * 60_000).ok) return Promise.resolve();
  const pesan = err instanceof Error ? err.message : String(err);
  return kirimNotifAdmin(`*⚠️ Error server — ${konteks}*\n${pesan.slice(0, 300)}\n\nCek log Vercel untuk detail.`);
}
