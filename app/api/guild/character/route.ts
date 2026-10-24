import { NextRequest } from "next/server";
import { handleIdentity } from "@/lib/identity/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  return handleIdentity(request, "character");
}
export async function PUT(request: NextRequest) {
  return handleIdentity(request, "character");
}
