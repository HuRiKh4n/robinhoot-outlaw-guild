import { NextRequest } from "next/server";
import { isAdmin, votesOf, weightFor } from "@/lib/council/core";
import { failure, json, signedIn } from "@/lib/council/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
/** My votes and my voting weight (signed-in Guild member). */
export async function GET(request: NextRequest) {
  try {
    const account = await signedIn(request);
    const [votes, weight] = await Promise.all([votesOf(account), weightFor(account).catch(e => ({ error: e instanceof Error ? e.message : "No weight" }))]);
    return json({ account, admin: isAdmin(account), votes, ...weight });
  } catch (error) { return failure(error); }
}
