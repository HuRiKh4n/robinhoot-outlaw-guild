import { NextResponse } from "next/server";
import { identityConfig, identityService } from "@/lib/identity/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Public registry of Guild outlaws: one per wallet. Read by the Sunday draw for rank bonus tickets. */
export async function GET() {
  if (!identityConfig()) return NextResponse.json({ open: false, outlaws: [] });
  try {
    const outlaws = await identityService().registry();
    return NextResponse.json({ open: true, count: outlaws.length, outlaws }, { headers: { "Cache-Control": "public, s-maxage=120" } });
  } catch {
    return NextResponse.json({ open: false, error: "registry unavailable", outlaws: [] }, { status: 503 });
  }
}
