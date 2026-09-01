// Subtle corner flourishes for content pages that otherwise have no ornamentation
// (see Hero/AlurSection/LombaSection/CTABanner for the same motif on the homepage).
//
// CALLER REQUIREMENT: the wrapper you render this into must be `position: relative`
// AND `zIndex: 0` (not just `position: relative`). Without an explicit zIndex, a
// positioned wrapper with its own opaque background doesn't establish its own
// stacking context, so its background gets placed in the shared root stacking
// context's "z-index:auto" layer — which paints ABOVE this component's `zIndex:-1`
// children there, hiding them completely under the wrapper's own background even
// though they're its own DOM children. This is exactly what happened when
// PageOrnaments was added to the admin panel/login pages: those wrappers set
// `position:relative` + an opaque `background` spanning the full viewport but no
// zIndex, so the ornaments rendered in the DOM (confirmed via computed styles) yet
// were invisible in every screenshot. Adding `zIndex: 0` scopes this component's
// negative z-index locally, so it paints below in-flow content but above the
// wrapper's own background, as intended.
//
// ornamen-*-sm.png are pre-cropped/pre-resized (900x900, alpha boosted) derivatives
// of the originals: the source PNGs are an almost fully transparent fine lattice
// texture (peak alpha ~53%/37%, mean well under 3%) spread evenly across a
// 4000px-wide canvas, and squeezing that directly into a ~360px CSS box means the
// browser has to downscale ~11x at runtime — that washes the fine linework out to
// near-invisible (renders as a faint pattern on one page, vanishes completely on
// another, purely from sub-pixel-sensitive anti-aliasing). Doing the crop + resize
// once with a quality resample keeps the linework crisp regardless of viewport.
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
          backgroundImage: 'url(/ornamen-atas-sm.png)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'right top',
          opacity: 0.55,
          zIndex: -1,
          pointerEvents: 'none',
          animation: 'pageOrnamentGlow 10000ms ease-in-out infinite',
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
          backgroundImage: 'url(/ornamen-bawah-sm.png)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'left bottom',
          opacity: 0.55,
          zIndex: -1,
          pointerEvents: 'none',
          animation: 'pageOrnamentGlow 11000ms ease-in-out infinite 500ms',
        }}
      />
    </>
  );
}
