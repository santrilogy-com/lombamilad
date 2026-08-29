import { prisma } from '@/lib/prisma';
import PengumumanAdmin from './PengumumanAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminPengumumanPage() {
  const list = await prisma.pengumuman.findMany({ orderBy: { createdAt: 'desc' } });
  const serialized = list.map((p) => ({
    id: p.id,
    judul: p.judul,
    isi: p.isi,
    tipe: p.tipe,
    published: p.published,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(28px,3vw,40px)', letterSpacing: '-0.04em', margin: '0 0 8px' }}>
        Pengumuman
      </h1>
      <p style={{ fontSize: 14, color: '#5a554c', margin: '0 0 24px' }}>
        Kelola pengumuman resmi yang tampil di halaman Seleksi &amp; Penyisihan.
      </p>
      <PengumumanAdmin list={serialized} />
    </div>
  );
}