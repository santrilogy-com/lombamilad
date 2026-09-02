import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, ipFromRequest } from '@/lib/rate-limit';
import { LOMBA } from '@/lib/data';
import { kirimLupaStatus } from '@/lib/email';

export const runtime = 'nodejs';

/**
 * Pemulihan nomor pendaftaran + token bagi peserta yang lupa, memakai
 * kombinasi nomor identitas + nomor WhatsApp yang dipakai saat mendaftar
 * (satu identitas bisa terdaftar di lebih dari satu cabang).
 */
export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`lupa-status:${ip}`, 5, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Terlalu banyak percobaan. Coba lagi beberapa saat.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const nomorIdentitas = (body?.nomorIdentitas || '').trim();
  const whatsapp = (body?.whatsapp || '').trim();

  if (!nomorIdentitas || !whatsapp) {
    return NextResponse.json(
      { error: 'Nomor identitas dan nomor WhatsApp wajib diisi.' },
      { status: 400 }
    );
  }

  const found = await prisma.pendaftar.findMany({
    where: { nomorIdentitas, whatsapp },
    orderBy: { createdAt: 'asc' },
  });

  if (found.length === 0) {
    return NextResponse.json(
      {
        error:
          'Data tidak ditemukan. Pastikan nomor identitas dan nomor WhatsApp sama persis seperti saat mendaftar, atau hubungi narahubung panitia.',
      },
      { status: 404 }
    );
  }

  const hasil = found.map((p) => ({
    nomorPendaftaran: p.nomorPendaftaran,
    tokenCek: p.tokenCek,
    cabang: LOMBA.find((c) => c.id === p.cabangId)?.name || p.cabangId,
  }));

  if (found[0].email) {
    // Di-await (bukan fire-and-forget) karena fungsi serverless bisa langsung dibekukan
    // begitu response dikirim — kalau tidak ditunggu, pengiriman SMTP di background
    // berisiko terpotong sebelum selesai dan emailnya batal terkirim tanpa ada error yang
    // terlihat sama sekali. kirimLupaStatus tetap tidak pernah melempar (lihat sendEmail
    // di src/lib/email.ts), jadi ini tidak menggagalkan response bila SMTP gagal/lambat.
    await kirimLupaStatus({ to: found[0].email, nama: found[0].nama, daftar: hasil });
  }

  return NextResponse.json({ hasil });
}
