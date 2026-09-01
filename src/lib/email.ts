/**
 * Notifikasi email via SMTP (mis. Mailspace — hosting email dari DomaiNesia).
 * Aktif hanya bila SMTP_HOST, SMTP_USER, dan SMTP_PASS di-set di environment.
 * Gagal diam-diam (non-blocking) agar tidak menghalangi proses pendaftaran.
 */

import nodemailer from 'nodemailer';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'Lomba Milad 290 <noreply@miladsidogiri.id>';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // 465 = SSL langsung, 587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

/** Kirim email; melempar error asli bila gagal (dipakai fitur broadcast yang perlu tahu sukses/gagal per penerima). */
export async function kirimEmailAtauLempar(payload: EmailPayload): Promise<{ messageId: string }> {
  const t = getTransporter();
  if (!t) throw new Error('SMTP belum dikonfigurasi di server ini.');
  const info = await t.sendMail({ from: SMTP_FROM, to: payload.to, subject: payload.subject, html: payload.html });
  return { messageId: info.messageId };
}

/** Kirim email, gagal diam-diam (dipakai alur otomatis seperti konfirmasi pendaftaran). */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  try {
    await kirimEmailAtauLempar(payload);
  } catch (err) {
    console.error('Email send error:', err);
  }
}

function bungkusEmail(judulKecil: string, isiHtml: string): string {
  return `
    <div style="font-family:Sora,system-ui,sans-serif;background:#efede7;padding:32px;color:#24211c;">
      <div style="max-width:520px;margin:0 auto;background:#e5e2da;border-radius:6px;padding:36px;">
        <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8a7c4c;font-weight:700;">Milad ke-290 Pondok Pesantren Sidogiri</div>
        <h1 style="font-size:22px;font-weight:600;margin:12px 0 20px;">${judulKecil}</h1>
        ${isiHtml}
      </div>
    </div>`;
}

export async function kirimKonfirmasiPendaftar(opts: {
  to: string;
  nama: string;
  cabang: string;
  nomorPendaftaran: string;
  tokenCek: string;
  baseUrl: string;
}) {
  const { to, nama, cabang, nomorPendaftaran, tokenCek, baseUrl } = opts;
  const cekUrl = `${baseUrl}/cek-status?nomor=${encodeURIComponent(nomorPendaftaran)}&token=${encodeURIComponent(tokenCek)}`;
  const html = `
    <div style="font-family:Sora,system-ui,sans-serif;background:#efede7;padding:32px;color:#24211c;">
      <div style="max-width:520px;margin:0 auto;background:#e5e2da;border-radius:6px;padding:36px;">
        <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8a7c4c;font-weight:700;">Milad ke-290 Pondok Pesantren Sidogiri</div>
        <h1 style="font-size:22px;font-weight:600;margin:12px 0 8px;">Pendaftaran Berhasil</h1>
        <p>Assalamu'alaikum <strong>${escapeHtml(nama)}</strong>, terima kasih telah mendaftar cabang <strong>${escapeHtml(cabang)}</strong>.</p>
        <div style="background:#fff;border-radius:6px;padding:18px 20px;margin:18px 0;">
          <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#7c7b77;">Nomor Pendaftaran</div>
          <div style="font-size:24px;font-weight:600;color:#675c37;">${nomorPendaftaran}</div>
        </div>
        <div style="background:#fff;border-radius:6px;padding:18px 20px;margin:12px 0;">
          <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#7c7b77;">Token Cek Status</div>
          <div style="font-size:20px;font-weight:600;">${tokenCek}</div>
        </div>
        <p style="font-size:14px;line-height:1.6;">Simpan nomor pendaftaran dan token untuk memantau status seleksi Anda.</p>
        <a href="${cekUrl}" style="display:inline-block;background:#24211c;color:#efede7;text-decoration:none;padding:12px 20px;border-radius:4px;font-size:14px;font-weight:600;">Cek Status Sekarang</a>
        <p style="font-size:12px;color:#7c7b77;margin-top:24px;">Pengumuman resmi diumumkan melalui sidogiri.net dan media sosial resmi Pondok Pesantren Sidogiri.</p>
      </div>
    </div>`;
  await sendEmail({ to, subject: `Pendaftaran Diterima — ${nomorPendaftaran}`, html });
}

export async function kirimLupaStatus(opts: {
  to: string;
  nama: string;
  daftar: { nomorPendaftaran: string; tokenCek: string; cabang: string }[];
}) {
  const { to, nama, daftar } = opts;
  const rows = daftar
    .map(
      (d) => `
        <div style="background:#fff;border-radius:6px;padding:16px 18px;margin:10px 0;">
          <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#7c7b77;">${d.cabang}</div>
          <div style="font-size:20px;font-weight:600;color:#675c37;margin-top:4px;">${d.nomorPendaftaran}</div>
          <div style="font-size:14px;color:#24211c;margin-top:4px;">Token: <strong>${d.tokenCek}</strong></div>
        </div>`
    )
    .join('');
  const html = `
    <div style="font-family:Sora,system-ui,sans-serif;background:#efede7;padding:32px;color:#24211c;">
      <div style="max-width:520px;margin:0 auto;background:#e5e2da;border-radius:6px;padding:36px;">
        <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8a7c4c;font-weight:700;">Milad ke-290 Pondok Pesantren Sidogiri</div>
        <h1 style="font-size:22px;font-weight:600;margin:12px 0 8px;">Nomor Pendaftaran &amp; Token Anda</h1>
        <p>Assalamu'alaikum <strong>${escapeHtml(nama)}</strong>, berikut data pendaftaran yang tercatat atas nama Anda:</p>
        ${rows}
        <p style="font-size:13px;color:#7c7b77;margin-top:20px;">Bila Anda tidak meminta ini, abaikan email ini.</p>
      </div>
    </div>`;
  await sendEmail({ to, subject: 'Pemulihan Nomor Pendaftaran & Token', html });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Baris berformat "[Teks Tombol](https://...)" dirender sebagai tombol, bukan paragraf biasa —
// supaya admin bisa menyisipkan mis. link Zoom tanpa perlu menulis HTML.
const POLA_TOMBOL = /^\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)\s*$/;

function renderIsiPengumuman(isi: string): string {
  return isi
    .split('\n')
    .map((line) => {
      if (!line.trim()) return '';
      const cocok = line.match(POLA_TOMBOL);
      if (cocok) {
        const [, label, url] = cocok;
        return `<a href="${escapeHtml(url)}" style="display:inline-block;background:#8a7c4c;color:#fff;text-decoration:none;padding:11px 20px;border-radius:4px;font-size:13.5px;font-weight:600;margin:4px 0 10px;">${escapeHtml(label)}</a>`;
      }
      return `<p style="margin:0 0 10px;font-size:14px;line-height:1.65;">${escapeHtml(line)}</p>`;
    })
    .join('');
}

/**
 * Broadcast pengumuman (jadwal, link Zoom, info umum, dll) ke satu peserta. Melempar error bila gagal.
 * Baris berformat "[Teks Tombol](https://...)" di `isi` otomatis dirender sebagai tombol.
 */
export async function kirimPengumumanEmail(opts: {
  to: string;
  nama: string;
  judul: string;
  isi: string;
  baseUrl: string;
}): Promise<{ messageId: string }> {
  const { to, nama, judul, isi, baseUrl } = opts;
  const isiHtml = renderIsiPengumuman(isi);
  const html = bungkusEmail(
    escapeHtml(judul),
    `
      <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(nama)}</strong>,</p>
      <div style="background:#fff;border-radius:6px;padding:18px 20px;margin:0 0 18px;">${isiHtml}</div>
      <a href="${baseUrl}/cek-status" style="display:inline-block;background:#24211c;color:#efede7;text-decoration:none;padding:12px 20px;border-radius:4px;font-size:14px;font-weight:600;">Buka Dashboard Peserta</a>
      <p style="font-size:12px;color:#7c7b77;margin-top:24px;">Email ini dikirim panitia Lomba Nasional Milad Sidogiri ke-290.</p>
    `
  );
  return kirimEmailAtauLempar({ to, subject: judul, html });
}

const HASIL_LABEL: Record<string, { label: string; nada: 'baik' | 'netral' | 'kurang' }> = {
  TERVERIFIKASI: { label: 'Berkas terverifikasi — terdaftar', nada: 'netral' },
  DITOLAK: { label: 'Berkas ditolak', nada: 'kurang' },
  LOLOS_PENYISIHAN: { label: 'Lolos penyisihan', nada: 'baik' },
  GUGUR_PENYISIHAN: { label: 'Tidak lolos penyisihan', nada: 'kurang' },
  LOLOS_FINAL: { label: 'Lolos ke babak final', nada: 'baik' },
  JUARA_1: { label: 'Juara 1', nada: 'baik' },
  JUARA_2: { label: 'Juara 2', nada: 'baik' },
  JUARA_3: { label: 'Juara 3', nada: 'baik' },
};

/** Kirim hasil/nilai terkini seorang peserta (penyisihan/Babak II/final) ke emailnya. Melempar error bila gagal. */
export async function kirimHasilEmail(opts: {
  to: string;
  nama: string;
  cabang: string;
  nomorPendaftaran: string;
  statusKode: string;
  nilaiPenyisihan?: number | null;
  peringkatPenyisihan?: number | null;
  nilaiBabak2?: number | null;
  peringkatBabak2?: number | null;
  nilaiFinal?: number | null;
  peringkatFinal?: number | null;
  baseUrl: string;
}): Promise<{ messageId: string }> {
  const { to, nama, cabang, nomorPendaftaran, statusKode, baseUrl } = opts;
  const info = HASIL_LABEL[statusKode] || { label: statusKode, nada: 'netral' as const };
  const warna = info.nada === 'baik' ? '#2e7d2e' : info.nada === 'kurang' ? '#a94442' : '#675c37';
  const bgBanner = info.nada === 'baik' ? '#dbeedb' : info.nada === 'kurang' ? '#f4dede' : '#fff';
  const pesanUtama =
    info.nada === 'baik'
      ? 'Selamat! Berikut hasil terbaru Anda di Lomba Nasional Milad Sidogiri ke-290.'
      : info.nada === 'kurang'
        ? 'Berikut hasil terbaru Anda. Terima kasih atas partisipasi dan semangat Anda di Lomba Nasional Milad Sidogiri ke-290.'
        : 'Berikut update status terbaru Anda di Lomba Nasional Milad Sidogiri ke-290.';

  const baris = (label: string, nilai: number | null | undefined, peringkat: number | null | undefined) =>
    nilai === null || nilai === undefined
      ? ''
      : `<div style="background:#fff;border-radius:6px;padding:16px 18px;margin:0 0 10px;">
          <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#7c7b77;">${label}</div>
          <div style="font-size:22px;font-weight:600;color:#675c37;margin-top:4px;">${nilai}${peringkat ? ` <span style="font-size:13px;color:#7c7b77;font-weight:400;">(peringkat ${peringkat})</span>` : ''}</div>
        </div>`;

  const html = bungkusEmail(
    'Update Hasil Seleksi',
    `
      <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(nama)}</strong>, cabang <strong>${escapeHtml(cabang)}</strong> (${escapeHtml(nomorPendaftaran)}).</p>
      <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">${pesanUtama}</p>
      <div style="background:${bgBanner};border-radius:6px;padding:14px 18px;margin:0 0 18px;">
        <span style="font-size:13px;font-weight:700;color:${warna};text-transform:uppercase;letter-spacing:0.06em;">${info.label}</span>
      </div>
      ${baris('Nilai Penyisihan', opts.nilaiPenyisihan, opts.peringkatPenyisihan)}
      ${baris('Nilai Babak II', opts.nilaiBabak2, opts.peringkatBabak2)}
      ${baris('Nilai Final', opts.nilaiFinal, opts.peringkatFinal)}
      <a href="${baseUrl}/cek-status" style="display:inline-block;background:#24211c;color:#efede7;text-decoration:none;padding:12px 20px;border-radius:4px;font-size:14px;font-weight:600;margin-top:8px;">Buka Dashboard Peserta</a>
      <p style="font-size:12px;color:#7c7b77;margin-top:24px;">Keputusan dewan juri bersifat final. Email ini dikirim otomatis oleh panitia.</p>
    `
  );
  return kirimEmailAtauLempar({ to, subject: `Update Hasil Seleksi — ${info.label}`, html });
}