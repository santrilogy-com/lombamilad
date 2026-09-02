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
//
// AESTHETIC NOTE (why these bleed off the viewport edges like the homepage hero):
// The hero ornaments (Hero.tsx) sit in LARGE boxes anchored with negative offsets
// (top:-14%/bottom:-12%, right:-4%/left:-6%) so each lattice bleeds off the section
// edge and gets softly clipped by overflow:hidden — that's what makes them read as
// an organic sweep flowing across the page instead of a stuck-on decal. The earlier
// version of this component drew the square *sm crop fully inside* the corners
// (top:0/right:0, bottom:0/left:0), so the ≤360px box showed a hard-edged square of
// texture. Mirroring the hero's bleed keeps the same coverage and linework but clips
// the box mid-texture at the viewport edge, killing the harsh square boundary.
export default function PageOrnaments() {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-9%',
          right: '-9%',
          width: 'min(58vw, 500px)',
          height: 'min(58vw, 500px)',
          backgroundImage: 'url(/ornamen-atas-sm.png)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'right top',
          opacity: 0.5,
          zIndex: -1,
          pointerEvents: 'none',
          animation: 'pageOrnamentGlow 10000ms ease-in-out infinite',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-9%',
          width: 'min(56vw, 480px)',
          height: 'min(56vw, 480px)',
          backgroundImage: 'url(/ornamen-bawah-sm.png)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'left bottom',
          opacity: 0.5,
          zIndex: -1,
          pointerEvents: 'none',
          animation: 'pageOrnamentGlow 11000ms ease-in-out infinite 500ms',
        }}
      />
    </>
  );
}
