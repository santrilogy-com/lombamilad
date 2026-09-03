import type { CSSProperties, ReactNode } from 'react';

// Shared visual language for the admin panel — kept as inline-style helpers
// (not CSS classes) to match how the rest of this codebase styles components,
// so admin pages compose consistent chrome instead of each re-declaring the
// same header/card/badge/button styles with tiny drifts.

export const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  MENUNGGU_VERIFIKASI: { label: 'Menunggu verifikasi', bg: '#f7ecd0', color: '#8a6d1f' },
  TERVERIFIKASI: { label: 'Terverifikasi', bg: 'var(--olive-p)', color: '#4f6b1f' },
  DITOLAK: { label: 'Ditolak', bg: '#f4dede', color: '#a94442' },
  LOLOS_PENYISIHAN: { label: 'Lolos penyisihan', bg: '#dbeedb', color: '#2e7d2e' },
  GUGUR_PENYISIHAN: { label: 'Gugur penyisihan', bg: '#ecece6', color: '#7a7a72' },
  LOLOS_FINAL: { label: 'Lolos final', bg: '#dbeedb', color: '#2e7d2e' },
  JUARA_1: { label: 'Juara 1', bg: 'var(--olive-p)', color: '#675c37' },
  JUARA_2: { label: 'Juara 2', bg: 'var(--olive-p)', color: '#675c37' },
  JUARA_3: { label: 'Juara 3', bg: 'var(--olive-p)', color: '#675c37' },
};

export function statusMeta(status: string) {
  return STATUS_META[status] || { label: status, bg: '#ecece6', color: '#7a7a72' };
}

export function Badge({ status }: { status: string }) {
  const m = statusMeta(status);
  return (
    <span
      style={{
        display: 'inline-block',
        background: m.bg,
        color: m.color,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        borderRadius: 3,
        padding: '5px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {m.label}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 20,
        flexWrap: 'wrap',
        marginBottom: description ? 24 : 20,
      }}
    >
      <div>
        <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 23, letterSpacing: '-0.01em', margin: 0, color: 'var(--ink)' }}>
          {title}
        </h1>
        {description ? (
          <p style={{ fontSize: 13.5, color: 'var(--grey)', margin: '6px 0 0', maxWidth: '62ch', lineHeight: 1.55 }}>{description}</p>
        ) : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div> : null}
    </div>
  );
}

export function SectionHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
      <h2 style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 15, letterSpacing: '0.01em', margin: 0, color: 'var(--ink)' }}>
        {title}
      </h2>
      {actions ?? null}
    </div>
  );
}

export const cardStyle: CSSProperties = {
  background: 'var(--paper2)',
  border: '1px solid var(--line)',
  borderRadius: 6,
  padding: '20px 22px',
};

export function StatTile({ label, value, tone = 'default' }: { label: string; value: ReactNode; tone?: 'default' | 'warn' }) {
  const bg = tone === 'warn' ? '#f7ecd0' : 'var(--paper2)';
  const fg = tone === 'warn' ? '#8a6d1f' : 'var(--ink)';
  return (
    <div style={{ ...cardStyle, background: bg, padding: '20px 22px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: tone === 'warn' ? fg : 'var(--grey)' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 34, marginTop: 8, color: fg, letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}

export function chipStyle(active: boolean): CSSProperties {
  return {
    padding: '8px 14px',
    fontSize: 12.5,
    fontWeight: 600,
    borderRadius: 99,
    background: active ? 'var(--olive)' : 'var(--paper2)',
    color: active ? '#fff' : 'var(--ink)',
    border: '1px solid transparent',
  };
}

export const thStyle: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '2px solid var(--ink)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--grey)',
  textAlign: 'left',
};

export const tdStyle: CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid var(--line)',
  fontSize: 13,
};

export function buttonStyle(variant: 'primary' | 'danger' | 'ghost' = 'primary', opts?: { small?: boolean }): CSSProperties {
  const h = opts?.small ? 34 : 42;
  const base: CSSProperties = {
    height: h,
    padding: opts?.small ? '0 14px' : '0 20px',
    fontSize: opts?.small ? 12.5 : 13.5,
    fontWeight: 600,
    borderRadius: 4,
    cursor: 'pointer',
    border: 0,
  };
  if (variant === 'primary') return { ...base, background: 'var(--ink)', color: 'var(--paper)' };
  if (variant === 'danger') return { ...base, background: '#a94442', color: '#fff' };
  return { ...base, background: 'transparent', color: 'var(--ink)', border: '1px solid rgba(36,33,28,0.25)' };
}
