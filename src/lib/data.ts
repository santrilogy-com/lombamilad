export type Cabang = {
  id: string;
  name: string;
  short: string;
  kicker: string;
  deadlineTag: string;
  intro: string;
  sections: { h: string; items: string[] }[];
  prizes: { juara: string; hadiah: string }[];
  p: [string, string, string];
  kuota: number;
};

export const LOMBA: Cabang[] = [
  {
    id: 'puisi',
    name: 'Sayembara Cipta Puisi Berbahasa Indonesia',
    short: 'Cipta Puisi Indonesia',
    kicker: 'Terbuka untuk umum',
    deadlineTag: 'Batas naskah: 9 November 2026',
    intro:
      'Sayembara ini terbuka untuk umum, kecuali santri aktif Pondok Pesantren Sidogiri. Setiap peserta mengirimkan satu naskah puisi bertema "Satu Arah dalam Bermanhaj dan Bermadzhab".',
    sections: [
      {
        h: 'Peserta',
        items: [
          'Terbuka untuk umum, kecuali santri aktif Pondok Pesantren Sidogiri.',
          'Panitia Milad ke-290 dan Ikhtibar ke-91 tidak diperkenankan mengikuti sayembara.',
          'Peserta dibatasi maksimal 100 orang. Pendaftaran ditutup setelah kuota terpenuhi.',
        ],
      },
      {
        h: 'Sudut pandang tema',
        items: [
          'Harmoni Perbedaan Madzhab dalam Bingkai Ukhuwah Islamiyah',
          'Meneguhkan Manhaj Ulama sebagai Pedoman Kehidupan',
          'Peran Santri dalam Merawat Warisan Ulama dan Menjaga Persatuan Umat',
          'Meneguhkan Arah Keilmuan dalam Bingkai Madzhab Ulama',
        ],
      },
      {
        h: 'Format & ketentuan',
        items: [
          'Kertas A4, font Times New Roman 12 pt, spasi 1,5, margin normal.',
          'Karya asli — bukan plagiasi, saduran, maupun karya AI.',
          'Tidak sedang diikutsertakan dalam sayembara lain dan belum pernah dipublikasikan.',
          'Seluruh naskah menjadi hak intelektual panitia untuk kepentingan publikasi Milad ke-290.',
        ],
      },
      {
        h: 'Mekanisme & penilaian',
        items: [
          'Naskah dikirim melalui website miladsidogiri.id, disertai scan identitas dan nomor WhatsApp aktif.',
          'Periode pengumpulan sampai Senin, 29 Jumadal Ula 1448 H. | 9 November 2026 M.',
          'Penilaian: kesesuaian tema, kekuatan diksi dan gaya bahasa, kedalaman makna, koherensi antarbait.',
          'Sesuai standar redaksional Sidogiri dan nilai-nilai Ahlussunnah wal Jamaah.',
        ],
      },
    ],
    prizes: [
      { juara: 'Juara I', hadiah: 'Rp 1.500.000,- + Medali + Trofi + Sertifikat' },
      { juara: 'Juara II', hadiah: 'Rp 1.000.000,- + Medali + Trofi + Sertifikat' },
      { juara: 'Juara III', hadiah: 'Rp 500.000,- + Medali + Trofi + Sertifikat' },
    ],
    p: ['Rp 1.500.000', 'Rp 1.000.000', 'Rp 500.000'],
    kuota: 100,
  },
  {
    id: 'khitobah',
    name: 'Lomba Khitobah',
    short: 'Khitobah Bahasa Arab',
    kicker: 'Delegasi resmi lembaga',
    deadlineTag: 'Batas kirim: 28 Oktober 2026',
    intro:
      'Khitobah berbahasa Arab fuṣḥā untuk utusan resmi pesantren atau lembaga pendidikan. Penyisihan daring melalui pengiriman video, final luring di Pondok Pesantren Sidogiri.',
    sections: [
      {
        h: 'Persyaratan peserta',
        items: [
          'Utusan resmi pesantren atau lembaga pendidikan, satu delegasi per lembaga.',
          'Khusus laki-laki dengan batas usia maksimal 23 tahun.',
          'Wajib menunjukkan tanda pengenal (KTP, KTM, atau identitas resmi lainnya).',
          'Wajib mengikuti Technical Meeting; bila berhalangan wajib konfirmasi kepada penanggung jawab.',
          'Peserta dibatasi maksimal 100 orang.',
        ],
      },
      {
        h: 'Subtema pilihan',
        items: [
          'Bermadzhab dengan Ilmu, Bermanhaj dengan Istiqamah.',
          'Satu Arah dalam Manhaj dan Madzhab: Meneguhkan Identitas, Memperkokoh Persatuan.',
          'Satu Manhaj, Satu Madzhab, Kokoh Menghadapi Tantangan Zaman.',
        ],
      },
      {
        h: 'Tahap penyisihan (daring)',
        items: [
          'Naskah dan video dikirim melalui website miladsidogiri.id sampai 28 Oktober 2026.',
          'Video berdurasi maksimal 7 menit; peserta tidak diperkenankan membaca naskah atau menerima bantuan.',
          'Teks wajib berbahasa Arab fuṣḥā dan merupakan karya orisinal peserta.',
          '5 peserta nilai tertinggi lolos ke final luring di Pondok Pesantren Sidogiri.',
        ],
      },
      {
        h: 'Tahap final (luring)',
        items: [
          'Malam Jum’at, 10 Jumadal Tsaniyah 1448 H. | 20 November 2026 M.',
          'Aba-aba lampu: hijau mulai, kuning sisa 1 menit, merah waktu berakhir.',
          'Waktu tampil maksimal 10 menit; kelebihan waktu dikurangi 5 poin per menit.',
          'Menyerahkan 2 rangkap hard file naskah saat registrasi ulang. Format berkas: Khitobah_NamaLengkap_Instansi.',
        ],
      },
    ],
    prizes: [
      { juara: 'Juara I', hadiah: 'Rp 2.000.000,- + Medali + Trofi + Sertifikat' },
      { juara: 'Juara II', hadiah: 'Rp 1.500.000,- + Medali + Trofi + Sertifikat' },
      { juara: 'Juara III', hadiah: 'Rp 1.000.000,- + Medali + Trofi + Sertifikat' },
    ],
    p: ['Rp 2.000.000', 'Rp 1.500.000', 'Rp 1.000.000'],
    kuota: 100,
  },
  {
    id: 'syair',
    name: 'Sayembara Menulis Syair Berbahasa Arab',
    short: 'Menulis Syair Arab',
    kicker: 'Terbuka untuk umum',
    deadlineTag: 'Batas naskah: 28 Oktober 2026',
    intro:
      'Menulis satu karya syair berbahasa Arab, minimal tujuh bait, dengan mencantumkan bahar yang digunakan. Lima nilai tertinggi melaju ke final luring.',
    sections: [
      {
        h: 'Persyaratan peserta',
        items: [
          'Terbuka untuk umum, kecuali santri aktif Pondok Pesantren Sidogiri.',
          'Bukan bagian dari Panitia Milad ke-290 dan Ikhtibar ke-91.',
          'Belum pernah meraih Juara I, II, atau III pada lomba serupa di Milad PPS sebelumnya.',
          'Usia maksimal 23 tahun saat perlombaan. Kuota maksimal 100 orang.',
        ],
      },
      {
        h: 'Subtema pilihan',
        items: [
          'Keteguhan Manhaj dalam Menuntun Langkah Generasi',
          'Manhaj yang Lurus, Madzhab yang Kokoh, Ukhuwah yang Utuh',
          'Keteguhan Manhaj dalam Menghadapi Arus Perubahan Zaman',
          'Persatuan Umat dalam Keindahan Khilafiyah',
        ],
      },
      {
        h: 'Format karya',
        items: [
          'Satu karya syair, diketik minimal 7 bait.',
          'Wajib mencantumkan bahar yang digunakan; Bahar Rajaz tidak diperkenankan.',
          'Karya asli — bukan saduran, terjemahan, atau plagiasi, dan belum pernah dipublikasikan.',
          'Format nama berkas PDF: NamaLengkap_AsalPesantren_JudulSyair.',
        ],
      },
      {
        h: 'Pengiriman & tahapan',
        items: [
          'Naskah dikirim melalui website beserta scan KTP/KTM yang masih berlaku.',
          'Pengiriman sampai Rabu, 17 Jumadal Ula 1448 H. | 28 Oktober 2026 M.',
          '5 peserta nilai tertinggi melaju ke final luring, malam Jum’at 20 November 2026.',
          'Naskah yang dikirim menjadi hak milik panitia. Keputusan dewan juri bersifat final.',
        ],
      },
    ],
    prizes: [
      { juara: 'Juara I', hadiah: 'Rp 3.000.000,- + Medali + Trofi + Sertifikat' },
      { juara: 'Juara II', hadiah: 'Rp 2.000.000,- + Medali + Trofi + Sertifikat' },
      { juara: 'Juara III', hadiah: 'Rp 1.000.000,- + Medali + Trofi + Sertifikat' },
    ],
    p: ['Rp 3.000.000', 'Rp 2.000.000', 'Rp 1.000.000'],
    kuota: 100,
  },
  {
    id: 'mqk',
    name: 'Lomba MQK — Musabaqah Qiraatul Kitab',
    short: 'MQK',
    kicker: 'Hadiah tertinggi',
    deadlineTag: 'Batas pendaftaran: 28 Oktober 2026',
    intro:
      'Musabaqah membaca kitab untuk utusan lembaga maupun pendaftar mandiri. Materi penyisihan Kitab Fathul-Mu’in Bab Ubudiyah; final membaca dari awal hingga akhir kitab.',
    sections: [
      {
        h: 'Persyaratan peserta',
        items: [
          'Utusan resmi pesantren atau lembaga pendidikan, atau pendaftar mandiri; satu peserta per lembaga.',
          'Khusus laki-laki dengan batas usia maksimal 23 tahun.',
          'Wajib menunjukkan tanda pengenal (KTP, KTM, atau identitas resmi lainnya).',
          'Tidak diperkenankan mengikuti lomba bila pernah juara pada kategori yang sama tahun sebelumnya.',
        ],
      },
      {
        h: 'Penyisihan tahap I & II',
        items: [
          'Tahap I daring melalui website: 50 pertanyaan nahwu, fikih, dan sharaf, 15 detik per pertanyaan.',
          'Materi soal Kitab Fathul-Mu’in, Bab Ubudiyah.',
          'Tahap II diikuti 10 peserta terbaik dengan sistem membaca kitab melalui website.',
          'Membaca 5 baris yang ditentukan panitia, lalu menjawab pertanyaan juri. 5 nilai tertinggi ke final.',
        ],
      },
      {
        h: 'Tahap final (luring)',
        items: [
          'Materi bacaan Kitab Fathul-Mu’in dari awal hingga akhir.',
          'Peserta memilih maqru’ melalui undian yang dipandu panelis.',
          'Membaca 7 baris teks, menjelaskan lafaz yang dibaca, dan menjawab 5 pertanyaan (3 ilmu alat, 2 fikih).',
          'Lomba bersifat perorangan; nomor urut ditentukan saat registrasi ulang.',
        ],
      },
      {
        h: 'Kriteria penilaian',
        items: [
          'Ketepatan penerapan kaidah nahwu dan sharaf.',
          'Kecermatan dan kelogisan dalam menjelaskan teks.',
          'Ketepatan dan kelugasan dalam menjawab pertanyaan juri.',
          'Lahjah dan kefasihan dalam pelafalan.',
        ],
      },
    ],
    prizes: [
      { juara: 'Juara I', hadiah: 'Rp 5.000.000,- + Medali + Trofi + Sertifikat' },
      { juara: 'Juara II', hadiah: 'Rp 4.000.000,- + Medali + Trofi + Sertifikat' },
      { juara: 'Juara III', hadiah: 'Rp 3.000.000,- + Medali + Trofi + Sertifikat' },
    ],
    p: ['Rp 5.000.000', 'Rp 4.000.000', 'Rp 3.000.000'],
    kuota: 100,
  },
  {
    id: 'mtq',
    name: 'Lomba MTQ — Musabaqah Tilawatil Qur’an',
    short: 'MTQ',
    kicker: 'Usia maksimal 18 tahun',
    deadlineTag: 'Batas pendaftaran: 28 Oktober 2026',
    intro:
      'Musabaqah tilawah dengan materi Juz 1–30 dan Al-Qur’an Rasm Utsmani. Penyisihan daring melalui Zoom, final luring di Pondok Pesantren Sidogiri.',
    sections: [
      {
        h: 'Persyaratan peserta',
        items: [
          'Utusan resmi pesantren atau lembaga pendidikan, atau pendaftar mandiri; satu peserta per lembaga.',
          'Santri aktif atau siswa yang masih menempuh pendidikan di lembaga bersangkutan.',
          'Khusus laki-laki dengan batas usia maksimal 18 tahun.',
          'Juara MTQ edisi sebelumnya tidak diperkenankan mengikuti lomba tahun ini.',
        ],
      },
      {
        h: 'Teknis penyisihan (Zoom)',
        items: [
          'Tautan Zoom dikirim H-1; Zoom dibuka 30 menit sebelum lomba untuk registrasi dan absensi.',
          'Format identitas Zoom: NomorUrut_Nama_Delegasi/Lembaga.',
          'Wajib menyediakan dua perangkat: perekam wajah dan perekam proses membaca.',
          'Kamera dan mikrofon wajib aktif selama perlombaan.',
        ],
      },
      {
        h: 'Materi & mekanisme',
        items: [
          'Materi bacaan Juz 1–30, maqru’ ditentukan secara acak melalui undian digital.',
          'Wajib menggunakan Al-Qur’an dengan Rasm Utsmani (disediakan panitia pada final).',
          'Membaca 5 baris dari maqru’ dan 1 gharaib; pada final ditambah 5 pertanyaan ilmu tajwid.',
          '5 peserta nilai tertinggi melaju ke final luring, malam Jum’at 20 November 2026.',
        ],
      },
      {
        h: 'Sistem pengurangan nilai',
        items: [
          'Nilai awal setiap peserta 100 poin.',
          'Kesalahan khata’ jali dikurangi 10 poin.',
          'Kesalahan khata’ khafi dikurangi 5 poin.',
          'Kesalahan pengucapan huruf berulang akibat ashlul-khilqah dikurangi 1 poin.',
        ],
      },
    ],
    prizes: [
      { juara: 'Juara I', hadiah: 'Rp 3.000.000,- + Medali + Trofi + Sertifikat' },
      { juara: 'Juara II', hadiah: 'Rp 2.000.000,- + Medali + Trofi + Sertifikat' },
      { juara: 'Juara III', hadiah: 'Rp 1.000.000,- + Medali + Trofi + Sertifikat' },
    ],
    p: ['Rp 3.000.000', 'Rp 2.000.000', 'Rp 1.000.000'],
    kuota: 100,
  },
];

export type TimelineItem = { num: string; title: string; detail: string };
export const TIMELINE: TimelineItem[] = [
  {
    num: '01',
    title: 'Pendaftaran dibuka',
    detail: '15 Rabiul Tsani 1448 H. | 26 September 2026 M.',
  },
  {
    num: '02',
    title: 'Penutupan pendaftaran & naskah',
    detail:
      'Rabu, 17 Jumadal Ula 1448 H. | 28 Oktober 2026 M. Khusus Sayembara Cipta Puisi: Senin, 29 Jumadal Ula 1448 H. | 9 November 2026 M.',
  },
  {
    num: '03',
    title: 'Technical Meeting (Zoom)',
    detail: 'Kamis, 18 Jumadal Ula 1448 H. | 29 Oktober 2026 M.',
  },
  {
    num: '04',
    title: 'Penyisihan',
    detail:
      'Jum’at, 19 Jumadal Ula 1448 H. | 30 Oktober 2026 M. MQK dua tahap: pukul 09.00 WIB dan 13.00 WIB.',
  },
  {
    num: '05',
    title: 'Babak final (luring)',
    detail:
      'Malam Jum’at, 10 Jumadal Tsaniyah 1448 H. | 20 November 2026 M., di Pondok Pesantren Sidogiri.',
  },
  {
    num: '06',
    title: 'Pengumuman kejuaraan',
    detail:
      'Jum’at, 10 Jumadal Tsaniyah 1448 H. | 20 November 2026 M. Diumumkan melalui sidogiri.net dan media sosial resmi.',
  },
];

export type Step = { num: string; title: string; detail: string };
export const STEPS: Step[] = [
  {
    num: '01',
    title: 'Isi formulir pendaftaran',
    detail: 'Pilih cabang lomba, lengkapi data diri, tempat dan tanggal lahir, serta asal lembaga.',
  },
  {
    num: '02',
    title: 'Unggah identitas',
    detail: 'Scan atau fotokopi KTP/KTM/KTS yang masih berlaku dan nomor WhatsApp aktif.',
  },
  {
    num: '03',
    title: 'Kirim naskah atau video penyisihan',
    detail: 'Sesuai format penamaan berkas yang ditentukan tiap cabang lomba.',
  },
  {
    num: '04',
    title: 'Ikuti Technical Meeting',
    detail: 'Daring melalui Zoom, 29 Oktober 2026. Wajib konfirmasi bila berhalangan.',
  },
];

export const PRIZE_SECTION_HEADERS = ['Cabang lomba', 'Juara I', 'Juara II', 'Juara III'];

export const FASILITAS: { title: string; detail: string }[] = [
  { title: 'E-sertifikat keikutsertaan', detail: 'Untuk seluruh peserta yang lolos ke babak final.' },
  { title: 'Souvenir resmi Milad PPS ke-290', detail: 'Souvenir eksklusif panitia untuk finalis.' },
  {
    title: 'Ruang istirahat & MCK',
    detail: 'Akses fasilitas yang memadai selama pelaksanaan final.',
  },
  { title: 'Konsumsi', detail: 'Makanan berat selama rangkaian kegiatan final.' },
];

export const CONTACT_WA = ['081259413665', '085186871745'];
export const WEBSITE = 'miladsidogiri.id';
export const SIDOGIRI_NET = 'sidogiri.net';

export const DEADLINE_MAIN = new Date('2026-10-28T23:59:59+07:00').getTime();

export const STATS = [
  { label: 'Cabang lomba nasional', value: '5' },
  { label: 'Kuota peserta per lomba', value: '100' },
  { label: 'Total hadiah', value: 'Rp 31,5 Jt' },
  { label: 'Final & pengumuman', value: '20 Nov 2026' },
];
