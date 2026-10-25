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
      <div className="ts-sky" />
      <svg className="ts-castle" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="tsfog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a2a2e" stopOpacity="0" /><stop offset="1" stopColor="#0b0b0d" /></linearGradient>
        </defs>
        <path fill="#17171b" d="M0 900V560l90-60 70 30 110-120 90 70 120-150 160 140 90-60 140 120 110-90 130 110 160-150 120 120 120-70 90 50v460z" />
        <path fill="#0f0f12" d="M520 900V520h30V380h-18l38-90 38 90h-18v120h40V300h-20l45-110 45 110h-20v160h40V250h-22l52-140 52 140h-22v220h50V340h-18l40-95 40 95h-18v160h44V420h-16l34-80 34 80h-16v180h60l200 300z" />
        <g fill="#e6a548">
          <rect className="ts-win" x="604" y="330" width="8" height="16" rx="4" /><rect className="ts-win w2" x="707" y="290" width="8" height="16" rx="4" />
          <rect className="ts-win w3" x="812" y="270" width="9" height="18" rx="4" /><rect className="ts-win" x="828" y="360" width="8" height="15" rx="4" />
          <rect className="ts-win w2" x="934" y="370" width="8" height="15" rx="4" /><rect className="ts-win w3" x="1020" y="450" width="7" height="13" rx="3" />
        </g>
        <path fill="#0c0c0e" d="M640 900l40-210h60l40 60h360l50-40h80l60 60h80l60-50h40v180z" />
        <rect width="1600" height="900" fill="url(#tsfog)" />
      </svg>
      <div className="ts-fog" />
      <picture className="ts-fox"><source srcSet="/images/robinhoot-fox.webp" type="image/webp" /><img src="/images/robinhoot-fox.png" alt="" width={1024} height={1536} /></picture>
      <Particles kind="ember" count={26} seed={77} />
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
