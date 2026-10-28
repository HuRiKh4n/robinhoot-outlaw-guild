import "server-only";
import { NearArchive } from "./chain";
import { RANKS, rankFor, STREAK_MAX_DAYS, type Rank } from "./ranks";

/** Daily 20:00 UTC moments going back from the last one before `now`. */
function dailyMoments(now: number, days: number) {
  const d = new Date(now);
  let last = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 20);
  if (last > now) last -= 864e5;
  return Array.from({ length: days }, (_, i) => last - i * 864e5);
}

async function inBatches<T, R>(items: T[], size: number, run: (item: T) => Promise<R>, stop?: (result: R) => boolean): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const part = await Promise.all(items.slice(i, i + size).map(run));
    for (const result of part) { out.push(result); if (stop?.(result)) return out; }
  }
  return out;
}

/** Days in a row (up to 90) the account held at least `minRaw`, checked daily at 20:00 UTC, and the rank it gives. */
export async function outlawRank(archive: NearArchive, token: string, account: string, minRaw: string, now = Date.now()): Promise<{ days: number; rank: Rank; next?: Rank }> {
  const min = BigInt(minRaw);
  const head = await archive.block();
  const heights = await inBatches(dailyMoments(now, STREAK_MAX_DAYS), 15, async at => (await archive.blockAt(at, head)).height);
  let days = 0;
  await inBatches(heights, 15, async height => (await archive.balance(token, account, height)) >= min, ok => !ok).then(results => {
    for (const ok of results) { if (!ok) break; days++; }
  });
  const rank = rankFor(days);
  const next = RANKS.find(r => r.days > days);
  return { days, rank, next };
}
