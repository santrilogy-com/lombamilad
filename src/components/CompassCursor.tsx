'use client';

import { useEffect } from 'react';

/**
 * Meniru "cursor + kompas" dari file HTML asli: pointer kursor diganti oleh
 * gambar jarum kompas (compass-needle.png) yang mengikuti gerakan mouse dan
 * berputar sesuai arah gerak, membesar saat mengarah ke elemen interaktif.
 * Juga mengaktifkan animasi reveal (.reveal) berbasisIntersectionObserver.
 */
export default function CompassCursor() {
  // Scroll-reveal must work on every device (mobile included), so it lives in
  // its own effect, independent of the cursor-follow effect below which is
  // intentionally skipped on touch/coarse-pointer devices.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const rx = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('in-view');
            rx.unobserve(e.target);
          }
        }
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll('.reveal').forEach((el) => rx.observe(el));

    return () => rx.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const wrap = document.createElement('div');
    wrap.id = 'compass-cursor';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'width:40px',
      'height:40px',
      'margin:-20px 0 0 -20px',
      'z-index:9999',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity 420ms cubic-bezier(0.16,1,0.3,1)',
      'will-change:transform',
    ].join(';');
    wrap.style.transition = reduce ? 'opacity 120ms ease' : wrap.style.transition;

    const needle = document.createElement('img');
    needle.id = 'compass-needle';
    needle.src = '/compass-needle.png';
    needle.alt = '';
    needle.style.cssText = [
      'display:block',
      'width:100%',
      'height:100%',
      'border-radius:50%',
      'transform-origin:50% 50%',
      'filter:drop-shadow(0 3px 9px rgba(36,33,28,0.24))',
      'opacity:0.9',
    ].join(';');
    wrap.appendChild(needle);
    document.body.appendChild(wrap);

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const cur = { x: pos.x, y: pos.y };
    let angle = 0;
    let target = 0;
    let scale = 1;
    let targetScale = 1;

    const norm = (a: number) => {
      let v = a;
      while (v > 180) v -= 360;
      while (v < -180) v += 360;
      return v;
    };

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      wrap.style.opacity = '1';
      const near = e.target instanceof Element && e.target.closest('a, button, input, label, textarea, select');
      targetScale = near ? 1.26 : 1;
    };
    const onLeave = () => {
      wrap.style.opacity = '0';
    };
    const onDown = () => {
      targetScale = 0.88;
    };
    const onUp = () => {
      targetScale = 1;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    let raf = 0;
    const tick = () => {
      const dx = pos.x - cur.x;
      const dy = pos.y - cur.y;
      cur.x += dx * 0.13;
      cur.y += dy * 0.13;
      if (Math.abs(dx) + Math.abs(dy) > 1.2) target = (Math.atan2(dy, dx) * 180) / Math.PI + 90 - 45;
      angle += norm(target - angle) * 0.09;
      scale += (targetScale - scale) * 0.12;
      wrap.style.transform = `translate3d(${cur.x}px,${cur.y}px,0) scale(${scale.toFixed(3)})`;
      if (!reduce) {
        needle.style.transform = `rotate(${angle.toFixed(0)}deg) scale(1.0)`;
        needle.style.filter =
          'drop-shadow(0 3px 9px rgba(36,33,28,0.24)) ' +
          (scale > 1.18 ? 'brightness(1.15)' : '');
      } else {
        needle.style.transform = 'rotate(0deg)';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      wrap.remove();
    };
  }, []);

  return null;
}
