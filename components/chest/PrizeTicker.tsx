'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/** Live prize counter: what is in the Guild Chest now (read from the contract) plus the tax that trading has
 *  produced since the last deposit (estimated from the coin's hourly volume), ticking up between refreshes. */

interface Config { network: 'mainnet' | 'testnet'; contract: string; token?: string | null; symbol?: string; decimals?: number }
interface Chest { weekly_pot: string; grand_pot: string; next_draw_ms: number; next_draw_kind: string; last_tax_ms?: number }
interface Live { weeklyUsd: number; grandUsd: number; weeklyCoin: number; grandCoin: number; brewUsd: number; ratePerMs: number; at: number; nextKind: string; nextMs: number; symbol: string; priced: boolean }

const RPC = { mainnet: ['https://rpc.mainnet.fastnear.com', 'https://free.rpc.fastnear.com'], testnet: ['https://test.rpc.fastnear.com'] };
const TAX = 0.02, GUILD = 0.8, WEEKLY = 0.3, GRAND = 0.5;

async function view<T>(cfg: Config, method: string): Promise<T> {
  for (const url of RPC[cfg.network]) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'tick', method: 'query', params: { request_type: 'call_function', finality: 'final', account_id: cfg.contract, method_name: method, args_base64: btoa('{}') } }) }).then(r => r.json());
      const bytes = res?.result?.result as number[] | undefined;
      if (bytes) return JSON.parse(new TextDecoder().decode(Uint8Array.from(bytes))) as T;
    } catch { /* next */ }
  }
  throw new Error('no rpc');
}

/** USD price of a NEAR token from DexScreener (the most liquid NEAR pair where it is the base token). */
async function usdPrice(token: string): Promise<number | null> {
  try {
    const data = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(token)}`).then(r => r.json());
    const pairs = (data?.pairs ?? []) as Array<{ chainId: string; priceUsd?: string; baseToken?: { address: string }; liquidity?: { usd?: number } }>;
    const best = pairs.filter(p => p.chainId === 'near' && p.baseToken?.address === token && Number(p.priceUsd) > 0)
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
    return best ? Number(best.priceUsd) : null;
  } catch { return null; }
}

/** USD volume of our coin since `from`, and the recent rate (USD per ms), from hourly candles; DexScreener 24h as fallback. */
async function volumeSince(token: string, from: number): Promise<{ usd: number; rate: number } | null> {
  try {
    const pools = await fetch(`https://api.geckoterminal.com/api/v2/networks/near/tokens/${encodeURIComponent(token)}/pools?page=1`, { headers: { Accept: 'application/json' } }).then(r => r.json());
    const ids = ((pools?.data ?? []) as Array<{ attributes: { address: string } }>).slice(0, 3).map(p => p.attributes.address);
    let usd = 0, recent = 0, found = false;
    for (const id of ids) {
      const c = await fetch(`https://api.geckoterminal.com/api/v2/networks/near/pools/${encodeURIComponent(id)}/ohlcv/hour?aggregate=1&limit=192&currency=usd`, { headers: { Accept: 'application/json' } }).then(r => r.json());
      const rows = (c?.data?.attributes?.ohlcv_list ?? []) as number[][];
      for (const [ts, , , , , v] of rows) {
        found = true;
        const t = ts * 1000;
        if (t + 3600_000 > from) usd += Number(v) * Math.min(1, (t + 3600_000 - from) / 3600_000);
        if (t > Date.now() - 6 * 3600_000) recent += Number(v);
      }
    }
    if (found) return { usd, rate: recent / (6 * 3600_000) };
  } catch { /* fallback */ }
  try {
    const data = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(token)}`).then(r => r.json());
    const v24 = ((data?.pairs ?? []) as Array<{ chainId: string; volume?: { h24?: number } }>).filter(p => p.chainId === 'near').reduce((s, p) => s + (p.volume?.h24 ?? 0), 0);
    const rate = v24 / 864e5;
    return { usd: rate * Math.min(Date.now() - from, 7 * 864e5), rate };
  } catch { return null; }
}

const usd = (n: number) => `$${Math.floor(n).toLocaleString('en-US')}`;
const units = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: n < 100 ? 2 : 0 });

export default function PrizeTicker({ mainnetOnly = false, link = false }: { mainnetOnly?: boolean; link?: boolean }) {
  const [live, setLive] = useState<Live | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const cfgRef = useRef<Config | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!cfgRef.current) {
        for (const file of ['/chest.json', '/chest-testnet.json']) {
          const r = await fetch(file, { cache: 'no-store' }).catch(() => null);
          if (r?.ok) { cfgRef.current = await r.json(); break; }
        }
      }
      const cfg = cfgRef.current;
      if (!cfg || (mainnetOnly && cfg.network !== 'mainnet')) return;
      const chest = await view<Chest>(cfg, 'get_chest');
      const dec = cfg.token ? (cfg.decimals ?? 24) : 24;
      const toUnits = (raw: string) => Number(BigInt(raw) / BigInt(10) ** BigInt(Math.max(0, dec - 6))) / 1e6;
      const weeklyCoin = toUnits(chest.weekly_pot), grandCoin = toUnits(chest.grand_pot);
      let price: number | null = null, brewUsd = 0, ratePerMs = 0;
      if (cfg.network === 'mainnet') {
        price = await usdPrice(cfg.token || 'wrap.near');
        const raid = await fetch('/api/raid').then(r => r.json()).catch(() => null) as { token?: string } | null;
        if (raid?.token) {
          const from = Math.max(chest.last_tax_ms ?? 0, Date.now() - 7 * 864e5);
          const vol = await volumeSince(raid.token, from);
          if (vol) { brewUsd = vol.usd * TAX * GUILD; ratePerMs = vol.rate * TAX * GUILD; }
        }
      }
      if (!alive) return;
      setLive({
        weeklyCoin, grandCoin, priced: price !== null,
        weeklyUsd: weeklyCoin * (price ?? 0), grandUsd: grandCoin * (price ?? 0),
        brewUsd, ratePerMs, at: Date.now(), nextKind: chest.next_draw_kind, nextMs: chest.next_draw_ms,
        symbol: cfg.token ? (cfg.symbol ?? 'TOKEN') : 'NEAR',
      });
    }
    void load().catch(() => {});
    const id = setInterval(() => void load().catch(() => {}), 60_000);
    return () => { alive = false; clearInterval(id); };
  }, [mainnetOnly]);

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, []);
  if (!live) return null;

  // Between refreshes the tax keeps coming in at the recent trading rate.
  const brew = live.brewUsd + live.ratePerMs * Math.max(0, now - live.at);
  const weekly = live.weeklyUsd + brew * WEEKLY;
  const grand = live.grandUsd + brew * GRAND;
  const day = new Date(live.nextMs).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' });

  return <section className="prize-ticker" aria-label="Live prizes">
    <p className="eyebrow">LIVE · GROWING WITH EVERY TRADE</p>
    <div className="prize-ticker-row">
      <div className={live.nextKind === 'weekly' ? 'next' : ''}>
        <span>Weekly prize</span>
        <strong>{live.priced ? usd(weekly) : `${units(live.weeklyCoin)} ${live.symbol}`}</strong>
        {live.priced && <small>{units(live.weeklyCoin)} {live.symbol} in the chest</small>}
      </div>
      <div className={live.nextKind === 'grand' ? 'next' : ''}>
        <span>Grand Prize pot</span>
        <strong>{live.priced ? usd(grand) : `${units(live.grandCoin)} ${live.symbol}`}</strong>
        {live.priced && <small>{units(live.grandCoin)} {live.symbol} in the chest</small>}
      </div>
    </div>
    <p className="prize-ticker-note">
      Next draw: {live.nextKind === 'grand' ? 'the Grand Prize' : 'weekly'}, {day} at 20:00 UTC.
      {brew > 0 && <> Includes ≈{usd(brew)} of tax from trading since the last deposit, on its way to the chest.</>}
      {link && <> <Link href="/chest">Open the chest →</Link></>}
    </p>
  </section>;
}
