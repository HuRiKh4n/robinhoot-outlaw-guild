import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { guildDatabase, identityService } from "@/lib/identity/server";
import { IdentityError } from "@/lib/identity/core";
import { NearArchive } from "@/lib/raid/chain";
import { raidConfig } from "@/lib/raid/config";
import { checkAccount, checkpoints, raidRules } from "@/lib/raid/eligibility";
import { outlawRank } from "@/lib/raid/rank-check";
import { RULES, SOUL_V1 } from "./texts";

export type Kind = "mission" | "prompt";
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const DAY = 864e5;
export const PROMPT_PASS_SHARE = 0.6;
/** Minimum total weight for a SOUL change to pass (low before launch, when only Guild members vote). */
const promptMinWeight = (launched: boolean) => (launched ? 30 : 3);
const admins = () => (process.env.COUNCIL_ADMINS ?? "bl4ckdragon.near").split(",").map(a => a.trim()).filter(Boolean);
export const isAdmin = (account: string) => admins().includes(account);

/** Mission rounds close every Wednesday at 20:00 UTC; the winner is Tobias's mission until the next round closes. */
export function nextMissionClose(now = Date.now()) {
  const d = new Date(now);
  const daysToWed = (3 - d.getUTCDay() + 7) % 7;
  let close = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysToWed, 20);
  if (close <= now) close += 7 * DAY;
  return close;
}

interface Row { [key: string]: unknown }
const db = () => guildDatabase();

async function member(account: string) {
  const result = await db().query(
    "SELECT c.draft FROM outlaw_characters c JOIN near_accounts a ON a.id=c.owner_account WHERE a.account_id=$1 AND a.network='mainnet'",
    [account],
  );
  return result.rows[0] ?? null;
}

/** Voting weight = draw tickets: lowest balance over 72 h ($50 = 1 … $5,000+ = 10) + rank bonus, max 15.
 *  Before the coin launches, every Guild member weighs 1. */
export async function weightFor(account: string): Promise<{ weight: number; rank?: string; launched: boolean }> {
  if (!(await member(account))) throw new IdentityError(403, "Join the Guild with your outlaw first (Your Outlaw page).");
  const rules = await raidRules(Date.now(), 72);
  if (!rules.open || !rules.token || !rules.minRaw) return { weight: 1, launched: false };
  const archive = new NearArchive(raidConfig().rpc);
  const points = await checkpoints(archive, Date.now(), 72);
  const verdict = await checkAccount(archive, rules, points, account);
  if (!verdict.eligible) throw new IdentityError(403, `To vote, hold at least $${rules.minUsd} of the coin for 3 days. ${verdict.reason}`);
  const { rank } = await outlawRank(archive, rules.token, account, rules.minRaw);
  return { weight: Math.min(15, (verdict.tickets ?? 1) + rank.bonus), rank: rank.name, launched: true };
}

async function ensureSeed() {
  const found = await db().query("SELECT 1 FROM council_prompt_versions LIMIT 1");
  if (!found.rows.length)
    await db().query("INSERT INTO council_prompt_versions(version,text,sha256) VALUES(1,$1,$2) ON CONFLICT DO NOTHING", [SOUL_V1, sha(SOUL_V1)]);
}

interface Proposal { id: string; kind: Kind; title: string; body: string; author: string; opensAt: string; closesAt: string; status: string; vetoReason: string | null; for: number; against: number; voters: number; closed: boolean }

async function proposals(): Promise<Proposal[]> {
  const result = await db().query(
    `SELECT p.*, COALESCE(SUM(CASE WHEN v.choice='for' THEN v.weight END),0) AS w_for,
            COALESCE(SUM(CASE WHEN v.choice='against' THEN v.weight END),0) AS w_against, COUNT(v.account) AS voters
     FROM council_proposals p LEFT JOIN council_votes v ON v.proposal_id=p.id
     WHERE p.closes_at > now() - interval '60 days'
     GROUP BY p.id ORDER BY p.closes_at DESC, p.created_at`,
  );
  return result.rows.map((r: Row) => ({
    id: String(r.id), kind: r.kind as Kind, title: String(r.title), body: String(r.body), author: String(r.author_account),
    opensAt: new Date(r.opens_at as string).toISOString(), closesAt: new Date(r.closes_at as string).toISOString(),
    status: String(r.status), vetoReason: (r.veto_reason as string) ?? null,
    for: Number(r.w_for), against: Number(r.w_against), voters: Number(r.voters),
    closed: new Date(r.closes_at as string).getTime() <= Date.now(),
  }));
}

/** SOUL changes that closed with enough support become the next version (applied lazily, once). */
async function applyPassedPrompts(list: Proposal[], launched: boolean) {
  const passed = list.filter(p => p.kind === "prompt" && p.closed && p.status === "open"
    && p.for + p.against >= promptMinWeight(launched) && p.for / Math.max(1, p.for + p.against) >= PROMPT_PASS_SHARE)
    .sort((a, b) => a.closesAt.localeCompare(b.closesAt));
  for (const p of passed) {
    await db().query(
      `INSERT INTO council_prompt_versions(version,text,sha256,proposal_id)
       SELECT COALESCE(MAX(version),0)+1, $1, $2, $3 FROM council_prompt_versions
       WHERE NOT EXISTS (SELECT 1 FROM council_prompt_versions WHERE proposal_id=$3)`,
      [p.body, sha(p.body), p.id],
    );
  }
}

export async function councilState() {
  await ensureSeed();
  const rules = await raidRules(Date.now(), 72).catch(() => ({ open: false }));
  const launched = Boolean(rules.open);
  let list = await proposals();
  await applyPassedPrompts(list, launched);
  list = await proposals();
  const versions = (await db().query("SELECT version,text,sha256,proposal_id,approved_at FROM council_prompt_versions ORDER BY version DESC")).rows
    .map((r: Row) => ({ version: Number(r.version), text: String(r.text), sha256: String(r.sha256), proposalId: (r.proposal_id as string) ?? null, approvedAt: new Date(r.approved_at as string).toISOString() }));
  // The mission in force: the winner of the latest closed round (most weight; ties go to the earliest proposal).
  const closedRounds = [...new Set(list.filter(p => p.kind === "mission" && p.closed).map(p => p.closesAt))].sort().reverse();
  let mission: (Proposal & { round: string }) | null = null;
  for (const round of closedRounds) {
    const entries = list.filter(p => p.kind === "mission" && p.closesAt === round && p.status === "open" && p.for > 0);
    if (entries.length) { const best = [...entries].sort((a, b) => b.for - a.for)[0]; mission = { ...best, round }; break; }
  }
  const log = (await db().query("SELECT id,at,text,link FROM council_log ORDER BY at DESC LIMIT 30")).rows
    .map((r: Row) => ({ id: String(r.id), at: new Date(r.at as string).toISOString(), text: String(r.text), link: (r.link as string) || null }));
  return {
    launched, nextMissionClose: new Date(nextMissionClose()).toISOString(), promptPassShare: PROMPT_PASS_SHARE, promptMinWeight: promptMinWeight(launched),
    soul: versions[0], soulHistory: versions.slice(1).map(({ text: _text, ...rest }) => rest),
    rulesSha256: sha(RULES), mission, voting: list.filter(p => !p.closed), recent: list.filter(p => p.closed).slice(0, 20), log,
  };
}

/** Plain text for Tobias (IronClaw fetches this every run). */
export async function councilBrief() {
  const s = await councilState();
  const missions = s.voting.filter(p => p.kind === "mission" && p.status === "open");
  const prompts = s.voting.filter(p => p.kind === "prompt" && p.status === "open");
  return [
    `# Council brief · ${new Date().toISOString()}`,
    ``,
    `## SOUL in force: version ${s.soul.version} · sha256 ${s.soul.sha256}`,
    s.soul.text.trim(),
    ``,
    `## Mission this week`,
    s.mission ? `${s.mission.title}\n${s.mission.body}\n(voted by the Guild, round closed ${s.mission.round}, weight ${s.mission.for})` : `No mission voted yet. Keep the tavern warm: tell the tale, welcome newcomers, invite outlaws to propose a mission at https://www.robinhoot.fun/council.`,
    ``,
    `## Votes open now (round closes ${s.nextMissionClose})`,
    missions.length ? missions.map(p => `- Mission "${p.title}" by ${p.author}: ${p.for} votes`).join("\n") : `- No mission proposals yet.`,
    prompts.length ? prompts.map(p => `- SOUL change "${p.title}" by ${p.author}: ${p.for} for, ${p.against} against, closes ${p.closesAt}`).join("\n") : `- No SOUL changes proposed.`,
    ``,
    `## Fixed rules (sha256 ${s.rulesSha256}) live in AGENTS.md and are never voted.`,
  ].join("\n");
}

export async function propose(account: string, kind: Kind, title: string, body: string) {
  title = title.trim(); body = body.trim();
  if (!title || title.length > 80) throw new IdentityError(400, "Title: 1 to 80 characters.");
  const max = kind === "mission" ? 500 : 3000;
  if (body.length < 10 || body.length > max) throw new IdentityError(400, `Text: 10 to ${max} characters.`);
  if (!(await member(account))) throw new IdentityError(403, "Join the Guild with your outlaw first (Your Outlaw page).");
  const now = Date.now();
  const closes = kind === "mission" ? nextMissionClose(now) : now + 7 * DAY;
  if (!isAdmin(account)) {
    const recent = await db().query(
      "SELECT 1 FROM council_proposals WHERE author_account=$1 AND kind=$2 AND created_at > now() - ($3 || ' days')::interval",
      [account, kind, kind === "mission" ? "6" : "30"],
    );
    if (recent.rows.length) throw new IdentityError(429, kind === "mission" ? "One mission proposal per week each." : "One SOUL change per month each.");
    if (kind === "prompt") {
      const { launched, rank } = await weightFor(account);
      if (launched && !["Captain", "Legend"].includes(rank ?? "")) throw new IdentityError(403, "SOUL changes can be proposed by Captains and Legends.");
    }
  }
  const open = await db().query("SELECT COUNT(*) AS n FROM council_proposals WHERE kind='mission' AND closes_at=$1", [new Date(closes)]);
  if (kind === "mission" && Number(open.rows[0].n) >= 8) throw new IdentityError(429, "This round is full (8 missions). Vote for one of them.");
  const id = randomUUID();
  await db().query(
    "INSERT INTO council_proposals(id,kind,title,body,author_account,opens_at,closes_at) VALUES($1,$2,$3,$4,$5,now(),$6)",
    [id, kind, title, body, account, new Date(closes)],
  );
  return { id };
}

export async function vote(account: string, proposalId: string, choice: "for" | "against") {
  const found = await db().query("SELECT kind,closes_at,status FROM council_proposals WHERE id=$1", [proposalId]);
  const p = found.rows[0];
  if (!p) throw new IdentityError(404, "Proposal not found.");
  if (new Date(p.closes_at as string).getTime() <= Date.now()) throw new IdentityError(409, "This vote is closed.");
  if (p.status !== "open") throw new IdentityError(409, "This proposal was vetoed.");
  if (p.kind === "mission" && choice !== "for") throw new IdentityError(400, "Missions take votes for, not against.");
  const { weight } = await weightFor(account);
  await db().transaction(async sql => {
    // One mission per round: a new pick replaces the old one.
    if (p.kind === "mission")
      await sql.query(
        "DELETE FROM council_votes WHERE account=$1 AND proposal_id IN (SELECT id FROM council_proposals WHERE kind='mission' AND closes_at=$2)",
        [account, p.closes_at],
      );
    await sql.query(
      "INSERT INTO council_votes(proposal_id,account,choice,weight) VALUES($1,$2,$3,$4) ON CONFLICT(proposal_id,account) DO UPDATE SET choice=EXCLUDED.choice, weight=EXCLUDED.weight, created_at=now()",
      [proposalId, account, choice, weight],
    );
  });
  return { weight };
}

export async function veto(account: string, proposalId: string, reason: string) {
  if (!isAdmin(account)) throw new IdentityError(403, "Only the founder can veto.");
  if (reason.trim().length < 10) throw new IdentityError(400, "Give a public reason (10+ characters).");
  await db().query("UPDATE council_proposals SET status='vetoed', veto_reason=$2 WHERE id=$1", [proposalId, reason.trim().slice(0, 300)]);
}

export async function addLog(text: string, link?: string) {
  text = text.trim().slice(0, 400);
  if (!text) throw new IdentityError(400, "Empty log line.");
  const url = link && /^https:\/\/[^\s]+$/.test(link) ? link.slice(0, 300) : null;
  await db().query("INSERT INTO council_log(id,text,link) VALUES($1,$2,$3)", [randomUUID(), text, url]);
}

export async function votesOf(account: string) {
  const result = await db().query("SELECT proposal_id,choice,weight FROM council_votes WHERE account=$1", [account]);
  return result.rows.map((r: Row) => ({ proposalId: String(r.proposal_id), choice: String(r.choice), weight: Number(r.weight) }));
}

export { identityService };
