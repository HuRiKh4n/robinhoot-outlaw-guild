// RobinHoot "Hold & Win" draw. Runs in GitHub Actions; anyone can re-run it and get the same winners.
//
//   node scripts/draw.mjs                   -> the most recent Sunday 20:00 UTC draw; weekly or Grand Prize by the cycle
//   node scripts/draw.mjs auto 2026-11-08   -> a specific Sunday (re-check an old draw)
//   node scripts/draw.mjs monthly 2026-11-29 -> force the kind (monthly = Grand Prize)
//
// The cycle: every Sunday there is a draw. Counting from DRAW_CYCLE_START (set on the site), Sundays 1, 2 and 3
// are the weekly prize (3 winners), the 4th is the Grand Prize (5 winners), then it starts again.
//
// How it is fair:
// 1. The seed is the hash of the FIRST NEAR block produced at or after the draw time. Nobody can know it in advance.
// 2. Eligible = every holder whose balance never dropped below the minimum at the checkpoints of the last
//    72 h (weekly) or 120 h (Grand Prize): one every 6 hours plus 6 extra moments derived from the seed.
// 3. Tickets: by the LOWEST balance in the window, in dollars at this week's rate:
//    $50 = 1, $200 = 2, $300 = 3, $400 = 4, $500 = 5, $1,000 = 6, $2,000 = 7, $3,000 = 8, $4,000 = 9, $5,000+ = 10.
// 4. Winners: SHA-256(seed:kind:i) mod (tickets still in the pot) picks a ticket along the alphabetical list;
//    its holder wins and leaves the pot with all their tickets.
// 5. Outlaw rank bonus: Guild members (one outlaw per wallet, registered before the draw) get extra tickets
//    by how many days in a row they held at least this week's minimum, checked every day at 20:00 UTC:
//    Trench Rat +1, Outlaw (14 days) +2, Captain (30 days) +3, Legend (90 days) +5. Same as lib/raid/ranks.ts.
// 6. Linked wallets (sub-accounts of the same parent) are flagged for the founder's check before paying.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const SITE = process.env.SITE_URL || "https://www.robinhoot.fun";
const RPC = process.env.NEAR_ARCHIVAL_RPC_URL || "https://archival-rpc.mainnet.fastnear.com";
const HOLDERS_API = process.env.HOLDERS_API || "https://api.nearblocks.io/v1/fts";
const forced = ["weekly", "monthly"].includes(process.argv[2]) ? process.argv[2] : null;
let kind, HOLD_HOURS, WINNERS, SHARES;
function setKind(k) {
  kind = k;
  HOLD_HOURS = k === "monthly" ? 120 : 72;
  WINNERS = k === "monthly" ? 5 : 3;
  SHARES = k === "monthly" ? [50, 12.5, 12.5, 12.5, 12.5] : [40, 30, 30];
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const TIERS_USD = [50, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000];
/** Tickets for a lowest balance, with minRaw = the tokens worth $50 this week. */
const ticketsFor = (lowest, minRaw) => TIERS_USD.filter(usd => lowest * 50n >= minRaw * BigInt(usd)).length;
const sha = text => createHash("sha256").update(text).digest("hex");
const RANKS = [
  { name: "Legend", days: 90, bonus: 5 },
  { name: "Captain", days: 30, bonus: 3 },
  { name: "Outlaw", days: 14, bonus: 2 },
  { name: "Trench Rat", days: 0, bonus: 1 },
];
const rankFor = days => RANKS.find(r => days >= r.days);
const slug = text => String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function drawTime() {
  const arg = process.argv[3];
  if (arg) return Date.parse(`${arg}T20:00:00Z`);
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  let t = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day, 20);
  if (t > now.getTime()) t -= 7 * 864e5;
  return t;
}

async function rpc(method, params) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await fetch(RPC, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: "draw", method, params }) });
      if (response.status === 429) { await sleep(1000 * (attempt + 1)); continue; }
      return await response.json();
    } catch { await sleep(1000 * (attempt + 1)); }
  }
  throw new Error(`RPC ${method} failed`);
}

const blocks = new Map();
async function block(height) {
  if (blocks.has(height)) return blocks.get(height);
  const data = await rpc("block", height === undefined ? { finality: "final" } : { block_id: height });
  const header = data.result?.header;
  const found = header ? { height: header.height, hash: header.hash, time: Number(BigInt(header.timestamp_nanosec) / 1000000n) } : null;
  if (height !== undefined) blocks.set(height, found);
  return found;
}
/** The last block at or before `time`. */
async function blockAtOrBefore(time, head) {
  let guess = head, perBlock = 600;
  for (let round = 0; round < 6; round++) {
    let target = Math.max(1, Math.round(guess.height - (guess.time - time) / perBlock));
    let next = null;
    for (let step = 0; !next && step < 20; step++) next = await block(target - step);
    if (next.height !== guess.height) perBlock = Math.max(200, Math.abs((guess.time - next.time) / (guess.height - next.height)));
    guess = next;
    if (Math.abs(guess.time - time) < 30_000) break;
  }
  while (guess.time > time) { let prev = null; for (let h = guess.height - 1; !prev; h--) prev = await block(h); guess = prev; }
  for (;;) { let next = null; let h = guess.height + 1; for (let tries = 0; !next && tries < 20; tries++, h++) next = await block(h); if (!next || next.time > time) return guess; guess = next; }
}
/** The first block at or after `time`: the seed. */
async function firstBlockAfter(time, head) {
  const before = await blockAtOrBefore(time, head);
  if (before.time === time) return before;
  for (let h = before.height + 1; h < before.height + 200; h++) { const b = await block(h); if (b) return b; }
  throw new Error("Seed block not found");
}

async function balance(token, account, height) {
  const args = Buffer.from(JSON.stringify({ account_id: account })).toString("base64");
  const data = await rpc("query", { request_type: "call_function", block_id: height, account_id: token, method_name: "ft_balance_of", args_base64: args });
  if (data.error || data.result?.error) {
    if (/UNKNOWN_ACCOUNT|CodeDoesNotExist|does not exist/i.test(JSON.stringify(data.error ?? data.result.error))) return 0n;
    throw new Error(`balance ${account}`);
  }
  return BigInt(JSON.parse(Buffer.from(data.result.result).toString("utf8")));
}

async function holders(token) {
  const out = new Set();
  for (let page = 1; page <= 100; page++) {
    const response = await fetch(`${HOLDERS_API}/${token}/holders?page=${page}&per_page=100`, { headers: { Accept: "application/json" } });
    if (response.status === 429) { await sleep(15000); page--; continue; }
    if (!response.ok) throw new Error(`holders API ${response.status}`);
    const data = await response.json();
    const rows = data.holders ?? data.data ?? [];
    for (const row of rows) { const id = row.account ?? row.account_id ?? row.holder; if (id) out.add(String(id)); }
    if (rows.length < 100) break;
    await sleep(1500);
  }
  return [...out];
}

async function main() {
  const rules = await fetch(`${SITE}/api/raid`).then(r => r.json());
  if (!rules.open || !rules.token || !rules.minRaw) throw new Error(`Draw closed: ${rules.reason ?? "no token configured"}`);
  const min = BigInt(rules.minRaw);
  const excluded = new Set(rules.excluded ?? []);
  const T = drawTime();
  if (new Date(T).getUTCDay() !== 0) throw new Error("Draws happen on Sundays");
  if (forced) setKind(forced);
  else {
    if (!rules.cycleStart) throw new Error("DRAW_CYCLE_START is not set on the site");
    const weeks = Math.round((T - Date.parse(`${rules.cycleStart}T20:00:00Z`)) / (7 * 864e5));
    if (weeks < 0) throw new Error("The draw cycle has not started yet");
    setKind(weeks % 4 === 3 ? "monthly" : "weekly");
  }
  const head = await block();
  if (head.time < T) throw new Error("The draw time has not come yet");
  const seed = await firstBlockAfter(T, head);
  const snapshot = await blockAtOrBefore(T, head);
  const from = T - HOLD_HOURS * 3600_000;

  // Checkpoints: every 6 h across the window (draw time included) + 6 moments derived from the seed.
  const times = [];
  for (let h = 0; h <= HOLD_HOURS; h += 6) times.push(from + h * 3600_000);
  for (let i = 0; i < 6; i++) times.push(from + Number(BigInt("0x" + sha(`${seed.hash}:check:${i}`)) % BigInt(HOLD_HOURS * 3600_000)));
  times.sort((a, b) => b - a); // newest first: fail fast
  const checkpoints = [];
  for (const t of times) checkpoints.push(t === T ? snapshot : await blockAtOrBefore(t, head));

  const candidates = (await holders(rules.token)).filter(a => !excluded.has(a)).sort();
  console.log(`${candidates.length} holders, ${checkpoints.length} checkpoints, minimum ${rules.minTokens}`);
  const eligible = [];
  for (const account of candidates) {
    let lowest = null;
    for (const cp of checkpoints) {
      const b = await balance(rules.token, account, cp.height);
      if (lowest === null || b < lowest) lowest = b;
      if (b < min) break;
    }
    if (lowest !== null && lowest >= min) eligible.push({ account, base: ticketsFor(lowest, min) });
  }

  // Outlaw rank bonus for Guild members registered before the draw.
  let registry = [];
  try { registry = (await fetch(`${SITE}/api/outlaws`).then(r => r.json())).outlaws ?? []; } catch { console.log("Outlaw registry unavailable: no rank bonus this time"); }
  const outlaws = new Map(registry.filter(o => Date.parse(o.since) < T).map(o => [o.account, o]));
  const dayBlocks = new Map();
  const dayBlock = async d => { if (!dayBlocks.has(d)) dayBlocks.set(d, await blockAtOrBefore(T - d * 864e5, head)); return dayBlocks.get(d); };
  for (const e of eligible) {
    const o = outlaws.get(e.account);
    e.tickets = e.base;
    if (!o) continue;
    let days = 0;
    for (let d = 1; d <= RANKS[0].days; d++) {
      const b = await balance(rules.token, e.account, (await dayBlock(d)).height);
      if (b < min) break;
      days = d;
    }
    const rank = rankFor(days);
    e.rank = rank.name; e.streakDays = days; e.bonus = rank.bonus; e.tickets = e.base + rank.bonus;
    e.outlaw = {
      name: o.name, species: o.species, class: o.class,
      portrait: o.portrait ? `${SITE}/api/outlaws/portrait?account=${encodeURIComponent(o.account)}&v=${o.portrait}` : `${SITE}/characters/${slug(o.species)}/${slug(o.class)}/${slug(o.outfit)}.webp`,
    };
  }
  eligible.sort((a, b) => (a.account < b.account ? -1 : a.account > b.account ? 1 : 0));

  // Linked wallets: eligible sub-accounts that share a parent account (x.parent.near, y.parent.near).
  const parentOf = a => (a.split(".").length > 2 ? a.split(".").slice(1).join(".") : null);
  const byParent = new Map();
  for (const e of eligible) { const p = parentOf(e.account); if (p) byParent.set(p, [...(byParent.get(p) ?? []), e.account]); }
  const linked = [...byParent.values()].filter(group => group.length > 1);

  const pool = eligible.map(e => ({ ...e })), winners = [];
  for (let i = 0; i < WINNERS && pool.length; i++) {
    const total = pool.reduce((sum, e) => sum + e.tickets, 0);
    let ticket = Number(BigInt("0x" + sha(`${seed.hash}:${kind}:${i}`)) % BigInt(total));
    let index = 0;
    while (ticket >= pool[index].tickets) { ticket -= pool[index].tickets; index++; }
    const [won] = pool.splice(index, 1);
    winners.push({ account: won.account, tickets: won.tickets, ...(won.outlaw ? { outlaw: won.outlaw, rank: won.rank } : {}), share: Math.round(SHARES[i] * 100) / 100, title: i === 0 ? (kind === "monthly" ? "The Big Heist" : "The Lucky Outlaw") : undefined, check: `https://nearblocks.io/address/${won.account}` });
  }

  const date = new Date(T).toISOString().slice(0, 10);
  const result = {
    kind, prize: kind === "monthly" ? "Grand Prize" : "Weekly prize", date, drawTime: new Date(T).toISOString(), holdHours: HOLD_HOURS, minTokens: rules.minTokens, symbol: rules.symbol,
    seedBlock: { height: seed.height, hash: seed.hash, time: new Date(seed.time).toISOString() },
    snapshotBlock: snapshot.height, checkpoints: checkpoints.map(c => c.height).sort((a, b) => a - b),
    holdersChecked: candidates.length, guildMembers: eligible.filter(e => e.outlaw).length, totalTickets: eligible.reduce((s, e) => s + e.tickets, 0), eligible, linked, winners,
  };
  await mkdir("public/draws", { recursive: true });
  await writeFile(`public/draws/${kind}-${date}.json`, JSON.stringify(result, null, 2) + "\n");
  let index = [];
  try { index = JSON.parse(await readFile("public/draws/index.json", "utf8")); } catch {}
  index = [{ kind, date, file: `${kind}-${date}.json`, eligible: eligible.length, winners: winners.length }, ...index.filter(d => !(d.kind === kind && d.date === date))];
  await writeFile("public/draws/index.json", JSON.stringify(index, null, 2) + "\n");
  console.log(JSON.stringify({ seed: result.seedBlock, eligible: eligible.length, winners }, null, 2));
}

main().catch(error => { console.error(error.message); process.exit(1); });
