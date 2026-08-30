import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { prisma } from '@/lib/prisma';
import { TIMELINE, LOMBA } from '@/lib/data';

export const metadata = { title: 'Seleksi & Penyisihan' };
export const dynamic = 'force-dynamic';

export default async function SeleksiPage() {
  const pengumuman = await prisma.pengumuman
    .findMany({
      where: { published: true, tipe: { in: ['seleksi', 'final', 'umum'] } },
      orderBy: { createdAt: 'desc' },
    })
    .catch(() => []);

  return (
    <PageShell>
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(48px, 6vw, 88px) clamp(20px, 4vw, 40px)' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--olive)' }}>
            Seleksi &amp; Penyisihan
          </div>
          <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(34px, 4.4vw, 58px)', lineHeight: 1, letterSpacing: '-0.045em', margin: '16px 0 14px' }}>
            Seleksi &amp; Penyisihan
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: '#4b4740', maxWidth: '62ch' }}>
            Tahap penyisihan dilaksanakan daring pada 30 Oktober 2026, menuju babak final luring di
            Pondok Pesantren Sidogiri. Pantau status Anda melalui halaman{' '}
            <Link href="/cek-status" style={{ fontWeight: 600 }}>Cek Status</Link>.
          </p>
        </div>

        <section style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--olive)' }}>
            Jadwal seleksi
          </div>
          <div style={{ width: 40, height: 2, background: 'var(--olive)', margin: '10px 0 22px' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {TIMELINE.map((t) => (
              <div key={t.num} style={{ display: 'grid', gridTemplateColumns: '88px minmax(0,1fr) minmax(0,1.4fr)', gap: 'clamp(14px,3vw,36px)', alignItems: 'start', padding: '22px 0', borderTop: '1px solid var(--line)' }}>
                <div style={{ fontFamily: 'var(--disp)', fontSize: 13, fontWeight: 500, letterSpacing: '0.14em', color: 'var(--olive)' }}>{t.num}</div>
                <div style={{ fontFamily: 'var(--disp)', fontWeight: 500, fontSize: 'clamp(16px,1.5vw,20px)', letterSpacing: '-0.02em' }}>{t.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: '#4b4740' }}>{t.detail}</div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--line)' }} />
          </div>
        </section>

        <section style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--olive)' }}>
            Teknis penyisihan per cabang
          </div>
          <div style={{ width: 40, height: 2, background: 'var(--olive)', margin: '10px 0 22px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
            {LOMBA.map((c) => (
              <div key={c.id} style={{ background: 'var(--paper2)', borderRadius: 3, padding: '22px' }}>
                <div style={{ fontFamily: 'var(--disp)', fontWeight: 500, fontSize: 16, letterSpacing: '-0.02em' }}>{c.name}</div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--olive-d)', margin: '10px 0 8px' }}>
                  {c.deadlineTag}
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[c.sections[2], c.sections[1]]
                    .filter(Boolean)
                    .flatMap((s) => s.items.slice(0, 3))
                    .map((it, i) => (
                      <li key={i} style={{ fontSize: 13.5, lineHeight: 1.55, color: '#4b4740', paddingLeft: 16, position: 'relative' }}>
                        <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: '0.72em', width: 5, height: 5, borderRadius: '50%', background: 'var(--olive)' }} />
                        {it}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--olive)' }}>
            Pengumuman resmi
          </div>
          <div style={{ width: 40, height: 2, background: 'var(--olive)', margin: '10px 0 22px' }} />
          {pengumuman.length === 0 ? (
            <div style={{ background: 'var(--paper2)', borderRadius: 3, padding: '28px 30px', fontSize: 14.5, color: '#5a554c', lineHeight: 1.6 }}>
              Belum ada pengumuman resmi. Pengumuman kelulusan penyisihan dan final akan disampaikan
              melalui halaman ini, sidogiri.net, dan media sosial resmi Pondok Pesantren Sidogiri.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {pengumuman.map((p) => (
                <div key={p.id} style={{ background: 'var(--paper2)', borderRadius: 3, padding: '24px 26px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                    <div style={{ fontFamily: 'var(--disp)', fontWeight: 500, fontSize: 18, letterSpacing: '-0.02em' }}>{p.judul}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)' }}>
                      {new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: '#4b4740', whiteSpace: 'pre-wrap' }}>{p.isi}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{ marginTop: 48, padding: '28px 32px', background: 'var(--olive-p)', borderRadius: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--olive-d)' }}>
            Peserta MQK
          </div>
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(20px,2.2vw,28px)', letterSpacing: '-0.03em', margin: '8px 0 4px', color: 'var(--ink)' }}>
            Kuis Penyisihan Babak I
          </div>
          <p style={{ fontSize: 14, color: '#4b4740', margin: '0 0 16px', maxWidth: '58ch' }}>
            50 soal nahwu, fikih, dan sharaf, 15 detik per soal. Kuis hanya dapat dikerjakan satu kali —
            pastikan Anda siap sebelum memulai.
          </p>
          <Link href="/kuis-mqk" style={{ display: 'inline-flex', alignItems: 'center', height: 48, padding: '0 24px', background: 'var(--ink)', color: 'var(--paper)', fontSize: 14, fontWeight: 600, borderRadius: 2 }}>
            Mulai Kuis MQK →
          </Link>
        </div>

        <div style={{ marginTop: 20, padding: '28px 32px', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 4 }}>
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 300, fontSize: 'clamp(20px,2.2vw,28px)', letterSpacing: '-0.03em' }}>
            Ingin memastikan status Anda?
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/cek-status" className="btn-paper" style={{ display: 'inline-flex', alignItems: 'center', height: 48, padding: '0 24px', background: 'var(--paper)', color: 'var(--ink)', fontSize: 14, fontWeight: 600, borderRadius: 2 }}>
              Cek Status
            </Link>
            <Link href="/info-peserta" style={{ color: 'var(--olive-l)', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
              Info Peserta →
            </Link>
          </div>
        </div>
      </main>
    </PageShell>
  );
}