export default function AdminPanelLoading() {
  return (
    <div aria-hidden="true" style={{ animation: 'adminSkeletonFade 160ms ease-in' }}>
      <div style={{ height: 34, width: '38%', maxWidth: 320, borderRadius: 3, background: 'var(--paper2)', marginBottom: 10 }} />
      <div style={{ height: 14, width: '58%', maxWidth: 460, borderRadius: 3, background: 'var(--paper2)', marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 96, borderRadius: 4, background: 'var(--paper2)' }} />
        ))}
      </div>
      <div style={{ borderRadius: 4, background: 'var(--paper2)', height: 320 }} />
      <style>{`@keyframes adminSkeletonFade { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}
