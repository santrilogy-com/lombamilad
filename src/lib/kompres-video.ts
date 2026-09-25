import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  Quality,
  canEncodeVideo,
} from 'mediabunny';

/**
 * Kompres video submisi di browser peserta sebelum diunggah (hanya dipakai di
 * klien, di-import dinamis dari halaman daftar).
 *
 * Video HP 1080p berukuran ±60–130MB per menit, jadi video khitobah 7 menit
 * bisa ratusan MB — boros kuota R2 dan rawan gagal diunggah lewat sinyal HP.
 * Di sini video diubah ke H.264 maks. 720p ±1,5Mbps (±80MB untuk 7 menit)
 * memakai encoder hardware peramban (WebCodecs). Audio disalin apa adanya,
 * tanpa encode ulang, supaya suara khitobah tidak turun kualitasnya.
 *
 * Mengembalikan null bila peramban tidak mendukung atau kompresi gagal/tidak
 * menghemat — pemanggil lalu memakai berkas aslinya.
 */
const SISI_PENDEK_MAKS = 720;
const BITRATE_VIDEO = 1_500_000;

export async function kompresVideo(file: File, onProgress: (persen: number) => void): Promise<File | null> {
  if (typeof VideoEncoder === 'undefined') return null;
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) return null;

    const w = track.displayWidth;
    const h = track.displayHeight;
    const potrait = h >= w;
    const sisiPendek = Math.min(w, h);
    // Encoder H.264 butuh dimensi genap.
    const genap = (n: number) => Math.round(n / 2) * 2;
    const target = genap(Math.min(SISI_PENDEK_MAKS, sisiPendek));
    const sisiPanjang = genap((Math.max(w, h) / sisiPendek) * target);
    const ukuran = potrait ? { width: target, height: sisiPanjang } : { width: sisiPanjang, height: target };
    const quality = new Quality({ bitrate: BITRATE_VIDEO });
    if (!(await canEncodeVideo('avc', { ...ukuran, quality }))) return null;

    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
      target: new BufferTarget(),
    });
    const conversion = await Conversion.init({
      input,
      output,
      tracks: 'primary',
      video: { ...ukuran, fit: 'contain', codec: 'avc', quality, frameRate: 30 },
      showWarnings: false,
    });
    // Jangan pernah kirim video tanpa suara: bila trek audio terbuang (codec
    // tidak didukung wadah MP4), batalkan dan pakai berkas asli.
    if (!conversion.isValid || conversion.discardedTracks.length > 0) return null;

    conversion.onProgress = (p) => onProgress(Math.round(p * 100));
    await conversion.execute();

    const buffer = output.target.buffer;
    if (!buffer || buffer.byteLength >= file.size) return null;
    const nama = file.name.replace(/\.[^.]+$/, '') + '.mp4';
    return new File([buffer], nama, { type: 'video/mp4' });
  } catch (err) {
    console.error('Kompres video gagal, memakai berkas asli', err);
    return null;
  } finally {
    input.dispose();
  }
}
