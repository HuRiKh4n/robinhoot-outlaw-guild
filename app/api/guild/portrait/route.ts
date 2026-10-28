import { NextRequest } from "next/server";
import { handleIdentity } from "@/lib/identity/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
/** Paint my outlaw's unique portrait (signed-in Guild session required). */
export async function POST(request: NextRequest) { return handleIdentity(request, "portrait"); }
