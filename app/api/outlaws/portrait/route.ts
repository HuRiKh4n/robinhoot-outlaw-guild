import { NextRequest, NextResponse } from "next/server";
import { identityConfig, identityService } from "@/lib/identity/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** An outlaw's painted portrait: /api/outlaws/portrait?account=name.near */
export async function GET(request: NextRequest) {
  const account = request.nextUrl.searchParams.get("account") ?? "";
  if (!identityConfig()) return NextResponse.json({ error: "not open" }, { status: 404 });
  try {
    const found = await identityService().portraitOf(account);
    if (!found) return NextResponse.json({ error: "no portrait" }, { status: 404 });
    return new NextResponse(new Uint8Array(found.image), { headers: { "Content-Type": found.contentType, "Cache-Control": "public, s-maxage=300, max-age=60", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "no portrait" }, { status: 404 });
  }
}
