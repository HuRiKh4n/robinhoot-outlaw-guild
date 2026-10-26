import { NextResponse } from "next/server";
import { raidRules } from "@/lib/raid/eligibility";
import { raidConfig } from "@/lib/raid/config";
export const runtime = "nodejs";
export const revalidate = 1800;
export async function GET() {
  try { return NextResponse.json({ ...(await raidRules()), excluded: [...raidConfig().excluded] }); }
  catch { return NextResponse.json({ open: false, reason: "The raid ledger could not be read. Try again later." }, { status: 503 }); }
}
