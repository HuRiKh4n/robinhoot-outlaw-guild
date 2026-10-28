import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { addLog } from "@/lib/council/core";
import { body, failure, json } from "@/lib/council/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Tobias reports what he did for the mission. Header x-council-agent must match COUNCIL_AGENT_TOKEN. */
export async function POST(request: NextRequest) {
  const expected = process.env.COUNCIL_AGENT_TOKEN ?? "";
  const given = request.headers.get("x-council-agent") ?? "";
  if (expected.length < 24 || given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected)))
    return json({ error: "Not Tobias." }, 401);
  try {
    const data = await body(request);
    await addLog(String(data.text ?? ""), typeof data.link === "string" ? data.link : undefined);
    return json({ logged: true });
  } catch (error) { return failure(error); }
}
