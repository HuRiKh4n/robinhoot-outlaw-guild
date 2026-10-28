import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { IdentityError } from "@/lib/identity/core";
import { identityConfig, identityService } from "@/lib/identity/server";

const headers = { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" };
export const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers });

/** The signed-in Guild member behind this request (same session as Your Outlaw). */
export async function signedIn(request: NextRequest): Promise<string> {
  const config = identityConfig();
  if (!config) throw new IdentityError(503, "The Council opens with the Guild ledger.");
  if (request.method !== "GET" && request.headers.get("origin") !== config.origin) throw new IdentityError(403, "Origin rejected.");
  const token = request.cookies.get("__Host-rh-guild-session")?.value ?? "";
  const expected = request.headers.get("x-guild-account") ?? "";
  const session = await identityService().session(token, expected);
  return session.account_id;
}

export async function body(request: NextRequest): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > 8000) throw new IdentityError(413, "Too long.");
  try { const value = JSON.parse(text); if (value && typeof value === "object" && !Array.isArray(value)) return value; } catch { /* below */ }
  throw new IdentityError(400, "Invalid request.");
}

export function failure(error: unknown) {
  const known = error instanceof IdentityError;
  return json({ error: known ? error.message : "The Council is unavailable right now. Try again." }, known ? error.status : 503);
}
