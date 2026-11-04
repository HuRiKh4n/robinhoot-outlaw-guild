'use client';

import { useEffect, useState } from 'react';

interface Wallet { name: string; use: string; address: string | null }
interface Coin { id: string; symbol: string; decimals: number; supply?: bigint }
const RPC = ['https://rpc.mainnet.fastnear.com', 'https://free.rpc.fastnear.com'];

async function call(account: string, method: string, args: object) {
  for (const url of RPC) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'books', method: 'query', params: { request_type: 'call_function', finality: 'final', account_id: account, method_name: method, args_base64: btoa(JSON.stringify(args)) } }) }).then(x => x.json());
      if (r?.result?.result) return JSON.parse(new TextDecoder().decode(Uint8Array.from(r.result.result as number[])));
      if (r?.error || r?.result?.error) return null;
    } catch { /* next */ }
  }
  return null;
}
async function coin(id: string): Promise<Coin | null> {
  const meta = await call(id, 'ft_metadata', {});
  if (!meta) return null;
  const supply = await call(id, 'ft_total_supply', {});
  return { id, symbol: meta.symbol, decimals: meta.decimals, supply: supply ? BigInt(supply) : undefined };
}
function show(raw: bigint, decimals: number) {
  const n = Number(raw / BigInt(10) ** BigInt(Math.max(0, decimals - 4))) / 1e4;
  return n.toLocaleString('en-US', { maximumFractionDigits: n >= 1000 ? 0 : 2 });
}

/** The public wallets with their live balances: the meme coin (and its share of the supply) and the prize coin. */
export default function OpenBooks({ wallets }: { wallets: Wallet[] }) {
  const [coins, setCoins] = useState<{ meme?: Coin | null; prize?: Coin | null }>({});
  const [bal, setBal] = useState<Record<string, { meme?: bigint; prize?: bigint }>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const raid = await fetch('/api/raid').then(r => r.json()).catch(() => null) as { token?: string } | null;
      const chest = await fetch('/chest.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null) as { token?: string | null } | null;
      const meme = raid?.token ? await coin(raid.token) : null;
      const prize = chest?.token ? await coin(chest.token) : null;
      if (!alive) return;
      setCoins({ meme, prize });
      const out: Record<string, { meme?: bigint; prize?: bigint }> = {};
      await Promise.all(wallets.filter(w => w.address).map(async w => {
        const a = w.address!;
        const [m, p] = await Promise.all([
          meme ? call(meme.id, 'ft_balance_of', { account_id: a }) : null,
          prize ? call(prize.id, 'ft_balance_of', { account_id: a }) : null,
        ]);
        out[a] = { meme: m != null ? BigInt(m) : undefined, prize: p != null ? BigInt(p) : undefined };
      }));
      if (alive) setBal(out);
    })().catch(() => {});
    return () => { alive = false; };
  }, [wallets]);

  return <div className="loot-wallets">{wallets.map(w => {
    const b = w.address ? bal[w.address] : undefined;
    const pct = coins.meme?.supply && b?.meme !== undefined ? Number(b.meme * BigInt(1_000_000) / coins.meme.supply) / 10_000 : null;
    return <article key={w.name}>
      <h3>{w.name}</h3>
      <p>{w.use}</p>
      {w.address
        ? <>
          <a href={`https://nearblocks.io/address/${w.address}`} target="_blank" rel="noopener noreferrer">{w.address} ↗</a>
          {b && <dl className="loot-balance">
            {coins.meme && b.meme !== undefined && <div><dt>{coins.meme.symbol}</dt><dd>{show(b.meme, coins.meme.decimals)}{pct !== null && <small> · {pct.toLocaleString('en-US', { maximumFractionDigits: 2 })}% of supply</small>}</dd></div>}
            {coins.prize && b.prize !== undefined && <div><dt>{coins.prize.symbol}</dt><dd>{show(b.prize, coins.prize.decimals)}</dd></div>}
          </dl>}
          <span className="loot-never">Never in the draws</span>
        </>
        : <span className="loot-soon">Address published at launch</span>}
    </article>;
  })}</div>;
}
