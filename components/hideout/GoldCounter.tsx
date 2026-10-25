'use client';

import { useCallback, useEffect, useState } from 'react';
import { dartboard, type Box } from '@/lib/hideout';
import { useSound } from '@/components/sound/SoundProvider';

const KEY = 'robinhoot:gold-reclaimed';
const place = (wide: Box, tall: Box) => ({
  '--x': wide[0], '--y': wide[1], '--w': wide[2], '--h': wide[3],
  '--tx': tall[0], '--ty': tall[1], '--tw': tall[2], '--th': tall[3],
}) as React.CSSProperties;

/** Throw darts at the Sheriff's portrait to steal back his gold. A just-for-fun counter kept in this browser. */
export function useGold() {
  const [gold, setGold] = useState(0);
  useEffect(() => {
    const read = () => { try { setGold(Number(localStorage.getItem(KEY)) || 0); } catch {} };
    read();
    window.addEventListener('robinhoot:gold', read);
    return () => window.removeEventListener('robinhoot:gold', read);
  }, []);
  const add = useCallback(() => {
    let next = 0;
    try { next = (Number(localStorage.getItem(KEY)) || 0) + 1; localStorage.setItem(KEY, String(next)); } catch {}
    window.dispatchEvent(new Event('robinhoot:gold'));
    return next;
  }, []);
  return { gold, add };
}

export function Dartboard({ onHit }: { onHit: () => void }) {
  const { play } = useSound();
  const [pops, setPops] = useState<number[]>([]);
  const hit = () => {
    onHit(); play('coin');
    const id = Date.now() + Math.random();
    setPops(list => [...list.slice(-5), id]);
    window.setTimeout(() => setPops(list => list.filter(p => p !== id)), 900);
  };
  return <div className="hs hs-dartboard" style={place(dartboard.wide, dartboard.tall)}>
    <button type="button" className="hs-target dart-target" onClick={hit} aria-label="Throw a dart at the Sheriff's portrait and steal back a coin">
      <span className="hs-label"><strong>Strike the Sheriff</strong><small>Steal back a coin</small></span>
      {pops.map(id => <span key={id} className="coin-pop" aria-hidden="true">+1 🪙</span>)}
    </button>
  </div>;
}

export function GoldTally({ gold }: { gold: number }) {
  return <div className="gold-tally" role="status" aria-live="polite">
    <span>GOLD RECLAIMED</span>
    <strong>{gold.toLocaleString('en')}</strong>
    <i aria-hidden="true">🪙</i>
  </div>;
}
