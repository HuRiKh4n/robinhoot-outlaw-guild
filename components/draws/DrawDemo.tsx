'use client';

import { useState } from 'react';
import { drawWinners, type Pick } from '@/lib/draw-math';

const SAMPLE = ['badger-of-ash.near', 'copperpaw.near', 'fennel-the-swift.near', 'greywhisker.near', 'hollow-hare.near', 'mudlark.near', 'nightbloom.near', 'old-tobias.near', 'quickfang.near', 'rusty-tail.near', 'silent-sable.near', 'thornfoot.near'];
const RPCS = ['https://rpc.mainnet.fastnear.com', 'https://free.rpc.fastnear.com'];

async function latestBlock(): Promise<{ height: number; hash: string } | null> {
  for (const url of RPCS) {
    try {
      const data = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'demo', method: 'block', params: { finality: 'final' } }) }).then(r => r.json());
      if (data?.result?.header) return { height: data.result.header.height, hash: data.result.header.hash };
    } catch { /* try the next one */ }
  }
  return null;
}

/** A live practice draw: a real, fresh NEAR block as the dice, 12 sample outlaws, every step shown. */
export default function DrawDemo() {
  const [block, setBlock] = useState<{ height: number; hash: string } | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function roll() {
    setBusy(true); setError(''); setPicks([]);
    const fresh = await latestBlock();
    if (!fresh) { setBusy(false); setError('The NEAR network did not answer. Try again in a moment.'); return; }
    setBlock(fresh);
    setPicks(await drawWinners(fresh.hash, 'weekly', SAMPLE, 5));
    setBusy(false);
  }

  const won = new Map<string, number>(picks.map(p => [p.account, p.round] as [string, number]));
  return <section className="raid-rules" aria-labelledby="demo-title">
    <h2 id="demo-title">Roll the dice yourself</h2>
    <p className="loot-lead">A practice draw. The 12 names below are <b>made up, not real holders</b>: the dice is real, the newest block of the NEAR blockchain. Roll again: a new block, new winners, and nobody could have known. In a real draw only holders who stayed above the minimum for 72 hours (120 for the Grand Prize) are on the list.</p>
    <div className="draw-demo">
      <button type="button" className="button" disabled={busy} onClick={() => void roll()}>{busy ? 'READING THE CHAIN…' : picks.length ? 'ROLL AGAIN' : 'ROLL THE DICE'}</button>
      {error && <p role="alert" className="wallet-error">{error}</p>}
      {block && <p className="draw-seed">Dice: NEAR block <a href={`https://nearblocks.io/blocks/${block.hash}`} target="_blank" rel="noopener noreferrer">#{block.height.toLocaleString('en-US')} ↗</a><br /><code>{block.hash}</code></p>}
      <p className="draw-sample-label">Sample outlaws · practice only</p>
      <ol className="draw-sample">{[...SAMPLE].sort().map((name, i) => <li key={name} className={won.has(name) ? 'is-winner' : undefined}><span>{i}</span>{name}{won.has(name) ? <b>{won.get(name) === 0 ? '🍀 Lucky Outlaw' : `🦊 winner ${Number(won.get(name)) + 1}`}</b> : null}</li>)}</ol>
      {picks.length > 0 && <ol className="draw-steps">{picks.map(p => <li key={p.round}>
        <b>Prize {p.round + 1}.</b> SHA-256(dice : weekly : {p.round}) = <code>{p.hash.slice(0, 12)}…</code>, as a number, divided by the {p.poolSize} outlaws left: remainder <b>{p.position}</b> → <b>{p.account}</b>
      </li>)}</ol>}
    </div>
  </section>;
}
