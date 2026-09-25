import { CONTACT_WA } from '@/lib/data';

/**
 * Alur unggah berkas submisi di browser, dipakai bersama oleh form daftar
 * (/daftar) dan Dashboard Peserta (/cek-status) untuk menyusulkan/mengganti
 * submisi. Hanya untuk kode klien.
 *
 * 1. Video besar dikompres dulu di browser (src/lib/kompres-video.ts).
 * 2. Berkas diunggah langsung ke R2 lewat URL bertanda tangan, melewati batas
 *    body request Vercel (~4.5MB).
 * Bila server tidak mendukung unggah langsung (STORAGE_PROVIDER bukan r2),
 * berkasnya dikembalikan untuk dikirim bersama form seperti biasa.
 */

export const MAX_FILE_MB = 4;
// Harus sama dengan MAX_SUBMISI_LANGSUNG_MB di src/lib/storage.ts.
export const MAX_SUBMISI_MB = 150;
// Video di atas ukuran ini dikompres dulu di browser.
const KOMPRES_DI_ATAS_MB = 20;

export type ProgresSubmisi = { tahap: 'kompres' | 'unggah'; persen: number };
export type HasilSubmisi = { submisiKey: string } | { file: File };

export function labelProgres(progres: ProgresSubmisi) {
  return progres.tahap === 'kompres'
    ? `Mengompres video... ${progres.persen}%`
    : `Mengunggah berkas... ${progres.persen}%`;
}

export async function siapkanSubmisi(
  asli: File,
  onProgres: (p: ProgresSubmisi) => void
): Promise<HasilSubmisi> {
  let berkas = asli;
  const video = berkas.type.startsWith('video/') || /\.(mp4|mov)$/i.test(berkas.name);
  if (video && berkas.size > KOMPRES_DI_ATAS_MB * 1024 * 1024) {
    onProgres({ tahap: 'kompres', persen: 0 });
    const { kompresVideo } = await import('@/lib/kompres-video');
    const hasil = await kompresVideo(berkas, (persen) => onProgres({ tahap: 'kompres', persen }));
    if (hasil) berkas = hasil;
  }
  if (berkas.size > MAX_SUBMISI_MB * 1024 * 1024) {
    throw new Error(
      video
        ? `Video terlalu besar (${Math.round(berkas.size / 1024 / 1024)}MB) dan tidak bisa dikompres otomatis di perangkat ini. Coba kirim dari HP/laptop lain dengan Chrome versi terbaru, kompres videonya terlebih dahulu, atau unggah ke YouTube (setelan "Tidak publik"/unlisted) lalu tempel link-nya.`
        : `Ukuran berkas submisi maksimal ${MAX_SUBMISI_MB}MB. Silakan kompres berkasnya lalu unggah ulang.`
    );
  }
  onProgres({ tahap: 'unggah', persen: 0 });
  const key = await unggahLangsung(berkas, onProgres);
  if (key) return { submisiKey: key };
  if (berkas.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`Ukuran berkas submisi maksimal ${MAX_FILE_MB}MB. Silakan kompres berkasnya lalu unggah ulang.`);
  }
  return { file: berkas };
}

/** Terapkan hasil siapkanSubmisi ke FormData yang akan dikirim ke server. */
export function isiFormSubmisi(fd: FormData, hasil: HasilSubmisi) {
  if ('submisiKey' in hasil) {
    fd.delete('fileSubmisi');
    fd.set('submisiKey', hasil.submisiKey);
  } else {
    fd.set('fileSubmisi', hasil.file);
  }
}

async function unggahLangsung(file: File, onProgres: (p: ProgresSubmisi) => void): Promise<string | null> {
  // Beberapa HP melaporkan file.type kosong untuk .mov/.mp4 — tebak dari ekstensi.
  const ext = file.name.split('.').pop()?.toLowerCase();
  const type = file.type || (ext === 'mov' ? 'video/quicktime' : ext === 'mp4' ? 'video/mp4' : '');
  const res = await fetch('/api/pendaftar/unggah-submisi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, type, size: file.size }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Gagal menyiapkan unggahan berkas submisi.');
  if (!data?.tersedia) return null;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', data.uploadUrl);
    xhr.setRequestHeader('Content-Type', type);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) onProgres({ tahap: 'unggah', persen: Math.round((ev.loaded / ev.total) * 100) });
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error()));
    xhr.onerror = () => reject(new Error());
    xhr.send(file);
  }).catch(() => {
    throw new Error(
      `Gagal mengunggah berkas submisi. Periksa koneksi internet lalu coba lagi, atau hubungi panitia via WhatsApp di ${CONTACT_WA[0]}.`
    );
  });
  return data.key as string;
}

/** Wake Lock agar layar HP tidak mati (dan proses terhenti) selama kompres/unggah. */
export async function jagaLayarMenyala(): Promise<{ release: () => Promise<void> } | null> {
  try {
    return (await navigator.wakeLock?.request('screen')) ?? null;
  } catch {
    return null;
  }
}
