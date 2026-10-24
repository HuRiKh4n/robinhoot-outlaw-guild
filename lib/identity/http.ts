import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { IdentityError, SESSION_SECONDS, token } from "./core";
import { identityConfig, identityService } from "./server";
const bindingName = "__Host-rh-guild-binding";
const sessionName = "__Host-rh-guild-session";
const options = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/",
};
const headers = {
  "Cache-Control": "no-store, private",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
};
async function body(request: NextRequest) {
  if (
    !request.headers.get("content-type")?.startsWith("application/json") ||
    Number(request.headers.get("content-length") ?? 0) > 4096
  )
    throw new IdentityError(400, "Invalid request.");
  const reader = request.body?.getReader();
  if (!reader) throw new IdentityError(400, "Invalid request.");
  let size = 0;
  const parts: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 4096) {
        await reader.cancel();
        throw new IdentityError(413, "Request too large.");
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const value = JSON.parse(Buffer.concat(parts).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new IdentityError(400, "Invalid request.");
  }
}
function fields(data: Record<string, unknown>, names: string[]) {
  if (Object.keys(data).sort().join() !== names.sort().join())
    throw new IdentityError(400, "Invalid request fields.");
}
export function identityHandler(
  getConfig: () => { origin: string } | null = identityConfig,
  getService = identityService,
) {
  return async function handleIdentity(
    request: NextRequest,
    action: "challenge" | "verify" | "session" | "character" | "logout",
  ) {
    try {
      const config = getConfig();
      if (!config)
        throw new IdentityError(
          503,
          "Guild identity is not configured. Local drafts remain available.",
        );
      if (
        request.method !== "GET" &&
        request.headers.get("origin") !== config.origin
      )
        throw new IdentityError(403, "Origin rejected.");
      const service = getService(),
        session = request.cookies.get(sessionName)?.value ?? "",
        expected = request.headers.get("x-guild-account") ?? "";
      const response = (value: unknown) =>
        NextResponse.json(value, { headers });
      if (action === "challenge") {
        const data = await body(request);
        fields(data, ["accountId"]);
        if (expected !== data.accountId)
          throw new IdentityError(403, "Selected account mismatch.");
        const previous = request.cookies.get(bindingName)?.value;
        const binding =
          previous && /^[\w-]{43}$/.test(previous) ? previous : token();
        const result = response(await service.issue(data.accountId, binding));
        result.cookies.set(bindingName, binding, {
          ...options,
          maxAge: SESSION_SECONDS,
        });
        return result;
      }
      if (action === "verify") {
        const data = await body(request);
        fields(data, ["id", "accountId", "publicKey", "signature"]);
        if (expected !== data.accountId)
          throw new IdentityError(403, "Selected account mismatch.");
        const binding = request.cookies.get(bindingName)?.value;
        if (
          !binding ||
          typeof data.id !== "string" ||
          typeof data.accountId !== "string" ||
          typeof data.publicKey !== "string" ||
          typeof data.signature !== "string"
        )
          throw new IdentityError(401, "Invalid proof.");
        const value = await service.complete(data.id, binding, {
          accountId: data.accountId,
          publicKey: data.publicKey,
          signature: data.signature,
        });
        const result = response({
          accountId: data.accountId,
          authenticated: true,
          onChain: false,
        });
        result.cookies.set(sessionName, value, {
          ...options,
          maxAge: SESSION_SECONDS,
        });
        return result;
      }
      if (action === "logout") {
        if (session) await service.logout(session);
        const result = response({ authenticated: false });
        result.cookies.set(sessionName, "", { ...options, maxAge: 0 });
        return result;
      }
      if (action === "session") {
        const current = await service.session(session, expected);
        return response({
          accountId: current.account_id,
          authenticated: true,
          onChain: false,
        });
      }
      if (request.method === "GET")
        return response(await service.read(session, expected));
      const data = await body(request);
      fields(data, ["draft", "expectedRevision", "confirmed"]);
      return response(
        await service.save(
          session,
          expected,
          data.draft,
          data.expectedRevision,
          data.confirmed,
        ),
      );
    } catch (error) {
      const known = error instanceof IdentityError;
      return NextResponse.json(
        {
          error: known
            ? error.message
            : "Guild identity is temporarily unavailable.",
        },
        { status: known ? error.status : 503, headers },
      );
    }
  };
}
export const handleIdentity = identityHandler();
