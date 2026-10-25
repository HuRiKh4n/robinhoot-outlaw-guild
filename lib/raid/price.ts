import "server-only";

/** Monday 00:00 UTC of the current raid week. */
export function weekStart(now = Date.now()) {
  const date = new Date(now);
  const day = (date.getUTCDay() + 6) % 7;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day);
}

interface PriceAnswer { usd: number; source: string; days: number }

/** Average daily close over the 7 days before the raid week started (GeckoTerminal),
 *  so the threshold stays the same all week and cannot be moved by one pump.
 *  Falls back to the current DexScreener price in the token's first week. */
export async function weeklyPrice(token: string, start: number): Promise<PriceAnswer | null> {
  try {
    const pools = await fetch(`https://api.geckoterminal.com/api/v2/networks/near/tokens/${encodeURIComponent(token)}/pools?page=1`,
      { headers: { Accept: "application/json" }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) }).then(r => r.ok ? r.json() : null);
    const pool = pools?.data?.[0]?.attributes?.address as string | undefined;
    if (pool) {
      const url = `https://api.geckoterminal.com/api/v2/networks/near/pools/${encodeURIComponent(pool)}/ohlcv/day?aggregate=1&limit=7&currency=usd&token=${encodeURIComponent(token)}&before_timestamp=${Math.floor(start / 1000)}`;
      const candles = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) }).then(r => r.ok ? r.json() : null);
      const closes = ((candles?.data?.attributes?.ohlcv_list ?? []) as number[][]).map(row => Number(row[4])).filter(value => value > 0);
      if (closes.length >= 3) return { usd: closes.reduce((a, b) => a + b, 0) / closes.length, source: "7-day average (GeckoTerminal)", days: closes.length };
    }
  } catch { /* fall through */ }
  try {
    const data = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(token)}`,
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) }).then(r => r.ok ? r.json() : null);
    const pair = (data?.pairs ?? []).find((item: { chainId?: string; priceUsd?: string }) => item.chainId === "near" && Number(item.priceUsd) > 0);
    if (pair) return { usd: Number(pair.priceUsd), source: "current price (DexScreener), first week", days: 0 };
  } catch { /* no price */ }
  return null;
}
