// Subtle corner flourishes for content pages that otherwise have no ornamentation
// (see Hero/AlurSection/LombaSection/CTABanner for the same motif on the homepage).
// zIndex: -1 keeps them behind normal-flow content without requiring callers to
// touch the stacking context of whatever they wrap.
export default function PageOrnaments() {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 'min(40vw, 360px)',
          height: 'min(40vw, 360px)',
          backgroundImage: 'url(/ornamen-atas.png)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'right top',
          opacity: 0.4,
          zIndex: -1,
          pointerEvents: 'none',
          animation: 'ornamentGlow 10000ms ease-in-out infinite',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: 'min(36vw, 320px)',
          height: 'min(36vw, 320px)',
          backgroundImage: 'url(/ornamen-bawah.png)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'left bottom',
          opacity: 0.4,
          zIndex: -1,
          pointerEvents: 'none',
          animation: 'ornamentGlow 11000ms ease-in-out infinite 500ms',
        }}
      />
    </>
  );
}
