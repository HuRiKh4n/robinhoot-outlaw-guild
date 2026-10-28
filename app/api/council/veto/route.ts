import { NextRequest } from "next/server";
import { veto } from "@/lib/council/core";
import { body, failure, json, signedIn } from "@/lib/council/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const account = await signedIn(request);
    const data = await body(request);
    await veto(account, String(data.proposalId ?? ""), String(data.reason ?? ""));
    return json({ vetoed: true });
  } catch (error) { return failure(error); }
}
