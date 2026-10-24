import { NextRequest } from "next/server";
import { handleIdentity } from "@/lib/identity/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  return handleIdentity(request, "logout");
}
