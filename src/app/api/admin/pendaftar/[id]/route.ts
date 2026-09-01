import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STATUS = [
  'MENUNGGU_VERIFIKASI',
  'TERVERIFIKASI',
  'DITOLAK',
  'LOLOS_PENYISIHAN',
  'GUGUR_PENYISIHAN',
  'LOLOS_FINAL',
  'JUARA_1',
  'JUARA_2',
  'JUARA_3',
];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = params;
  const body = await req.json().catch(() => ({}));

  const pendaftar = await prisma.pendaftar.findUnique({ where: { id } });
  if (!pendaftar) return NextResponse.json({ error: 'Pendaftar tidak ditemukan' }, { status: 404 });

  const patch: Record<string, any> = {};

  if (body.status) {
    if (!VALID_STATUS.includes(body.status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (body.verifikasiCatatan !== undefined) {
    patch.verifikasiCatatan = body.verifikasiCatatan || null;
  }

  // Update / buat record penilaian
  let nilaiUpdate: any = null;
  if (body.nilaiPenyisihan !== undefined) {
    const v = Number(body.nilaiPenyisihan);
    if (v < 0 || v > 100 || Number.isNaN(v)) {
      return NextResponse.json({ error: 'Nilai penyisihan harus 0–100' }, { status: 400 });
    }
    nilaiUpdate = { ...(nilaiUpdate || {}), nilaiPenyisihan: v };
  }
  if (body.nilaiBabak2 !== undefined) {
    const v = Number(body.nilaiBabak2);
    if (v < 0 || v > 100 || Number.isNaN(v)) {
      return NextResponse.json({ error: 'Nilai Babak II harus 0–100' }, { status: 400 });
    }
    nilaiUpdate = { ...(nilaiUpdate || {}), nilaiBabak2: v };
  }
  if (body.nilaiFinal !== undefined) {
    const v = Number(body.nilaiFinal);
    if (v < 0 || v > 100 || Number.isNaN(v)) {
      return NextResponse.json({ error: 'Nilai final harus 0–100' }, { status: 400 });
    }
    nilaiUpdate = { ...(nilaiUpdate || {}), nilaiFinal: v };
  }
  if (body.peringkatPenyisihan !== undefined) {
    nilaiUpdate = { ...(nilaiUpdate || {}), peringkatPenyisihan: body.peringkatPenyisihan ? Number(body.peringkatPenyisihan) : null };
  }
  if (body.peringkatBabak2 !== undefined) {
    nilaiUpdate = { ...(nilaiUpdate || {}), peringkatBabak2: body.peringkatBabak2 ? Number(body.peringkatBabak2) : null };
  }
  if (body.peringkatFinal !== undefined) {
    nilaiUpdate = { ...(nilaiUpdate || {}), peringkatFinal: body.peringkatFinal ? Number(body.peringkatFinal) : null };
  }
  if (body.catatan !== undefined) {
    nilaiUpdate = { ...(nilaiUpdate || {}), catatan: body.catatan || null };
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(patch).length > 0) {
      await tx.pendaftar.update({ where: { id }, data: patch });
    }
    if (nilaiUpdate) {
      const existing = await tx.nilai.findUnique({ where: { pendaftarId: id } });
      if (existing) {
        await tx.nilai.update({ where: { pendaftarId: id }, data: nilaiUpdate });
      } else {
        await tx.nilai.create({ data: { pendaftarId: id, ...nilaiUpdate } });
      }
    }
  });

  const updated = await prisma.pendaftar.findUnique({
    where: { id },
    include: { nilai: true },
  });

  return NextResponse.json({ success: true, pendaftar: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = params;
  const pendaftar = await prisma.pendaftar.findUnique({ where: { id } });
  if (!pendaftar) return NextResponse.json({ error: 'Pendaftar tidak ditemukan' }, { status: 404 });

  // Hapus baris anak dulu (Nilai/KuisAttempt tidak punya onDelete: Cascade di
  // schema) baru baris Pendaftar-nya, dalam satu transaksi supaya konsisten.
  await prisma.$transaction([
    prisma.nilai.deleteMany({ where: { pendaftarId: id } }),
    prisma.kuisAttempt.deleteMany({ where: { pendaftarId: id } }),
    prisma.pendaftar.delete({ where: { id } }),
  ]);

  // Best-effort: hapus berkas yang diunggah. Kegagalan di sini tidak boleh
  // membuat penghapusan data terlihat gagal — record DB sudah terhapus.
  await Promise.all(
    [pendaftar.fileIdentitas, pendaftar.fileSubmisi]
      .filter((u): u is string => !!u)
      .map((u) => deleteFile(u).catch(() => {}))
  );

  return NextResponse.json({ success: true });
}