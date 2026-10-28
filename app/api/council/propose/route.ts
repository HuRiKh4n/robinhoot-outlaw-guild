import { NextRequest } from "next/server";
import { propose } from "@/lib/council/core";
import { body, failure, json, signedIn } from "@/lib/council/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  try {
    const account = await signedIn(request);
    const data = await body(request);
    const kind = data.kind === "prompt" ? "prompt" : "mission";
    return json(await propose(account, kind, String(data.title ?? ""), String(data.body ?? "")));
  } catch (error) { return failure(error); }
}
