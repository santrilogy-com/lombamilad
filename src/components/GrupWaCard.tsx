import { GRUP_WA } from '@/lib/data';

/** Ajakan bergabung ke grup WhatsApp peserta sesuai cabang lomba. */
export default function GrupWaCard({ cabangId, style }: { cabangId: string; style?: React.CSSProperties }) {
  const link = GRUP_WA[cabangId];
  if (!link) return null;
  return (
    <div
      style={{
        background: '#eef7ee',
        borderRadius: 3,
        borderLeft: '3px solid #25a244',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        ...style,
      }}
    >
      <div style={{ flex: '1 1 260px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1d6b30' }}>Gabung grup WhatsApp peserta</div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: '#4b4740', marginTop: 4 }}>
          Informasi teknis, jadwal, dan pengumuman penting dibagikan lewat grup ini.
        </div>
      </div>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: 44,
          padding: '0 22px',
          background: '#25a244',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          borderRadius: 2,
          whiteSpace: 'nowrap',
        }}
      >
        Masuk Grup WhatsApp ↗
      </a>
    </div>
  );
}
