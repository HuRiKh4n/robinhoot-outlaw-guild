import { NextRequest, NextResponse } from "next/server";
import { NearArchive } from "@/lib/raid/chain";
import { ACCOUNT_ID, raidConfig } from "@/lib/raid/config";
import { checkAccount, checkpoints, raidRules } from "@/lib/raid/eligibility";
import { outlawRank } from "@/lib/raid/rank-check";
import { identityConfig, identityService } from "@/lib/identity/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const MAX = 10;

/** Public, read-only: anyone can check any NEAR account against this week's raid rules. */
export async function POST(request: NextRequest) {
  let accounts: string[];
  let hours = 72;
  try {
    const body = await request.json();
    hours = body?.prize === 'monthly' || body?.prize === 'grand' ? 120 : 72;
    accounts = [...new Set((Array.isArray(body?.accounts) ? body.accounts : []).map((item: unknown) => String(item).trim().toLowerCase()).filter(Boolean))] as string[];
  } catch { return NextResponse.json({ error: "Send a list of NEAR accounts." }, { status: 400 }); }
  if (!accounts.length || accounts.length > MAX) return NextResponse.json({ error: `Send between 1 and ${MAX} accounts at a time.` }, { status: 400 });
  const bad = accounts.filter(account => !ACCOUNT_ID.test(account));
  if (bad.length) return NextResponse.json({ error: `Not a NEAR account: ${bad.slice(0, 3).join(", ")}` }, { status: 400 });
  try {
    const rules = await raidRules(Date.now(), hours);
    if (!rules.open) return NextResponse.json({ rules, results: accounts.map(account => ({ account, eligible: false, reason: rules.reason })) });
    const archive = new NearArchive(raidConfig().rpc);
    const points = await checkpoints(archive, Date.now(), hours);
    let members = new Map<string, { name: string; species: string }>();
    if (identityConfig()) {
      try { members = new Map((await identityService().registry()).map(o => [o.account, { name: o.name, species: o.species }])); } catch { /* ranks shown when the ledger is reachable */ }
    }
    const results = await Promise.all(accounts.map(async account => {
      const verdict = await checkAccount(archive, rules, points, account)
        .catch(() => ({ account, eligible: false, reason: "Could not read this account's history. Try again." } as Awaited<ReturnType<typeof checkAccount>>));
      const outlaw = members.get(account);
      if (!outlaw || !verdict.eligible || !rules.token || !rules.minRaw || accounts.length > 3) return { ...verdict, outlaw: outlaw ?? null };
      try {
        const { days, rank, next } = await outlawRank(archive, rules.token, account, rules.minRaw);
        return { ...verdict, outlaw, rank: { name: rank.name, icon: rank.icon, bonus: rank.bonus, days, next: next ? { name: next.name, inDays: next.days - days } : null }, tickets: (verdict.tickets ?? 0) + rank.bonus, baseTickets: verdict.tickets };
      } catch { return { ...verdict, outlaw }; }
    }));
    return NextResponse.json({ rules, checks: points.length, results }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The chain could not be read right now. Try again in a minute." }, { status: 503 });
  }
}
