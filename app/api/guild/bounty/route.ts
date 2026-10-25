import { NextRequest } from "next/server";
import { handleIdentity } from "@/lib/identity/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) { return handleIdentity(request, "bounty"); }
export async function POST(request: NextRequest) { return handleIdentity(request, "bounty"); }
