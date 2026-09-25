import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, ipFromRequest } from '@/lib/rate-limit';
import { deleteFile } from '@/lib/storage';
import { notifErrorServer, notifKaryaDikirim } from '@/lib/notif-admin';
import { simpanBerkasSubmisi, submisiMasihDibuka, validasiLinkSubmisi } from '@/lib/submisi';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Submisi hanya boleh disusulkan/diganti selama penyisihan belum diproses.
const STATUS_BOLEH_KIRIM = ['MENUNGGU_VERIFIKASI', 'TERVERIFIKASI'];

/**
 * Menyusulkan atau mengganti berkas submisi dari Dashboard Peserta
 * (/cek-status), sampai batas akhir cabang (BATAS_SUBMISI di src/lib/data.ts).
 * Autentikasi: nomor pendaftaran + token, sama seperti /api/cek-status.
 */
export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`submisi:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi beberapa saat.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const form = await req.formData();
    const nomor = String(form.get('nomor') || '').trim().toUpperCase();
    const token = String(form.get('token') || '').trim();

    const p = await prisma.pendaftar.findUnique({ where: { nomorPendaftaran: nomor } });
    if (!p || !token || p.tokenCek !== token) {
      return NextResponse.json({ error: 'Nomor pendaftaran atau token tidak cocok.' }, { status: 404 });
    }
    if (!submisiMasihDibuka(p.cabangId)) {
      return NextResponse.json({ error: 'Batas akhir pengiriman karya untuk cabang ini sudah lewat.' }, { status: 403 });
    }
    if (!STATUS_BOLEH_KIRIM.includes(p.status)) {
      return NextResponse.json({ error: 'Submisi tidak bisa diubah pada status pendaftaran Anda saat ini.' }, { status: 403 });
    }

    let linkSubmisi: string | null;
    let urlSubmisi: string | null;
    try {
      linkSubmisi = validasiLinkSubmisi(form, p.cabangId);
      urlSubmisi = linkSubmisi ? null : await simpanBerkasSubmisi(form);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    if (!linkSubmisi && !urlSubmisi) {
      return NextResponse.json({ error: 'Pilih berkas karya (atau isi link YouTube) terlebih dahulu.' }, { status: 400 });
    }

    // Kiriman baru menggantikan yang lama sepenuhnya: berkas ATAU link, tidak keduanya.
    await prisma.pendaftar.update({
      where: { id: p.id },
      data: { fileSubmisi: urlSubmisi, linkSubmisi },
    });
    if (p.fileSubmisi && p.fileSubmisi !== urlSubmisi) await deleteFile(p.fileSubmisi);
    await notifKaryaDikirim({
      ...p,
      jenis: linkSubmisi ? 'link' : 'berkas',
      mengganti: Boolean(p.fileSubmisi || p.linkSubmisi),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Submisi error', e);
    await notifErrorServer('kirim karya', e);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
