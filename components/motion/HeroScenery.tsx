'use client';

import { useEffect, useRef } from 'react';

/** Moon and a distant castle silhouette behind the hero, drifting at different speeds as you scroll. */
export default function HeroScenery() {
  const moon = useRef<HTMLDivElement>(null);
  const castle = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.min(window.scrollY, 900);
      if (moon.current) moon.current.style.transform = `translate3d(0, ${y * 0.45}px, 0)`;
      if (castle.current) castle.current.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  return <div className="hero-scenery" aria-hidden="true">
    <div ref={moon} className="hero-moon" />
    <div ref={castle} className="hero-castle">
      <svg viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice">
        <path fill="#0f110d" d="M0 260V205l60-18 70 10 40-30h40v-40h-10v-22h12v12h12v-12h12v12h12v-12h12v22h-10v60l50 14 60-6V120h-12V92h14v12h14V92h14v12h14V92h14v28h-12v42l40-4V70h-16V40h16v14h16V40h16v14h16V40h16v30h-16v88l46 8V112h-12V86h12v10h12V86h12v10h12V86h12v26h-12v56l70 10 30-26 80 16 70-12 90 22 70-8 90 30v76z" />
        <g fill="#e0a54a">
          <rect className="win" x="575" y="96" width="9" height="15" rx="4" />
          <rect className="win w2" x="604" y="96" width="9" height="15" rx="4" />
          <rect className="win w3" x="590" y="140" width="9" height="15" rx="4" />
          <rect className="win w2" x="432" y="140" width="7" height="12" rx="3" />
          <rect className="win" x="742" y="128" width="7" height="12" rx="3" />
          <rect className="win w3" x="236" y="160" width="6" height="10" rx="3" />
        </g>
      </svg>
    </div>
  </div>;
}
