import { saveFile, terimaUnggahanSubmisi, unggahLangsungTersedia } from '@/lib/storage';
import { normalisasiLinkYoutube } from '@/lib/validation';
import { BATAS_SUBMISI } from '@/lib/data';

/**
 * Penerimaan berkas submisi di server, dipakai bersama oleh /api/pendaftar
 * (saat mendaftar) dan /api/pendaftar/submisi (menyusulkan/mengganti dari
 * Dashboard Peserta). Pasangannya di klien: src/lib/unggah-submisi-klien.ts.
 * Semua fungsi di sini melempar Error dengan pesan yang aman ditampilkan ke peserta.
 */

/** Link YouTube hanya diterima untuk cabang berbasis video (khitobah). */
export function validasiLinkSubmisi(form: FormData, cabangId: string): string | null {
  const mentah = String(form.get('linkSubmisi') || '').trim();
  if (!mentah || cabangId !== 'khitobah') return null;
  const link = normalisasiLinkYoutube(mentah);
  if (!link) throw new Error('Link video harus berupa link YouTube (youtube.com atau youtu.be).');
  return link;
}

/**
 * Simpan berkas submisi dari form: kunci objek R2 hasil unggah langsung
 * (`submisiKey`), atau berkas kecil yang ikut form (`fileSubmisi`, mode non-R2).
 * Mengembalikan url untuk kolom fileSubmisi, atau null bila tidak ada berkas.
 */
export async function simpanBerkasSubmisi(form: FormData): Promise<string | null> {
  const submisiKey = String(form.get('submisiKey') || '').trim();
  if (submisiKey && unggahLangsungTersedia()) {
    return terimaUnggahanSubmisi(submisiKey);
  }
  const file = form.get('fileSubmisi');
  if (file instanceof File && file.size > 0) {
    return (await saveFile(file, 'submisi', 'submisi')).url;
  }
  return null;
}

/** Apakah cabang ini menerima submisi dan batas akhirnya belum lewat. */
export function submisiMasihDibuka(cabangId: string, now = Date.now()): boolean {
  const batas = BATAS_SUBMISI[cabangId];
  return Boolean(batas) && now <= new Date(batas).getTime();
}
