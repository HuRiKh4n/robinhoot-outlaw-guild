'use client';

import { useEffect, useState } from 'react';
import GameMenu from './GameMenu';
import Particles from '@/components/motion/Particles';

/** Full-screen video-game title screen (critic's concept):
 *  black → ROBINHOOT writes itself → "press any button" → main menu. */
export default function TitleScreen() {
  const [stage, setStage] = useState<'black' | 'title' | 'press' | 'menu'>('menu');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let seen = false;
    try { seen = sessionStorage.getItem('robinhoot:title-seen') === '1'; sessionStorage.setItem('robinhoot:title-seen', '1'); } catch {}
    if (new URLSearchParams(location.search).has('intro')) seen = false; // ?intro replays it
    if (seen) return;
    setStage('black');
    const t1 = window.setTimeout(() => setStage('title'), 700);
    const t2 = window.setTimeout(() => setStage('press'), 2700);
    const t3 = window.setTimeout(() => setStage(current => current === 'menu' ? current : 'menu'), 6500);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (stage === 'menu') return;
    const go = () => setStage('menu');
    window.addEventListener('keydown', go, { once: true });
    window.addEventListener('pointerdown', go, { once: true });
    return () => { window.removeEventListener('keydown', go); window.removeEventListener('pointerdown', go); };
  }, [stage]);

  return <section className={`title-screen is-${stage}`} id="legend" aria-labelledby="title-name">
    <div className="ts-bg" aria-hidden="true">
      <picture className="ts-art">
        <source media="(max-width: 700px) and (orientation: portrait)" type="image/webp" sizes="100vw" srcSet="/title/title-tall-800.webp 800w, /title/title-tall-941.webp 941w" />
        <img src="/title/title-wide-1672.webp" srcSet="/title/title-wide-1100.webp 1100w, /title/title-wide-1672.webp 1672w" sizes="100vw" width={1672} height={941} alt="" fetchPriority="high" />
      </picture>
      <div className="ts-fog" />
      <Particles kind="ember" count={22} seed={77} />
    </div>

    <div className="ts-content">
      <p className="ts-kicker">A tale from the kingdom of NEAR</p>
      <h1 id="title-name" className="ts-name" aria-label="RobinHoot">{'ROBINHOOT'.split('').map((letter, i) => <span key={i} style={{ animationDelay: `${i * 0.13}s` }}>{letter}</span>)}</h1>
      <div className="ts-rule" aria-hidden="true"><i /></div>
      <p className="ts-sub">THE OUTLAW OF NEAR</p>
      <p className="ts-tag">The castles are full. The trenches are rising.</p>
      <GameMenu />
    </div>

    <p className="ts-press" aria-hidden="true"><span>PRESS ANY BUTTON</span></p>

    <div className="ts-foot">
      <p>Choose a creature, a calling and an outfit. The Sheriff&rsquo;s clerks will write your wanted poster.</p>
      <p className="ts-keys" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> select <kbd>Enter</kbd> confirm</p>
    </div>
  </section>;
}
