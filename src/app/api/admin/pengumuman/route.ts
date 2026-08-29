import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const judul = (body.judul || '').trim();
  const isi = (body.isi || '').trim();
  const tipe = body.tipe || 'umum';
  const published = !!body.published;

  if (!judul || !isi) {
    return NextResponse.json({ error: 'Judul dan isi wajib diisi' }, { status: 400 });
  }

  const p = await prisma.pengumuman.create({ data: { judul, isi, tipe, published } });
  return NextResponse.json({ success: true, pengumuman: p }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id, published, judul, isi, tipe } = body;
  if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (published !== undefined) data.published = published;
  if (judul) data.judul = judul;
  if (isi) data.isi = isi;
  if (tipe) data.tipe = tipe;

  const p = await prisma.pengumuman.update({ where: { id }, data });
  return NextResponse.json({ success: true, pengumuman: p });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });

  await prisma.pengumuman.delete({ where: { id } });
  return NextResponse.json({ success: true });
}