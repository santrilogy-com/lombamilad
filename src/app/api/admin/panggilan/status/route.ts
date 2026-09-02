import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { isRuangPanggilan, ruangDibuka, setRuangStatus } from '@/lib/panggilan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const ruang = new URL(req.url).searchParams.get('ruang') || '';
  if (!isRuangPanggilan(ruang)) {
    return NextResponse.json({ error: 'Ruang tidak dikenali.' }, { status: 400 });
  }

  return NextResponse.json({ status: (await ruangDibuka(ruang)) ? 'dibuka' : 'tertutup' });
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ruang = String(body.ruang || '');
  if (!isRuangPanggilan(ruang)) {
    return NextResponse.json({ error: 'Ruang tidak dikenali.' }, { status: 400 });
  }
  const dibuka = body.status === 'dibuka';

  await setRuangStatus(ruang, dibuka);
  return NextResponse.json({ status: dibuka ? 'dibuka' : 'tertutup' });
}
