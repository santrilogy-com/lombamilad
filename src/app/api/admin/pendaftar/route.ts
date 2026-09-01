import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAKS_PER_PERMINTAAN = 100;

/** Hapus banyak pendaftar sekaligus — dipanggil dari aksi "Hapus terpilih" di tabel admin. */
export async function DELETE(req: Request) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === 'string') : [];
  if (ids.length === 0) return NextResponse.json({ error: 'Tidak ada pendaftar yang dipilih.' }, { status: 400 });
  if (ids.length > MAKS_PER_PERMINTAAN) {
    return NextResponse.json({ error: `Maksimal ${MAKS_PER_PERMINTAAN} pendaftar per permintaan.` }, { status: 400 });
  }

  const target = await prisma.pendaftar.findMany({ where: { id: { in: ids } } });

  await prisma.$transaction([
    prisma.nilai.deleteMany({ where: { pendaftarId: { in: ids } } }),
    prisma.kuisAttempt.deleteMany({ where: { pendaftarId: { in: ids } } }),
    prisma.pendaftar.deleteMany({ where: { id: { in: ids } } }),
  ]);

  await Promise.all(
    target
      .flatMap((p) => [p.fileIdentitas, p.fileSubmisi])
      .filter((u): u is string => !!u)
      .map((u) => deleteFile(u).catch(() => {}))
  );

  return NextResponse.json({ success: true, dihapus: target.length });
}
