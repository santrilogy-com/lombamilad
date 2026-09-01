import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_JAWABAN = ['A', 'B', 'C', 'D'];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = params;
  const existing = await prisma.soalKuis.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Soal tidak ditemukan' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, any> = {};

  for (const field of ['soal', 'pilihanA', 'pilihanB', 'pilihanC', 'pilihanD'] as const) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== 'string' || !body[field].trim()) {
        return NextResponse.json({ error: `Field ${field} tidak boleh kosong.` }, { status: 400 });
      }
      patch[field] = body[field].trim();
    }
  }
  if (body.jawaban !== undefined) {
    const j = String(body.jawaban).trim().toUpperCase();
    if (!VALID_JAWABAN.includes(j)) {
      return NextResponse.json({ error: 'Jawaban harus salah satu dari A/B/C/D.' }, { status: 400 });
    }
    patch.jawaban = j;
  }
  if (body.kategori !== undefined) patch.kategori = body.kategori ? String(body.kategori).trim() : null;
  if (body.urutan !== undefined) patch.urutan = Number.isFinite(Number(body.urutan)) ? Number(body.urutan) : 0;
  if (body.aktif !== undefined) patch.aktif = Boolean(body.aktif);

  const updated = await prisma.soalKuis.update({ where: { id }, data: patch });
  return NextResponse.json({ soal: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = params;
  const existing = await prisma.soalKuis.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Soal tidak ditemukan' }, { status: 404 });

  await prisma.soalKuis.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
