import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { isRuangPanggilan, namaRoomJitsi } from '@/lib/panggilan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Panitia/juri tidak masuk lewat embed di dalam panel admin — cukup dikembalikan nama
// room-nya untuk dibuka langsung di meet.jit.si (tab baru). Beda dari peserta, panitia
// perlu kontrol penuh Jitsi (mute peserta lain, aktifkan ruang tunggu, dsb) yang lebih
// leluasa dipakai di UI Jitsi asli ketimbang lewat IFrame API yang disederhanakan.
export async function GET(req: Request) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const ruang = new URL(req.url).searchParams.get('ruang') || '';
  if (!isRuangPanggilan(ruang)) {
    return NextResponse.json({ error: 'Ruang tidak dikenali.' }, { status: 400 });
  }

  return NextResponse.json({
    roomName: namaRoomJitsi(ruang),
    displayName: session.user?.name || 'Panitia',
  });
}
