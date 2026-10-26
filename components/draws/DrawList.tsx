'use client';

import { useEffect, useState } from 'react';
import { drawWinners } from '@/lib/draw-math';

interface Entry { kind: 'weekly' | 'monthly'; date: string; file: string; eligible: number; winners: number }
interface Draw {
  kind: 'weekly' | 'monthly'; date: string; holdHours: number; minTokens: string; symbol?: string;
  seedBlock: { height: number; hash: string; time: string }; holdersChecked: number; totalTickets?: number;
  eligible: Array<string | { account: string; tickets: number }>; linked?: string[][];
  winners: Array<{ account: string; share: number; title?: string; tickets?: number }>;
}

const label = (kind: Draw['kind']) => kind === 'monthly' ? 'Grand Prize' : 'Weekly prize';
const day = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function tweet(draw: Draw) {
  const head = draw.kind === 'monthly' ? '👑 The Grand Prize has been drawn!' : '🏹 The Sheriff\'s weekly loot has been drawn!';
  const lines = draw.winners.map((w, i) => `${i === 0 ? (draw.kind === 'monthly' ? '👑' : '🍀') : '🦊'} ${w.account}${w.title ? ` (${w.title})` : ''}`);
  return `${head}\n\n${lines.join('\n')}\n\nSeed: NEAR block #${draw.seedBlock.height}. Anyone can check it.\nHold ${draw.holdHours === 120 ? '5' : '3'} days to be in the next draw.`;
}

export default function DrawList() {
  const [draws, setDraws] = useState<Draw[] | null>(null);
  const [copied, setCopied] = useState('');
  const [checks, setChecks] = useState<Record<string, 'ok' | 'bad'>>({});
  async function verify(draw: Draw) {
    const again = await drawWinners(draw.seedBlock.hash, draw.kind, draw.eligible, draw.winners.length);
    const same = again.length === draw.winners.length && again.every((p, i) => p.account === draw.winners[i].account);
    setChecks(current => ({ ...current, [draw.kind + draw.date]: same ? 'ok' : 'bad' }));
  }
  useEffect(() => {
    (async () => {
      try {
        const index: Entry[] = await fetch('/draws/index.json', { cache: 'no-store' }).then(r => r.json());
        const loaded = await Promise.all(index.slice(0, 12).map(e => fetch(`/draws/${e.file}`, { cache: 'no-store' }).then(r => r.json() as Promise<Draw>)));
        setDraws(loaded);
      } catch { setDraws([]); }
    })();
  }, []);

  if (!draws) return <p className="raid-closed">Reading the ledger…</p>;
  if (!draws.length) return <section className="raid-rules"><p className="raid-closed">No draws yet. The first one comes the first Sunday after the coin is live.</p></section>;

  return <section className="raid-rules draw-list">
    {draws.map(draw => <article key={`${draw.kind}-${draw.date}`} className={`draw-card${draw.kind === 'monthly' ? ' is-grand' : ''}`}>
      <p className="loot-card-kicker">{label(draw.kind)} · {day(draw.date)}</p>
      <ol className="draw-winners">
        {draw.winners.map((w, i) => <li key={w.account}><span>{i === 0 ? (draw.kind === 'monthly' ? '👑' : '🍀') : '🦊'} {w.account}{w.title ? <em> · {w.title}</em> : null}</span><b>{w.share.toFixed(w.share % 1 ? 1 : 0)}%</b></li>)}
      </ol>
      <p className="loot-card-note">{draw.eligible.length} of {draw.holdersChecked} holders were eligible (at least {Number(draw.minTokens).toLocaleString('en-US')} tokens for {draw.holdHours} h){draw.totalTickets ? `, ${draw.totalTickets} tickets in the pot` : ''}. Seed: <a href={`https://nearblocks.io/blocks/${draw.seedBlock.hash}`} target="_blank" rel="noopener noreferrer">block #{draw.seedBlock.height} ↗</a></p>
      <details className="draw-eligible"><summary>All eligible holders ({draw.eligible.length})</summary><p>{draw.eligible.map(e => typeof e === 'string' ? e : `${e.account} (${e.tickets} 🎟️)`).join(', ')}</p></details>
      <div className="draw-actions"><button type="button" className="button" onClick={() => void verify(draw)}>CHECK THIS DRAW</button>
      {checks[draw.kind + draw.date] && <span className={`draw-check ${checks[draw.kind + draw.date]}`} role="status">{checks[draw.kind + draw.date] === 'ok' ? '✓ Your device re-ran the draw: the winners match.' : '✗ The winners do not match. Tell the guild.'}</span>}</div>
      <button type="button" className="button" onClick={() => { void navigator.clipboard?.writeText(tweet(draw)).then(() => { setCopied(draw.date + draw.kind); setTimeout(() => setCopied(''), 2000); }); }}>{copied === draw.date + draw.kind ? 'COPIED ✓' : 'COPY THE TWEET'}</button>
    </article>)}
  </section>;
}
