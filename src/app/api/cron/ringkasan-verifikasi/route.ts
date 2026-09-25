import { NextResponse } from 'next/server';
import { notifRingkasanBelumVerifikasi } from '@/lib/notif-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Dipanggil Vercel Cron tiap hari pukul 07.00 WIB (lihat vercel.json). Vercel
 * menyertakan header `Authorization: Bearer $CRON_SECRET`; permintaan tanpa
 * secret yang cocok ditolak. `?paksa=1` mengirim walau tidak ada yang menunggu
 * (untuk uji coba).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const paksa = new URL(req.url).searchParams.get('paksa') === '1';
  const jumlah = await notifRingkasanBelumVerifikasi({ paksa });
  return NextResponse.json({ ok: true, menungguVerifikasi: jumlah });
}
