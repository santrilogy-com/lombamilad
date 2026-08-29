import { z } from 'zod';

export const MAX_USIA_TIAP_CABANG: Record<string, number> = {
  puisi: 100,
  khitobah: 23,
  syair: 23,
  mqk: 23,
  mtq: 18,
};

export function hitungUsia(tanggalLahir: string | Date): number {
  const born = new Date(tanggalLahir);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age--;
  return age;
}

export const pendaftarSchema = z.object({
  cabang: z.enum(['puisi', 'khitobah', 'syair', 'mqk', 'mtq']),
  nama: z.string().trim().min(3, 'Nama minimal 3 karakter').max(120),
  tempatLahir: z.string().trim().min(2).max(120),
  tanggalLahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  asalLembaga: z.string().trim().min(2).max(200),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Format email tidak valid'),
  whatsapp: z
    .string()
    .trim()
    .regex(/^(08|62|8)[0-9]{8,14}$/, 'Format nomor WhatsApp tidak valid'),
  nomorIdentitas: z.string().trim().min(4).max(60),
});

export function buatNomorPendaftaran(urutan: number, cabang: string): string {
  const seq = String(urutan + 1).padStart(4, '0');
  return `MS290-${cabang.toUpperCase()}-${seq}`;
}

export function buatToken(): string {
  // 8 karakter alfanumerik aman (tanpa karakter ambigu)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
