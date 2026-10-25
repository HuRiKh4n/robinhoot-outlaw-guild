import { NextResponse } from "next/server";
import { raidRules } from "@/lib/raid/eligibility";
export const runtime = "nodejs";
export const revalidate = 1800;
export async function GET() {
  try { return NextResponse.json(await raidRules()); }
  catch { return NextResponse.json({ open: false, reason: "The raid ledger could not be read. Try again later." }, { status: 503 }); }
}
