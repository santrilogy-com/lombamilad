import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, ipFromRequest } from '@/lib/rate-limit';
import { isRuangPanggilan, eligibleUntukRuang, ruangDibuka, namaRoomJitsi } from '@/lib/panggilan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`panggilan-masuk:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi sesaat lagi.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const ruangMentah = String(body.ruang || '');
  const nomor = String(body.nomor || '').trim().toUpperCase();
  const token = String(body.token || '').trim();

  if (!isRuangPanggilan(ruangMentah)) {
    return NextResponse.json({ error: 'Ruang tidak dikenali.' }, { status: 400 });
  }
  if (!nomor || !token) {
    return NextResponse.json({ error: 'Nomor pendaftaran dan token wajib diisi.' }, { status: 400 });
  }

  const pendaftar = await prisma.pendaftar.findUnique({ where: { nomorPendaftaran: nomor } });
  if (!pendaftar || pendaftar.tokenCek !== token) {
    return NextResponse.json({ error: 'Nomor pendaftaran atau token tidak cocok.' }, { status: 404 });
  }

  if (!eligibleUntukRuang(ruangMentah, pendaftar)) {
    return NextResponse.json(
      { error: 'Anda belum memenuhi syarat untuk mengikuti sesi ini. Hubungi panitia bila menurut Anda ini keliru.' },
      { status: 403 }
    );
  }

  if (!(await ruangDibuka(ruangMentah))) {
    return NextResponse.json({ error: 'Ruang sidang belum dibuka panitia. Coba lagi beberapa saat lagi.' }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    roomName: namaRoomJitsi(ruangMentah),
    displayName: pendaftar.nama,
  });
}
