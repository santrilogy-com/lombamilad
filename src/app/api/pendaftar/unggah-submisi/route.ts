import { NextResponse } from 'next/server';
import { rateLimit, ipFromRequest } from '@/lib/rate-limit';
import { buatUrlUnggahSubmisi, unggahLangsungTersedia } from '@/lib/storage';

export const runtime = 'nodejs';

/**
 * Beri URL bertanda tangan agar browser bisa mengunggah berkas submisi (video)
 * langsung ke R2, melewati batas body ~4.5MB di Vercel. Lihat src/lib/storage.ts.
 * Bila provider bukan R2, klien kembali ke jalur lama (berkas ikut form).
 */
export async function POST(req: Request) {
  if (!unggahLangsungTersedia()) {
    return NextResponse.json({ tersedia: false });
  }

  const ip = ipFromRequest(req);
  const rl = rateLimit(`unggah-submisi:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi beberapa saat.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  try {
    const { key, uploadUrl } = await buatUrlUnggahSubmisi(
      String(body.name || ''),
      String(body.type || ''),
      Number(body.size)
    );
    return NextResponse.json({ tersedia: true, key, uploadUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Gagal menyiapkan unggahan' }, { status: 400 });
  }
}
