import { identityConfig } from "@/lib/identity/server";
import { councilState } from "@/lib/council/core";
import { failure, json } from "@/lib/council/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
/** Public state of the Council: SOUL in force (+ history), mission in force, open votes, log. */
export async function GET() {
  if (!identityConfig()) return json({ open: false });
  try { return json({ open: true, ...(await councilState()) }); } catch (error) { return failure(error); }
}
