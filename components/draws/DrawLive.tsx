'use client';

import { useEffect, useRef, useState } from 'react';

type Kind = 'weekly' | 'monthly';
interface Draw { kind: Kind; date: string; eligible: Array<string | { account: string }>; seedBlock: { height: number; hash: string }; winners: Array<{ account: string; share: number; title?: string; outlaw?: { name: string; species: string; portrait: string } }> }
const RPCS = ['https://rpc.mainnet.fastnear.com', 'https://free.rpc.fastnear.com'];

/** Next Sunday 20:00 UTC (or the one just passed, within the last 6 hours). */
function nextSunday(now: number) {
  const d = new Date(now);
  let t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - d.getUTCDay(), 20);
  if (t + 6 * 3600_000 < now) t += 7 * 864e5;
  return t;
}
/** Sundays 1-3 of every 4 since the cycle start: weekly; the 4th: Grand Prize. */
function kindOf(t: number, cycleStart: string | null): Kind {
  if (!cycleStart) return 'weekly';
  const weeks = Math.round((t - Date.parse(`${cycleStart}T20:00:00Z`)) / (7 * 864e5));
  return weeks >= 0 && weeks % 4 === 3 ? 'monthly' : 'weekly';
}

async function rpcBlock(params: object) {
  for (const url of RPCS) {
    try {
      const data = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'live', method: 'block', params }) }).then(r => r.json());
      const h = data?.result?.header;
      if (h) return { height: h.height as number, hash: h.hash as string, time: Number(BigInt(h.timestamp_nanosec) / BigInt(1000000)) };
      if (data?.error) return null;
    } catch { /* next */ }
  }
  return null;
}
/** The first block at or after `time`, found from the browser in a handful of calls. */
async function firstBlockAfter(time: number) {
  const head = await rpcBlock({ finality: 'final' });
  if (!head || head.time < time) return null;
  let guess = head;
  for (let i = 0; i < 6 && Math.abs(guess.time - time) > 3000; i++) {
    let next = null;
    for (let step = 0; !next && step < 10; step++) next = await rpcBlock({ block_id: Math.round(guess.height - (guess.time - time) / 600) - step });
    if (!next) break; guess = next;
  }
  while (guess.time >= time) { const prev = await rpcBlock({ block_id: guess.height - 1 }); if (!prev || prev.time < time) break; guess = prev; }
  while (guess.time < time) { let next = null; for (let h = guess.height + 1; !next; h++) next = await rpcBlock({ block_id: h }); guess = next; }
  return guess;
}

const pad = (n: number) => String(n).padStart(2, '0');
function Clock({ ms }: { ms: number }) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const parts: Array<[string, number]> = [['days', Math.floor(s / 86400)], ['hours', Math.floor(s / 3600) % 24], ['min', Math.floor(s / 60) % 60], ['sec', s % 60]];
  return <div className="live-clock" role="timer">{parts.map(([label, value]) => <div key={label}><strong>{pad(value)}</strong><span>{label}</span></div>)}</div>;
}

export default function DrawLive() {
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState<boolean | null>(null);
  const [cycleStart, setCycleStart] = useState<string | null>(null);
  const [dice, setDice] = useState<{ height: number; hash: string } | null>(null);
  const [draw, setDraw] = useState<Draw | null>(null);
  const [shown, setShown] = useState(0);
  const [spinner, setSpinner] = useState('');
  const fetching = useRef(false);

  // Before the first draw Sunday, count down to it (not to the Sundays before it).
  const firstDraw = cycleStart ? Date.parse(`${cycleStart}T20:00:00Z`) : 0;
  const target = Math.max(nextSunday(now), firstDraw);
  const isFirst = Boolean(cycleStart) && target === firstDraw;
  const kind = kindOf(target, cycleStart);
  let grandIn = 0;
  while (grandIn < 4 && kindOf(target + grandIn * 7 * 864e5, cycleStart) !== 'monthly') grandIn++;
  const date = new Date(target).toISOString().slice(0, 10);
  const live = now >= target;

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { fetch('/api/raid').then(r => r.json()).then(r => { setOpen(Boolean(r.open && r.cycleStart)); setCycleStart(r.cycleStart ?? null); }).catch(() => setOpen(false)); }, []);

  // At zero: cast the dice live, then wait for the guild's result and reveal it.
  useEffect(() => {
    if (!live || !open || fetching.current) return;
    fetching.current = true;
    (async () => {
      for (let tries = 0; !dice && tries < 20; tries++) { const b = await firstBlockAfter(target); if (b) { setDice(b); break; } await new Promise(r => setTimeout(r, 3000)); }
      for (let tries = 0; tries < 180; tries++) {
        try {
          const index: Array<{ kind: Kind; date: string; file: string }> = await fetch('/draws/index.json', { cache: 'no-store' }).then(r => r.json());
          const entry = index.find(e => e.kind === kind && e.date === date);
          if (entry) { setDraw(await fetch(`/draws/${entry.file}`, { cache: 'no-store' }).then(r => r.json())); return; }
        } catch { /* keep waiting */ }
        await new Promise(r => setTimeout(r, 30000));
      }
    })();
  }, [live, open, target, kind, date, dice]);

  // Reveal the winners one by one, names spinning like a slot machine.
  useEffect(() => {
    if (!draw || shown >= draw.winners.length) return;
    const names = draw.eligible.length ? draw.eligible.map(e => typeof e === 'string' ? e : e.account) : draw.winners.map(w => w.account);
    const spin = setInterval(() => setSpinner(names[Math.floor(Math.random() * names.length)]), 70);
    const stop = setTimeout(() => { clearInterval(spin); setShown(n => n + 1); }, 2200);
    return () => { clearInterval(spin); clearTimeout(stop); };
  }, [draw, shown]);

  const title = kind === 'monthly' ? 'The Grand Prize' : 'The weekly draw';
  return <section className="live-draw" aria-live="polite">
    <p className="loot-card-kicker">{isFirst && kind === 'weekly' ? 'The first draw' : title}</p>
    {!live && <>
      <Clock ms={target - now} />
      <p className="live-when">{new Date(target).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC</p>
      {open && kind === 'weekly' && grandIn < 4 && <p className="live-next">The Grand Prize comes in <b>{grandIn} {grandIn === 1 ? 'Sunday' : 'Sundays'}</b></p>}
      {open === false && <p className="live-next">The first draw comes the first Sunday after the coin is live.</p>}
    </>}
    {live && open && <>
      {!dice && <p className="live-status">Casting the dice…</p>}
      {dice && <p className="live-status">The dice has been cast: NEAR block <a href={`https://nearblocks.io/blocks/${dice.hash}`} target="_blank" rel="noopener noreferrer">#{dice.height.toLocaleString('en-US')}</a><br /><code>{dice.hash}</code></p>}
      {dice && !draw && <p className="live-status live-pulse">The guild is counting the holders who stayed…</p>}
      {draw && <ol className="live-winners">
        {draw.winners.slice(0, shown).map((w, i) => <li key={w.account} className="is-in"><span>{i === 0 ? (kind === 'monthly' ? '👑' : '🍀') : '🦊'}</span>{w.outlaw && <img className="draw-outlaw" src={w.outlaw.portrait} alt="" width={56} height={84} />}{w.outlaw ? `${w.outlaw.name} the ${w.outlaw.species} · ${w.account}` : w.account}{w.title ? <em>{w.title}</em> : null}</li>)}
        {shown < draw.winners.length && <li className="is-spinning"><span>🎲</span>{spinner}</li>}
      </ol>}
    </>}
    {live && open === false && <p className="live-next">No coin, no draw yet. The first one comes the first Sunday after launch.</p>}
  </section>;
}
