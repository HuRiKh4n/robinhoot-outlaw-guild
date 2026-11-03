'use client';

import { useEffect, useState } from 'react';
import { useWalletState } from '@/hooks/useWalletState';

interface Config { network: 'mainnet' | 'testnet'; contract: string; drawer: string; dev: string; reserve: string }
interface Winner { account: string; tickets: number; amount: string }
interface Draw { index: number; kind: string; draw_time_ms: number; settled_ms: number; block: number; entries: number; tickets: number; list_hash: string; seed: string; prize: string; winners: Winner[] }
interface Chest {
  dev_wallet: string; reserve_wallet: string; drawer: string; cycle_start_ms: number;
  weekly_pot: string; grand_pot: string; next_draw_index: number; next_draw_ms: number; next_draw_kind: string; next_prize: string;
  taxed: string; to_dev: string; to_reserve: string; topped_up: string; paid: string; draws: number;
}

const RPC = { mainnet: ['https://rpc.mainnet.fastnear.com', 'https://free.rpc.fastnear.com'], testnet: ['https://test.rpc.fastnear.com', 'https://rpc.testnet.near.org'] };
const EXPLORER = { mainnet: 'https://nearblocks.io', testnet: 'https://testnet.nearblocks.io' };
const YOCTO = BigInt('1000000000000000000000000');

async function view<T>(cfg: Config, method: string, args: object = {}): Promise<T> {
  const argsB64 = btoa(JSON.stringify(args));
  for (const url of RPC[cfg.network]) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'chest', method: 'query', params: { request_type: 'call_function', finality: 'final', account_id: cfg.contract, method_name: method, args_base64: argsB64 } }) }).then(r => r.json());
      const bytes = res?.result?.result as number[] | undefined;
      if (bytes) return JSON.parse(new TextDecoder().decode(Uint8Array.from(bytes))) as T;
    } catch { /* try the next RPC */ }
  }
  throw new Error('NEAR did not answer.');
}

/** yoctoNEAR → "12.34" */
function near(yocto: string, digits = 2) {
  const v = BigInt(yocto || '0');
  const whole = v / YOCTO;
  const frac = ((v % YOCTO) * BigInt(10 ** digits)) / YOCTO;
  return `${whole.toLocaleString('en-US')}.${frac.toString().padStart(digits, '0')}`;
}
function toYocto(text: string) {
  const [w, f = ''] = text.trim().replace(',', '.').split('.');
  if (!/^\d+$/.test(w || '0') || !/^\d*$/.test(f)) return null;
  return (BigInt(w || '0') * YOCTO + BigInt((f + '0'.repeat(24)).slice(0, 24))).toString();
}
const short = (a: string) => a.length > 22 ? `${a.slice(0, 8)}…${a.slice(-8)}` : a;
const day = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export default function ChestLive() {
  const { connection, account } = useWalletState();
  const [cfg, setCfg] = useState<Config | null>(null);
  const [chest, setChest] = useState<Chest | null>(null);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      for (const file of ['/chest.json', '/chest-testnet.json']) {
        const r = await fetch(file, { cache: 'no-store' }).catch(() => null);
        if (r?.ok) { setCfg(await r.json()); return; }
      }
      setError('The chest is not deployed yet.');
    })();
  }, []);

  useEffect(() => {
    if (!cfg) return;
    let alive = true;
    const load = () => Promise.all([view<Chest>(cfg, 'get_chest'), view<Draw[]>(cfg, 'get_draws', { limit: 12 })])
      .then(([c, d]) => { if (alive) { setChest(c); setDraws(d); setError(''); } })
      .catch(() => { if (alive) setError('Could not read the chest from NEAR. Retrying…'); });
    void load();
    const id = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, [cfg, tick]);

  async function send() {
    if (!cfg || !connection || busy) return;
    const yocto = toYocto(amount);
    if (!yocto || BigInt(yocto) < YOCTO / BigInt(100)) { setNote('Enter at least 0.01 NEAR.'); return; }
    setBusy(true); setNote('Approve it in your wallet…');
    try {
      await connection.payCall(cfg.contract, 'deposit_tax', {}, yocto);
      setNote(`Sent ${amount} NEAR. The contract split it on the spot.`); setAmount(''); setTick(t => t + 1);
    } catch { setNote('Nothing was sent. The wallet closed or refused.'); }
    finally { setBusy(false); }
  }

  const ex = cfg ? EXPLORER[cfg.network] : '';
  return <>
    <section className="chest-live" aria-labelledby="chest-now">
      <h2 id="chest-now">Inside the chest right now {cfg?.network === 'testnet' && <small className="chest-tag">TESTNET DEMO</small>}</h2>
      {error && <p className="chest-note err">{error}</p>}
      {chest && cfg && <>
        <div className="chest-pots">
          <div><span>Weekly pot</span><strong>{near(chest.weekly_pot)} Ⓝ</strong><small>all of it goes to 3 holders every Sunday</small></div>
          <div className="big"><span>Grand Prize pot</span><strong>{near(chest.grand_pot)} Ⓝ</strong><small>60% goes to 5 holders every 4th Sunday</small></div>
          <div><span>Next draw</span><strong>{chest.next_draw_kind === 'grand' ? 'Grand Prize' : 'Weekly'}</strong><small>{day(chest.next_draw_ms)}, 20:00 UTC · prize {near(chest.next_prize)} Ⓝ</small></div>
        </div>
        <div className="chest-totals">
          <div><span>Tax received</span><b>{near(chest.taxed)} Ⓝ</b></div>
          <div><span>Paid to winners</span><b>{near(chest.paid)} Ⓝ</b></div>
          <div><span>To the dev (20%)</span><b>{near(chest.to_dev)} Ⓝ</b></div>
          <div><span>To the reserve</span><b>{near(chest.to_reserve)} Ⓝ</b></div>
          <div><span>Top-ups</span><b>{near(chest.topped_up)} Ⓝ</b></div>
          <div><span>Draws done</span><b>{chest.draws}</b></div>
        </div>
        <p className="chest-contract">Contract <a href={`${ex}/address/${cfg.contract}`} target="_blank" rel="noreferrer">{cfg.contract}</a> · no owner, no access keys, no withdraw.</p>
      </>}
      {!chest && !error && <p className="chest-note">Reading the chest from NEAR…</p>}
    </section>

    <section className="chest-live" aria-labelledby="chest-draws">
      <h2 id="chest-draws">Paid by the contract</h2>
      {draws.length === 0 && <p className="chest-note">No draw yet. The first one is on {chest ? day(chest.cycle_start_ms) : 'the first Sunday'} at 20:00 UTC.</p>}
      <ol className="chest-draws">
        {[...draws].reverse().map(d => <li key={d.index}>
          <header><b>{d.kind === 'grand' ? '👑 Grand Prize' : '🏹 Weekly'} #{d.index + 1}</b><span>{day(d.draw_time_ms)} · {d.entries} holders · {d.tickets} tickets</span></header>
          <ul>{d.winners.map((w, i) => <li key={i}><a href={`${ex}/address/${w.account}`} target="_blank" rel="noreferrer">{short(w.account)}</a><b>{near(w.amount)} Ⓝ</b></li>)}</ul>
          <p className="chest-proof">Block <a href={`${ex}/blocks/${d.block}`} target="_blank" rel="noreferrer">{d.block}</a> · seed {d.seed.slice(0, 16)}… · list {d.list_hash.slice(0, 16)}…</p>
        </li>)}
      </ol>
    </section>

    <section className="chest-live" aria-labelledby="chest-feed">
      <h2 id="chest-feed">Feed the chest</h2>
      <p className="chest-note">Anyone can send NEAR here. The contract splits it the moment it lands: 20% to the dev, then 30% weekly pot, 50% Grand Prize, 20% reserve.</p>
      {cfg && <div className="chest-send">
        {account ? <>
          <input inputMode="decimal" placeholder="NEAR amount" value={amount} onChange={e => setAmount(e.target.value)} aria-label="NEAR amount" />
          <button className="chest-btn" onClick={send} disabled={busy || cfg.network !== 'mainnet'}>{busy ? 'Waiting…' : 'Send to the Guild Chest'}</button>
        </> : <p className="chest-note">Connect a wallet (top right) to send.</p>}
      </div>}
      {cfg?.network === 'testnet' && <p className="chest-note">Sending opens when the mainnet chest is live.</p>}
      {note && <p className="chest-note">{note}</p>}
    </section>
  </>;
}
