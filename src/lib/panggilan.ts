import { prisma } from '@/lib/prisma';
import type { Pendaftar } from '@prisma/client';

export const RUANG_PANGGILAN = ['mtq', 'mqk-babak2'] as const;
export type RuangPanggilan = (typeof RUANG_PANGGILAN)[number];

export function isRuangPanggilan(v: string): v is RuangPanggilan {
  return (RUANG_PANGGILAN as readonly string[]).includes(v);
}

export const LABEL_RUANG_PANGGILAN: Record<RuangPanggilan, string> = {
  mtq: 'Sidang MTQ — Musabaqoh Tilawatil Qur’an',
  'mqk-babak2': 'Sidang MQK Babak II',
};

// Nama room Jitsi (meet.jit.si) — satu room bersama per ruang (lihat PanggilanClient),
// bukan per-peserta. Akhiran acak murni supaya orang asing tidak kebetulan menebak nama
// room umum dan nyasar masuk; ini bukan kredensial rahasia (nama room hanya pernah
// dikembalikan lewat API yang sudah memverifikasi identitas/kelayakan pemanggilnya), jadi
// moderator (panitia) tetap disarankan mengaktifkan fitur "Ruang tunggu" bawaan Jitsi saat
// membuka sidang untuk lapisan proteksi tambahan.
const NAMA_ROOM: Record<RuangPanggilan, string> = {
  mtq: 'MiladSidogiri290-SidangMTQ-2679cc43940c48fa',
  'mqk-babak2': 'MiladSidogiri290-SidangMQKBabak2-c00095dc826c7885',
};

export function namaRoomJitsi(ruang: RuangPanggilan): string {
  return NAMA_ROOM[ruang];
}

function kunciPengaturan(ruang: RuangPanggilan): string {
  return `panggilan_${ruang}_status`;
}

export async function ruangDibuka(ruang: RuangPanggilan): Promise<boolean> {
  const setting = await prisma.pengaturan.findUnique({ where: { key: kunciPengaturan(ruang) } });
  return setting?.value === 'dibuka';
}

export async function setRuangStatus(ruang: RuangPanggilan, dibuka: boolean): Promise<void> {
  const key = kunciPengaturan(ruang);
  const value = dibuka ? 'dibuka' : 'tertutup';
  await prisma.pengaturan.upsert({ where: { key }, update: { value }, create: { key, value } });
}

const STATUS_DIBLOKIR = new Set(['MENUNGGU_VERIFIKASI', 'DITOLAK', 'GUGUR_PENYISIHAN']);

/**
 * Siapa yang berhak masuk ruang panggilan:
 * - mtq: seluruh peserta cabang MTQ yang sudah terverifikasi (MTQ tidak punya babak
 *   penyisihan online terpisah — sidang video INI penyisihannya).
 * - mqk-babak2: hanya peserta MQK yang sudah lolos Babak I (kuis online), yaitu status
 *   LOLOS_PENYISIHAN atau tahap setelahnya. Peserta yang masih TERVERIFIKASI berarti
 *   Babak I belum diproses panitia, dan yang GUGUR_PENYISIHAN tidak lolos.
 */
export function eligibleUntukRuang(ruang: RuangPanggilan, pendaftar: Pendaftar): boolean {
  if (STATUS_DIBLOKIR.has(pendaftar.status)) return false;
  if (ruang === 'mtq') return pendaftar.cabangId === 'mtq';
  return pendaftar.cabangId === 'mqk' && pendaftar.status !== 'TERVERIFIKASI';
}
