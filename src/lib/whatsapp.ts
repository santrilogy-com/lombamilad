/**
 * Normalisasi nomor WhatsApp Indonesia ke format internasional tanpa "+"
 * (format yang dibutuhkan wa.me), mis. "0812..." atau "812..." -> "62812...".
 */
export function normalisasiNomorWa(nomor: string): string {
  const digits = nomor.replace(/[^0-9]/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return `62${digits}`;
}

export function buatTautanWa(nomor: string, pesan: string): string {
  const target = normalisasiNomorWa(nomor);
  return `https://wa.me/${target}?text=${encodeURIComponent(pesan)}`;
}
