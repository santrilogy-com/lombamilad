/**
 * Notifikasi email via Resend. Aktif hanya bila RESEND_API_KEY dan RESEND_FROM
 * di-set di environment. Gagal diam-diam (non-blocking) agar tidak menghalangi
 * proses pendaftaran.
 */

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || 'Lomba Milad 290 <onboarding@resend.dev>';

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: RESEND_FROM, to: payload.to, subject: payload.subject, html: payload.html }),
    });
  } catch (err) {
    console.error('Email send error:', err);
  }
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
        <p>Assalamu'alaikum <strong>${nama}</strong>, terima kasih telah mendaftar cabang <strong>${cabang}</strong>.</p>
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