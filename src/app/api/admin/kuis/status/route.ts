import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEY = 'kuis_mqk_status';

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const setting = await prisma.pengaturan.findUnique({ where: { key: KEY } });
  return NextResponse.json({ status: setting?.value === 'dibuka' ? 'dibuka' : 'tertutup' });
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const status = body.status === 'dibuka' ? 'dibuka' : 'tertutup';

  await prisma.pengaturan.upsert({
    where: { key: KEY },
    update: { value: status },
    create: { key: KEY, value: status },
  });

  return NextResponse.json({ status });
}
