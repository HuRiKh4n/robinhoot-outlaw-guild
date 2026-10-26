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
// 3. Winners are picked from the alphabetical list of eligible accounts with SHA-256(seed:round:i).
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
const sha = text => createHash("sha256").update(text).digest("hex");

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
    let ok = true;
    for (const cp of checkpoints) { if ((await balance(rules.token, account, cp.height)) < min) { ok = false; break; } }
    if (ok) eligible.push(account);
  }
  eligible.sort();

  const pool = [...eligible], winners = [];
  for (let i = 0; i < WINNERS && pool.length; i++) {
    const pick = Number(BigInt("0x" + sha(`${seed.hash}:${kind}:${i}`)) % BigInt(pool.length));
    winners.push({ account: pool.splice(pick, 1)[0], share: Math.round(SHARES[i] * 100) / 100, title: i === 0 ? (kind === "monthly" ? "The Big Heist" : "The Lucky Outlaw") : undefined });
  }

  const date = new Date(T).toISOString().slice(0, 10);
  const result = {
    kind, prize: kind === "monthly" ? "Grand Prize" : "Weekly prize", date, drawTime: new Date(T).toISOString(), holdHours: HOLD_HOURS, minTokens: rules.minTokens, symbol: rules.symbol,
    seedBlock: { height: seed.height, hash: seed.hash, time: new Date(seed.time).toISOString() },
    snapshotBlock: snapshot.height, checkpoints: checkpoints.map(c => c.height).sort((a, b) => a - b),
    holdersChecked: candidates.length, eligible, winners,
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
