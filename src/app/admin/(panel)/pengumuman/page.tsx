import { prisma } from '@/lib/prisma';
import { LOMBA } from '@/lib/data';
import PengumumanAdmin from './PengumumanAdmin';
import BroadcastWa from './BroadcastWa';
import { PageHeader } from '../../ui';

export const dynamic = 'force-dynamic';

export default async function AdminPengumumanPage() {
  const [list, pendaftar] = await Promise.all([
    prisma.pengumuman.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.pendaftar.findMany({
      select: { id: true, nama: true, email: true, whatsapp: true, cabangId: true, status: true },
      orderBy: { nama: 'asc' },
    }),
  ]);

  const serialized = list.map((p) => ({
    id: p.id,
    judul: p.judul,
    isi: p.isi,
    tipe: p.tipe,
    published: p.published,
    createdAt: p.createdAt.toISOString(),
  }));

  const peserta = pendaftar.map((p) => ({
    id: p.id,
    nama: p.nama,
    email: p.email,
    whatsapp: p.whatsapp,
    cabangId: p.cabangId,
    cabangShort: LOMBA.find((c) => c.id === p.cabangId)?.short || p.cabangId,
    status: p.status,
  }));

  return (
    <div>
      <PageHeader title="Pengumuman" description="Kelola pengumuman resmi yang tampil di halaman Seleksi & Penyisihan." />
      <PengumumanAdmin list={serialized} />

      <div style={{ marginTop: 40 }}>
        <BroadcastWa peserta={peserta} pengumuman={serialized} />
      </div>
    </div>
  );
}