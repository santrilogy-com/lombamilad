import type { Metadata, Viewport } from 'next';
import './globals.css';
import CompassCursor from '@/components/CompassCursor';
import HelpFab from '@/components/HelpFab';

export const metadata: Metadata = {
  title: {
    default: 'Lomba Nasional Milad Sidogiri 290',
    template: '%s | Lomba Nasional Milad Sidogiri 290',
  },
  description:
    'Lomba Nasional dalam rangkaian Milad ke-290 Pondok Pesantren Sidogiri dan Ikhtibar ke-91 Madrasah Miftahul Ulum. Lima cabang lomba, kuota 100 peserta per lomba.',
  keywords: ['Milad 290', 'Sidogiri', 'Lomba Nasional', 'Pondok Pesantren Sidogiri', 'MTQ', 'MQK'],
  metadataBase: new URL('https://miladsidogiri.id'),
  openGraph: {
    title: 'Lomba Nasional Milad Sidogiri 290',
    description:
      'Lima cabang lomba tingkat nasional dalam rangkaian Milad ke-290 Pondok Pesantren Sidogiri. Satu Arah dalam Bermanhaj dan Bermadzhab.',
    type: 'website',
    locale: 'id_ID',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary',
    title: 'Lomba Nasional Milad Sidogiri 290',
    description:
      'Lima cabang lomba tingkat nasional dalam rangkaian Milad ke-290 Pondok Pesantren Sidogiri.',
    images: ['/logo.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8a7c4c',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" style={{ scrollBehavior: 'smooth' }}>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <CompassCursor />
        <HelpFab />
        <TopStripe />
        <div style={{ flex: 1 }}>{children}</div>
        <div
          aria-hidden="true"
          style={{
            display: 'grid',
            gridTemplateColumns: '8% 1fr 26%',
            height: '10px',
            flexShrink: 0,
          }}
        >
          <span style={{ background: 'var(--grey)' }} />
          <span style={{ background: 'var(--paper2)' }} />
          <span style={{ background: 'var(--olive)' }} />
        </div>
      </body>
    </html>
  );
}

function TopStripe() {
  return (
    <div
      aria-hidden="true"
      style={{ display: 'grid', gridTemplateColumns: '26% 1fr 8%', height: '10px' }}
    >
      <span style={{ background: 'var(--olive)' }} />
      <span style={{ background: 'var(--paper2)' }} />
      <span style={{ background: 'var(--grey)' }} />
    </div>
  );
}
