import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pendaftarSchema, hitungUsia, MAX_USIA_TIAP_CABANG, buatNomorPendaftaran, buatToken } from '@/lib/validation';
import { saveFile } from '@/lib/storage';
import { rateLimit, ipFromRequest } from '@/lib/rate-limit';
import { LOMBA } from '@/lib/data';
import { kirimKonfirmasiPendaftar } from '@/lib/email';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NOMOR_URUT_KEY = 'pendaftar_nomor_urut';

/**
 * Ambil nomor urut berikutnya secara atomik lewat UPDATE...RETURNING di baris
 * Pengaturan yang sama. Sebelumnya nomor urut diambil dari `pendaftar.count()`,
 * yang race: dua pendaftaran nyaris bersamaan bisa membaca count yang sama dan
 * menghasilkan nomorPendaftaran kembar, lalu gagal dengan error unique
 * constraint saat insert kedua (terlihat di log produksi berulang kali).
 */
async function nomorUrutBerikutnya(): Promise<number> {
  const rows = await prisma.$queryRaw<{ value: string }[]>`
    INSERT INTO "Pengaturan" (key, value, "updatedAt")
    VALUES (${NOMOR_URUT_KEY}, '1', now())
    ON CONFLICT (key) DO UPDATE SET value = (("Pengaturan".value)::int + 1)::text, "updatedAt" = now()
    RETURNING value;
  `;
  return parseInt(rows[0].value, 10) - 1;
}

async function fireAndForgetEmail(nama: string, cabangId: string, p: { nomorPendaftaran: string; tokenCek: string }, base: URL, email?: string | null) {
  if (!email) return;
  try {
    await kirimKonfirmasiPendaftar({
      to: email,
      nama,
      cabang: LOMBA.find((c) => c.id === cabangId)?.name || cabangId,
      nomorPendaftaran: p.nomorPendaftaran,
      tokenCek: p.tokenCek,
      baseUrl: base.origin,
    });
  } catch (err) {
    console.error('Konfirmasi email gagal', err);
  }
}

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`pendaftar:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi beberapa saat.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const form = await req.formData();

    const fileIdentitas = form.get('fileIdentitas');
    const fileSubmisi = form.get('fileSubmisi');

    const parsed = pendaftarSchema.safeParse({
      cabang: form.get('cabang'),
      nama: form.get('nama'),
      tempatLahir: form.get('tempatLahir'),
      tanggalLahir: form.get('tanggalLahir'),
      asalLembaga: form.get('asalLembaga'),
      email: (form.get('email') as string) || '',
      whatsapp: form.get('whatsapp'),
      nomorIdentitas: form.get('nomorIdentitas'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Data tidak valid' },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const cabang = LOMBA.find((c) => c.id === d.cabang);
    if (!cabang) {
      return NextResponse.json({ error: 'Cabang lomba tidak ditemukan' }, { status: 400 });
    }

    const usia = hitungUsia(d.tanggalLahir);
    const batasUsia = MAX_USIA_TIAP_CABANG[d.cabang];
    if (usia > batasUsia) {
      return NextResponse.json(
        { error: `Usia maksimal untuk cabang ini ${batasUsia} tahun.` },
        { status: 400 }
      );
    }

    if (!(fileIdentitas instanceof File) || fileIdentitas.size === 0) {
      return NextResponse.json({ error: 'Kartu tanda pengenal wajib diunggah' }, { status: 400 });
    }

    // --- Anti duplikasi: satu nomor identitas hanya boleh daftar sekali di cabang sama ---
    const sudah = await prisma.pendaftar.findFirst({
      where: { nomorIdentitas: d.nomorIdentitas, cabangId: d.cabang },
    });
    if (sudah) {
      return NextResponse.json(
        { error: 'Nomor identitas ini sudah terdaftar untuk cabang tersebut.' },
        { status: 409 }
      );
    }

    // --- Simpan berkas ---
    let urlIdentitas: string;
    try {
      const saved = await saveFile(fileIdentitas, 'identitas', 'identitas');
      urlIdentitas = saved.url;
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    let urlSubmisi: string | null = null;
    if (fileSubmisi instanceof File && fileSubmisi.size > 0) {
      try {
        const saved = await saveFile(fileSubmisi, 'submisi', 'submisi');
        urlSubmisi = saved.url;
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
    }

    // --- Cek kuota atomik & buat pendaftar ---
    try {
      const count = await prisma.pendaftar.count({ where: { cabangId: d.cabang } });
      if (count >= cabang.kuota) {
        return NextResponse.json(
          { error: `Kuota untuk cabang ini sudah penuh (${cabang.kuota} peserta).` },
          { status: 409 }
        );
      }

      const urutan = await nomorUrutBerikutnya();
      const pendaftar = await prisma.pendaftar.create({
        data: {
          cabangId: d.cabang,
          nama: d.nama,
          tempatLahir: d.tempatLahir,
          tanggalLahir: new Date(d.tanggalLahir),
          usia,
          asalLembaga: d.asalLembaga,
          whatsapp: d.whatsapp,
          email: d.email || null,
          nomorIdentitas: d.nomorIdentitas,
          fileIdentitas: urlIdentitas,
          fileSubmisi: urlSubmisi,
          nomorPendaftaran: buatNomorPendaftaran(urutan, d.cabang),
          tokenCek: buatToken(),
        },
      });

      fireAndForgetEmail(d.nama, d.cabang, pendaftar, new URL(req.url), d.email);

      return NextResponse.json(
        {
          success: true,
          nomorPendaftaran: pendaftar.nomorPendaftaran,
          tokenCek: pendaftar.tokenCek,
          cabang: cabang.short,
        },
        { status: 201 }
      );
    } catch (e) {
      // hapus berkas bila DB gagal
      console.error('Register DB error', e);
      return NextResponse.json({ error: 'Gagal menyimpan pendaftaran' }, { status: 500 });
    }
  } catch (e) {
    console.error('Register error', e);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
