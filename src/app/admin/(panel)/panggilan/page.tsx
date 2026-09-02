import { prisma } from '@/lib/prisma';
import RuangPanggilanCard from './RuangPanggilanCard';

export const dynamic = 'force-dynamic';

export default async function AdminPanggilanPage() {
  const settings = await prisma.pengaturan.findMany({
    where: { key: { in: ['panggilan_mtq_status', 'panggilan_mqk-babak2_status'] } },
  });
  const statusFor = (key: string) => (settings.find((s) => s.key === key)?.value === 'dibuka' ? 'dibuka' : 'tertutup');

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(28px,3vw,40px)', letterSpacing: '-0.04em', margin: '0 0 8px' }}>
        Sidang Video (Jitsi Meet)
      </h1>
      <p style={{ fontSize: 14, color: '#5a554c', margin: '0 0 22px', maxWidth: '70ch' }}>
        Ruang video call gratis (Jitsi Meet) untuk sesi juri menilai langsung. Peserta yang lolos syarat
        masuk lewat satu ruang bersama per cabang, lalu dipanggil satu-satu oleh juri. Buka ruang saat
        sesi akan dimulai, dan tutup kembali setelah selesai. Disarankan mengaktifkan fitur &quot;Lobby&quot;
        (ruang tunggu) bawaan Jitsi begitu masuk sebagai panitia, untuk mencegah orang di luar peserta ikut masuk.
      </p>

      <div style={{ display: 'grid', gap: 16 }}>
        <RuangPanggilanCard
          ruang="mtq"
          judul="MTQ — Musabaqoh Tilawatil Qur'an"
          keterangan="Seluruh peserta MTQ terverifikasi bisa masuk ruang ini — sidang video INI penyisihannya, tidak ada babak online sebelumnya."
          statusAwal={statusFor('panggilan_mtq_status')}
        />
        <RuangPanggilanCard
          ruang="mqk-babak2"
          judul="MQK — Babak II"
          keterangan="Hanya peserta MQK yang sudah diproses lolos Babak I (status Lolos Penyisihan) yang bisa masuk ruang ini."
          statusAwal={statusFor('panggilan_mqk-babak2_status')}
        />
      </div>
    </div>
  );
}
