import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_JAWABAN = ['A', 'B', 'C', 'D'];

// Format per baris: Soal|PilihanA|PilihanB|PilihanC|PilihanD|Jawaban|Kategori(opsional)
export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const teks = String(body.teks || '');
  const baris = teks.split('\n').map((l) => l.trim()).filter(Boolean);

  if (baris.length === 0) {
    return NextResponse.json({ error: 'Tidak ada baris untuk diimpor.' }, { status: 400 });
  }

  const existingCount = await prisma.soalKuis.count({ where: { cabangId: 'mqk' } });

  const dataValid: {
    cabangId: string;
    soal: string;
    pilihanA: string;
    pilihanB: string;
    pilihanC: string;
    pilihanD: string;
    jawaban: string;
    kategori: string | null;
    urutan: number;
  }[] = [];
  const gagal: { baris: number; alasan: string }[] = [];

  baris.forEach((line, idx) => {
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < 6) {
      gagal.push({ baris: idx + 1, alasan: 'Kolom kurang dari 6 (Soal|A|B|C|D|Jawaban).' });
      return;
    }
    const [soal, pilihanA, pilihanB, pilihanC, pilihanD, jawabanRaw, kategori] = parts;
    if (![soal, pilihanA, pilihanB, pilihanC, pilihanD].every(Boolean)) {
      gagal.push({ baris: idx + 1, alasan: 'Ada kolom soal/pilihan yang kosong.' });
      return;
    }
    const jawaban = jawabanRaw.toUpperCase();
    if (!VALID_JAWABAN.includes(jawaban)) {
      gagal.push({ baris: idx + 1, alasan: `Jawaban "${jawabanRaw}" tidak valid (harus A/B/C/D).` });
      return;
    }
    dataValid.push({
      cabangId: 'mqk',
      soal,
      pilihanA,
      pilihanB,
      pilihanC,
      pilihanD,
      jawaban,
      kategori: kategori || null,
      urutan: existingCount + dataValid.length,
    });
  });

  if (dataValid.length > 0) {
    await prisma.soalKuis.createMany({ data: dataValid });
  }

  return NextResponse.json({ berhasil: dataValid.length, gagal });
}
