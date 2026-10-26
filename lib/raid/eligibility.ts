import "server-only";
import { NearArchive } from "./chain";
import { raidConfig } from "./config";
import { weekStart, weeklyPrice } from "./price";

export interface RaidRules {
  open: boolean;
  reason?: string;
  token?: string;
  symbol?: string;
  decimals?: number;
  minUsd: number;
  holdHours: number;
  weekStartsAt: number;
  priceUsd?: number;
  priceSource?: string;
  minTokens?: string;      // whole tokens, for display
  minRaw?: string;         // smallest units, for checks
}

const pow10 = (n: number) => BigInt(10) ** BigInt(n);

/** This week's rules: the USD threshold turned into a fixed token amount for the whole week. */
export async function raidRules(now = Date.now(), holdHours = 72): Promise<RaidRules> {
  const config = raidConfig();
  const base = { minUsd: config.minUsd, holdHours, weekStartsAt: weekStart(now) };
  if (!config.token) return { ...base, open: false, reason: "The raid opens after $RHOOT launches." };
  const archive = new NearArchive(config.rpc);
  const meta = await archive.metadata(config.token);
  let wholeTokens: bigint;
  let priceUsd: number | undefined, priceSource: string;
  if (config.manualTokens) {
    wholeTokens = BigInt(config.manualTokens);
    priceSource = "set by the guild";
  } else {
    const price = await weeklyPrice(config.token, base.weekStartsAt);
    if (!price) return { ...base, open: false, token: config.token, reason: "No market price yet for $RHOOT." };
    priceUsd = price.usd;
    priceSource = price.source;
    // Round up to a tidy number so the threshold reads well: 2 significant digits.
    const raw = Math.ceil(config.minUsd / price.usd);
    const magnitude = 10 ** Math.max(0, String(raw).length - 2);
    wholeTokens = BigInt(Math.ceil(raw / magnitude) * magnitude);
  }
  return {
    ...base, open: true, token: config.token, symbol: meta.symbol, decimals: meta.decimals,
    priceUsd, priceSource, minTokens: wholeTokens.toString(), minRaw: (wholeTokens * pow10(meta.decimals)).toString(),
  };
}

export interface Checkpoint { at: number; height: number; kind: "fixed" | "random" }

/** 13 fixed checkpoints (every 6 h across the last 72 h, now included) + 6 random ones nobody can predict. */
export async function checkpoints(archive: NearArchive, now = Date.now(), holdHours = 72): Promise<Checkpoint[]> {
  const config = raidConfig();
  const head = await archive.block();
  const end = Math.min(now, head.time);
  const from = end - holdHours * 3600_000;
  const times: Array<{ at: number; kind: Checkpoint["kind"] }> = [];
  for (let h = 0; h <= holdHours; h += config.fixedEveryHours) times.push({ at: from + h * 3600_000, kind: "fixed" });
  for (let i = 0; i < config.randomChecks; i++) times.push({ at: from + Math.floor(Math.random() * (end - from)), kind: "random" });
  times.sort((a, b) => a.at - b.at);
  const found: Checkpoint[] = [];
  for (const time of times) {
    const block = await archive.blockAt(time.at, head);
    found.push({ at: block.time, height: block.height, kind: time.kind });
  }
  return found;
}

export interface Verdict {
  account: string;
  eligible: boolean;
  reason: string;
  balanceNow?: string;        // whole tokens, rounded down
  heldHours?: number;         // how long the balance has stayed above the threshold, by fixed checkpoints
  lowest?: string;            // lowest balance seen, whole tokens
}

export async function checkAccount(archive: NearArchive, rules: RaidRules, points: Checkpoint[], account: string): Promise<Verdict> {
  const config = raidConfig();
  if (!rules.open || !rules.token || !rules.minRaw) return { account, eligible: false, reason: rules.reason ?? "Raid closed." };
  if (config.excluded.has(account)) return { account, eligible: false, reason: "Excluded account (contract, pool or exchange)." };
  const min = BigInt(rules.minRaw);
  const shown = `${Number(rules.minTokens).toLocaleString('en-US')} $${rules.symbol}`;
  const unit = pow10(rules.decimals ?? 18);
  // Newest first: shows the current balance and how long it has been held, then stops at the first miss.
  const ordered = [...points].sort((a, b) => b.at - a.at);
  let lowest: bigint | undefined;
  let heldSince = ordered[0].at;
  let balanceNow: bigint | undefined;
  for (const point of ordered) {
    const balance = await archive.balance(rules.token, account, point.height);
    balanceNow ??= balance;
    if (lowest === undefined || balance < lowest) lowest = balance;
    if (balance < min) {
      const heldHours = Math.max(0, Math.floor((ordered[0].at - heldSince) / 3600_000));
      return { account, eligible: false, balanceNow: (balanceNow / unit).toString(), heldHours, lowest: (lowest / unit).toString(),
        reason: balanceNow < min ? `Holds less than ${shown}.` : `Below ${shown} about ${heldHours} h ago: needs ${rules.holdHours} h in a row.` };
    }
    heldSince = point.at;
  }
  return { account, eligible: true, balanceNow: (balanceNow! / unit).toString(), heldHours: rules.holdHours, lowest: (lowest! / unit).toString(),
    reason: `Held at least ${shown} at all ${points.length} checks over ${rules.holdHours} h.` };
}
