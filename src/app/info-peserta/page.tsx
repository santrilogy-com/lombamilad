import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { LOMBA, STEPS, TIMELINE } from '@/lib/data';

export const metadata = { title: 'Informasi untuk Peserta' };

export default function InfoPesertaPage() {
  return (
    <PageShell>
      <main style={{ maxWidth: 1040, margin: '0 auto', padding: 'clamp(48px, 6vw, 88px) clamp(20px, 4vw, 40px)' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--olive)' }}>
            Info Peserta
          </div>
          <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(34px, 4.4vw, 58px)', lineHeight: 1, letterSpacing: '-0.045em', margin: '16px 0 14px' }}>
            Informasi untuk Peserta
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: '#4b4740', maxWidth: '62ch' }}>
            Seluruh informasi teknis pelaksanaan, ketentuan berkas, Technical Meeting, dan kontak
            narahubung untuk peserta Lomba Nasional Milad Sidogiri 290.
          </p>
        </div>

        <Section title="Alur pendaftaran">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {STEPS.map((s) => (
              <div key={s.num} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 10, padding: '18px 0', borderTop: '1px solid var(--line)' }}>
                <span style={{ fontFamily: 'var(--disp)', fontSize: 14, color: 'var(--olive)', fontWeight: 500 }}>{s.num}</span>
                <div>
                  <div style={{ fontFamily: 'var(--disp)', fontWeight: 400, fontSize: 17, letterSpacing: '-0.02em' }}>{s.title}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.55, color: '#5a554c', marginTop: 5 }}>{s.detail}</div>
                </div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--line)' }} />
          </div>
        </Section>

        <Section title="Jadwal penting">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {TIMELINE.map((t) => (
              <div key={t.num} style={{ display: 'grid', gridTemplateColumns: '88px minmax(0,1fr) minmax(0,1.3fr)', gap: 'clamp(14px,3vw,36px)', alignItems: 'start', padding: '22px 0', borderTop: '1px solid var(--line)' }}>
                <div style={{ fontFamily: 'var(--disp)', fontSize: 13, fontWeight: 500, letterSpacing: '0.14em', color: 'var(--olive)' }}>{t.num}</div>
                <div style={{ fontFamily: 'var(--disp)', fontWeight: 500, fontSize: 'clamp(16px,1.5vw,20px)', letterSpacing: '-0.02em' }}>{t.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: '#4b4740' }}>{t.detail}</div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--line)' }} />
          </div>
        </Section>

        {LOMBA.map((c) => (
          <Section key={c.id} title={c.name}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 'clamp(20px,2.4vw,30px)' }}>
              {c.sections.map((sec) => (
                <div key={sec.h} style={{ background: 'var(--paper2)', borderRadius: 3, padding: '22px 22px' }}>
                  <div style={{ fontFamily: 'var(--disp)', fontSize: 13, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink)', paddingBottom: 10, borderBottom: '2px solid var(--olive)' }}>
                    {sec.h}
                  </div>
                  <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {sec.items.map((it, i) => (
                      <li key={i} style={{ fontSize: 13.5, lineHeight: 1.55, color: '#4b4740', paddingLeft: 16, position: 'relative' }}>
                        <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: '0.72em', width: 5, height: 5, borderRadius: '50%', background: 'var(--olive)' }} />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, fontSize: 13, color: 'var(--grey)' }}>
              Hadiah: {c.prizes.map((p) => `${p.juara} ${p.hadiah}`).join(' · ')}
            </div>
          </Section>
        ))}

        <Section title="Format penamaan berkas">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 14 }}>
            {LOMBA.map((c) => (
              <div key={c.id} style={{ background: 'var(--paper2)', borderRadius: 3, padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--olive-d)' }}>{c.short}</div>
                <div style={{ fontSize: 13.5, color: '#3d3931', marginTop: 8, lineHeight: 1.5 }}>
                  {c.id === 'puisi' && 'Puisi_NamaLengkap_Judul'}
                  {c.id === 'khitobah' && 'Khitobah_NamaLengkap_Instansi'}
                  {c.id === 'syair' && 'NamaLengkap_AsalPesantren_JudulSyair'}
                  {c.id === 'mqk' && 'MQK_NamaLengkap (via website)'}
                  {c.id === 'mtq' && 'Format Zoom: NomorUrut_Nama_Delegasi/Lembaga'}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: '#5a554c', lineHeight: 1.6, marginTop: 18 }}>
            Pastikan berkas asli, bukan plagiasi/saduran/karya AI, dan belum pernah dipublikasikan.
            Naskah yang dikirim menjadi hak intelektual panitia untuk kepentingan publikasi Milad ke-290.
          </p>
        </Section>

        <Section title="Pertanyaan umum">
          <Faq q="Apakah panitia boleh mengikuti lomba?" a="Tidak. Panitia Milad ke-290 dan Ikhtibar ke-91 tidak diperkenankan mengikuti sayembara/lomba." />
          <Faq q="Apakah boleh mendaftar di lebih dari satu cabang?" a="Kuota dihitung per cabang. Selama memenuhi syarat dan batas usia tiap cabang, peserta dapat mendaftar ke beberapa cabang dengan data yang berbeda sesuai ketentuan." />
          <Faq q="Bagaimana cara mengetahui kelulusan penyisihan?" a="Status kelulusan dapat dicek pada halaman Cek Status menggunakan nomor pendaftaran dan token, atau melalui pengumuman resmi di sidogiri.net dan media sosial resmi." />
          <Faq q="Apa yang perlu disiapkan untuk Technical Meeting?" a="Koneksi internet stabil, perangkat Zoom (kamera + mikrofon), dan pastikan nama Zoom mengikuti format yang ditentukan. Konfirmasi kehadiran kepada penanggung jawab bila berhalangan." />
        </Section>

        <div style={{ marginTop: 48, padding: '30px 32px', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 4 }}>
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(22px,2.4vw,30px)', letterSpacing: '-0.03em' }}>Siap untuk mendaftar?</div>
          <p style={{ fontSize: 15, color: 'rgba(239,237,231,0.75)', margin: '10px 0 22px' }}>Kuota tiap cabang 100 peserta. Pastikan data dan berkas Anda siap.</p>
          <Link href="/daftar" className="btn-paper" style={{ display: 'inline-flex', alignItems: 'center', height: 50, padding: '0 28px', background: 'var(--paper)', color: 'var(--ink)', fontSize: 14, fontWeight: 600, borderRadius: 2 }}>
            Buka Formulir Pendaftaran
          </Link>
        </div>
      </main>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--olive)' }}>
        {title}
      </div>
      <div
        aria-hidden="true"
        style={{ width: 40, height: 2, background: 'var(--olive)', margin: '10px 0 22px' }}
      />
      {children}
    </section>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div style={{ padding: '18px 0', borderTop: '1px solid var(--line)' }}>
      <div style={{ fontFamily: 'var(--disp)', fontWeight: 500, fontSize: 17, letterSpacing: '-0.02em' }}>{q}</div>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: '#5a554c', marginTop: 6 }}>{a}</div>
    </div>
  );
}