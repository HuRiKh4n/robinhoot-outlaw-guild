'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { castleGlow, chestGlow, coinSparkle, fire, hotspots, type Box, type Hotspot } from '@/lib/hideout';
import { useSound } from '@/components/sound/SoundProvider';
import Particles from '@/components/motion/Particles';

const place = (wide: Box, tall: Box) => ({
  '--x': wide[0], '--y': wide[1], '--w': wide[2], '--h': wide[3],
  '--tx': tall[0], '--ty': tall[1], '--tw': tall[2], '--th': tall[3],
}) as React.CSSProperties;

/** The homepage: the outlaws' hideout. Every lit object is a door (real links/buttons over the art). */
export default function HideoutScene() {
  const { on, toggle, play } = useSound();
  const stage = useRef<HTMLDivElement>(null);
  const [entering, setEntering] = useState(false);
  const [withVideo, setWithVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  // Desktop: the living version of the room (silent looping video). Phones, data-saver and
  // reduced-motion visitors keep the still painting.
  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(min-width: 701px)').matches) return;
    setWithVideo(true);
  }, []);

  // Only play while the room is on screen.
  useEffect(() => {
    const element = video.current;
    if (!withVideo || !element || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void element.play().catch(() => {}); else element.pause();
    }, { threshold: 0.15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [withVideo]);

  // First visit of the session: the room starts dark and the lantern light spreads through it.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let seen = false;
    try { seen = sessionStorage.getItem('robinhoot:hideout-entered') === '1'; sessionStorage.setItem('robinhoot:hideout-entered', '1'); } catch {}
    if (seen) return;
    setEntering(true);
    const done = window.setTimeout(() => setEntering(false), 3200);
    return () => window.clearTimeout(done);
  }, []);

  // Torchlight + diorama tilt: the light follows the pointer (or finger), the room leans a little.
  useEffect(() => {
    const element = stage.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0, px = 0.5, py = 0.45;
    const apply = () => {
      frame = 0;
      element.style.setProperty('--lx', `${(px * 100).toFixed(1)}%`);
      element.style.setProperty('--ly', `${(py * 100).toFixed(1)}%`);
      element.style.setProperty('--rx', `${((0.5 - py) * 3).toFixed(2)}deg`);
      element.style.setProperty('--ry', `${((px - 0.5) * 4).toFixed(2)}deg`);
    };
    const move = (event: PointerEvent) => {
      const box = element.getBoundingClientRect();
      px = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
      py = Math.min(1, Math.max(0, (event.clientY - box.top) / box.height));
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const leave = () => { px = 0.5; py = 0.45; element.classList.remove('is-exploring'); if (!frame) frame = requestAnimationFrame(apply); };
    const enter = () => element.classList.add('is-exploring');
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerdown', move);
    element.addEventListener('pointerenter', enter);
    element.addEventListener('pointerleave', leave);
    apply();
    return () => { element.removeEventListener('pointermove', move); element.removeEventListener('pointerdown', move); element.removeEventListener('pointerenter', enter); element.removeEventListener('pointerleave', leave); if (frame) cancelAnimationFrame(frame); };
  }, []);

  const content = (spot: Hotspot) => <>
    <span className="hs-spark" aria-hidden="true" />
    <span className="hs-label"><strong>{spot.label}</strong><small>{spot.action === 'music' ? (on ? 'Playing · tap to stop' : 'Silent · tap to play') : spot.hint}</small></span>
  </>;

  return <section className="hideout" aria-labelledby="hideout-title">
    <h2 id="hideout-title" className="visually-hidden">The outlaws&rsquo; hideout</h2>
    <div ref={stage} className={`hideout-stage${entering ? ' is-entering' : ''}${videoReady ? ' has-video' : ''}`}>
      <div className="hideout-diorama">
      <picture className="hideout-art">
        <source media="(max-width: 700px)" type="image/webp" sizes="100vw" srcSet="/hideout/hideout-tall-828.webp 828w, /hideout/hideout-tall-1200.webp 1200w" />
        <img src="/hideout/hideout-wide-1600.webp" srcSet="/hideout/hideout-wide-1100.webp 1100w, /hideout/hideout-wide-1600.webp 1600w, /hideout/hideout-wide-2400.webp 2400w" sizes="100vw" width={2400} height={1340}
          alt="A cosy, messy hideout under the trenches: a fox pins WANTED posters to the wall, an open storybook lies on the table, a window shows the whale's golden castle, a chained chest glows by the fire, a raccoon bard plays the lute and a bounty board hangs on the right." fetchPriority="high" />
      </picture>
      {withVideo && <video ref={video} className="hideout-video" autoPlay muted loop playsInline preload="auto" poster="/hideout/hideout-wide-1600.webp" aria-hidden="true" onPlaying={() => setVideoReady(true)}>
        <source src="/hideout/hideout-wide-loop.webm" type="video/webm" />
        <source src="/hideout/hideout-wide-loop.mp4" type="video/mp4" />
      </video>}

      <div className="hideout-fx" aria-hidden="true">
        <span className="fx fx-fire" style={place(fire.wide, fire.tall)}><Particles kind="ember" count={10} seed={31} /></span>
        <span className="fx fx-castle" style={place(castleGlow.wide, castleGlow.tall)} />
        <span className="fx fx-chest" style={place(chestGlow.wide, chestGlow.tall)} />
        <span className="fx fx-coin" style={place(coinSparkle.wide, coinSparkle.tall)} />
      </div>

      <div className="hideout-torch" aria-hidden="true" />

      <ul className="hotspots">
        {hotspots.map(spot => <li key={spot.id} className={`hs hs-${spot.id}`} style={place(spot.wide, spot.tall)}>
          {spot.action === 'music'
            ? <button type="button" className="hs-target" aria-pressed={on} onClick={toggle} aria-label={`${spot.label}: ${on ? 'on' : 'off'}`}>{content(spot)}</button>
            : spot.href?.startsWith('#')
              ? <a className="hs-target" href={spot.href}>{content(spot)}</a>
              : <Link className="hs-target" href={spot.href!} onClick={() => play(spot.id === 'wanted' ? 'hit' : 'coin')}>{content(spot)}</Link>}
        </li>)}
      </ul>
      </div>
      <div className="hideout-curtain" aria-hidden="true" />
    </div>
  </section>;
}
