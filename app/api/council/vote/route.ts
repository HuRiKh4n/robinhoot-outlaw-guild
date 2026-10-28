import { NextRequest } from "next/server";
import { vote } from "@/lib/council/core";
import { body, failure, json, signedIn } from "@/lib/council/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  try {
    const account = await signedIn(request);
    const data = await body(request);
    const id = String(data.proposalId ?? "");
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: "Invalid proposal." }, 400);
    const choice = data.choice === "against" ? "against" : "for";
    return json(await vote(account, id, choice));
  } catch (error) { return failure(error); }
}
