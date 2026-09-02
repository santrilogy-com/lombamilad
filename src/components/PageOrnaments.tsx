import Image from 'next/image';

// Corner flourishes for content pages that otherwise have no ornamentation —
// intentionally an exact visual match of the homepage hero's ornaments
// (see Hero.tsx): same source images, same size/position/opacity, same
// glow animation. Only the z-index differs (see globals.css .page-orn-*
// comment) because arbitrary page content here isn't lifted to z-index:2
// the way Hero's `.g-hero` column is.
//
// CALLER REQUIREMENT: the wrapper you render this into must be `position:
// relative` AND `zIndex: 0` (not just `position: relative`). Without an
// explicit zIndex, a positioned wrapper with its own opaque background
// doesn't establish its own stacking context, so its background gets
// placed in the shared root stacking context's "z-index:auto" layer —
// which paints ABOVE this component's negative z-index children there,
// hiding them completely under the wrapper's own background even though
// they're its own DOM children. Adding `zIndex: 0` scopes the negative
// z-index locally, so it paints below in-flow content but above the
// wrapper's own background, as intended.
export default function PageOrnaments() {
  return (
    <>
      <div
        aria-hidden="true"
        className="hero-orn page-orn-bawah"
        style={{ opacity: 0.6, animation: 'ornamentGlow 11000ms ease-in-out infinite' }}
      >
        <Image
          src="/ornamen-bawah.png"
          alt=""
          fill
          sizes="62vw"
          style={{ objectFit: 'cover', objectPosition: 'left bottom' }}
        />
      </div>
      <div
        aria-hidden="true"
        className="hero-orn page-orn-atas"
        style={{ opacity: 0.55, animation: 'ornamentGlow 9500ms ease-in-out infinite 400ms' }}
      >
        <Image
          src="/ornamen-atas.png"
          alt=""
          fill
          sizes="46vw"
          style={{ objectFit: 'cover', objectPosition: 'right top' }}
        />
      </div>
    </>
  );
}
