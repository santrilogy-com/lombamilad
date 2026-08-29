import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id, kuota } = body;
  if (!id || !kuota || kuota < 1) {
    return NextResponse.json({ error: 'Cabang dan kuota wajib diisi' }, { status: 400 });
  }

  const cabang = await prisma.cabang.upsert({
    where: { id },
    update: { kuota: kuota },
    create: { id, nama: id, kuota },
  });
  return NextResponse.json({ success: true, cabang });
}