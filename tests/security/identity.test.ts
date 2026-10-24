import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { KeyPair } from "@near-js/crypto";
import { KeyPairSigner } from "@near-js/signers";
import { NextRequest } from "next/server";
import {
  GuildIdentity,
  IdentityError,
  hash,
  token,
  validSignature,
  type Database,
  type Proof,
} from "../../lib/identity/core";
import { mainnetKeyAuthorizer } from "../../lib/identity/rpc";
import { identityHandler } from "../../lib/identity/http";
import { defaultDraft } from "../../lib/profile/draft";

const origin = "https://guild.example",
  key = KeyPair.fromRandom("ed25519"),
  signer = new KeyPairSigner(key);
const otherKey = KeyPair.fromRandom("ed25519"),
  otherSigner = new KeyPairSigner(otherKey);
const db = new PGlite();
const database: Database = {
  async query(text, values) {
    return {
      rows: (await db.query(text, values)).rows as Record<string, unknown>[],
    };
  },
  transaction: (run) =>
    db.transaction(async (tx) =>
      run({
        async query(text, values) {
          return {
            rows: (await tx.query(text, values)).rows as Record<
              string,
              unknown
            >[],
          };
        },
      }),
    ),
};
let authorized = true;
const service = new GuildIdentity(database, origin, async () => authorized);
const draft = {
  ...defaultDraft,
  name: "Secure Wolf",
  species: "Wolf" as const,
  class: "Warrior" as const,
  outfit: "Royal Guard",
  personality: "Loyal" as const,
};
type Challenge = Awaited<ReturnType<GuildIdentity["issue"]>>;
async function proof(challenge: Challenge, second = false): Promise<Proof> {
  const signed = await (second ? otherSigner : signer).signNep413Message(
    challenge.message,
    challenge.accountId,
    challenge.recipient,
    Buffer.from(challenge.nonce, "base64"),
  );
  return {
    accountId: signed.accountId,
    publicKey: signed.publicKey.toString(),
    signature: Buffer.from(signed.signature).toString("base64"),
  };
}
async function login(account = "alpha.near", binding = token()) {
  const challenge = await service.issue(account, binding);
  return {
    binding,
    session: await service.complete(
      challenge.id,
      binding,
      await proof(challenge, account === "beta.near"),
    ),
  };
}
const rejects = (promise: Promise<unknown>, status: number) =>
  assert.rejects(
    promise,
    (error) => error instanceof IdentityError && error.status === status,
  );
before(async () => {
  await db.waitReady;
  await db.exec(await readFile("db/migrations/001_guild_identity.sql", "utf8"));
});
beforeEach(async () => {
  authorized = true;
  await db.exec(
    "TRUNCATE guild_users,near_accounts,identity_challenges,identity_sessions,outlaw_characters,character_revisions,identity_rate_limits CASCADE",
  );
});
after(() => db.close());

test("NEP-413 verification agrees with the official NEAR signer and rejects payload/key tampering", async () => {
  const challenge = await service.issue("alpha.near", token()),
    signed = await proof(challenge);
  assert.equal(
    validSignature(
      challenge.message,
      challenge.nonce,
      challenge.recipient,
      signed,
    ),
    true,
  );
  assert.equal(
    validSignature(
      challenge.message + "changed",
      challenge.nonce,
      challenge.recipient,
      signed,
    ),
    false,
  );
  assert.equal(
    validSignature(
      challenge.message,
      challenge.nonce,
      "attacker.example",
      signed,
    ),
    false,
  );
  assert.equal(
    validSignature(challenge.message, challenge.nonce, challenge.recipient, {
      ...signed,
      publicKey: "secp256k1:untrusted",
    }),
    false,
  );
});
test("valid proof creates one linked user/session; raw session token is not stored", async () => {
  const { session } = await login();
  assert.equal(
    (await service.session(session, "alpha.near")).account_id,
    "alpha.near",
  );
  assert.equal((await db.query("SELECT * FROM guild_users")).rows.length, 1);
  assert.equal((await db.query("SELECT * FROM near_accounts")).rows.length, 1);
  const sessions = await db.query<{ token_hash: string }>(
    "SELECT token_hash FROM identity_sessions",
  );
  assert.equal(sessions.rows[0].token_hash, hash(session));
  assert.notEqual(sessions.rows[0].token_hash, session);
});
test("a challenge is single-use even for concurrent valid proofs", async () => {
  const binding = token(),
    challenge = await service.issue("alpha.near", binding),
    signed = await proof(challenge);
  const result = await Promise.allSettled([
    service.complete(challenge.id, binding, signed),
    service.complete(challenge.id, binding, signed),
  ]);
  assert.equal(result.filter((item) => item.status === "fulfilled").length, 1);
  await rejects(service.complete(challenge.id, binding, signed), 401);
  assert.equal(
    (await db.query("SELECT * FROM identity_sessions")).rows.length,
    1,
  );
});
test("expired challenges, wrong browser binding, wrong account and wrong deployment cannot register", async () => {
  const binding = token(),
    challenge = await service.issue("alpha.near", binding),
    signed = await proof(challenge);
  await rejects(service.complete(challenge.id, token(), signed), 401);
  await rejects(
    service.complete(challenge.id, binding, {
      ...signed,
      accountId: "beta.near",
    }),
    401,
  );
  await rejects(
    new GuildIdentity(
      database,
      "https://other.example",
      async () => true,
    ).complete(challenge.id, binding, signed),
    401,
  );
  await db.query(
    "UPDATE identity_challenges SET expires_at=now()-interval '1 second'",
  );
  await rejects(service.complete(challenge.id, binding, signed), 401);
  assert.equal((await db.query("SELECT * FROM guild_users")).rows.length, 0);
});
test("unknown/revoked keys never create users; authorization failure burns the valid challenge", async () => {
  const binding = token(),
    challenge = await service.issue("alpha.near", binding);
  authorized = false;
  await rejects(
    service.complete(challenge.id, binding, await proof(challenge)),
    401,
  );
  authorized = true;
  await rejects(
    service.complete(challenge.id, binding, await proof(challenge)),
    401,
  );
  assert.equal((await db.query("SELECT * FROM guild_users")).rows.length, 0);
});
test("session expiry, logout and key revocation prevent reads and writes", async () => {
  const first = await login();
  await service.logout(first.session);
  await rejects(service.read(first.session, "alpha.near"), 401);
  const second = await login();
  await db.query(
    "UPDATE identity_sessions SET expires_at=now()-interval '1 second'",
  );
  await rejects(
    service.save(second.session, "alpha.near", draft, 0, true),
    401,
  );
  const third = await login();
  authorized = false;
  await rejects(service.read(third.session, "alpha.near"), 401);
  authorized = true;
  await rejects(service.read(third.session, "alpha.near"), 401);
});
test("account switching rotates sessions and never leaks or modifies another account character", async () => {
  const alpha = await login();
  await service.save(alpha.session, "alpha.near", draft, 0, true);
  await rejects(service.read(alpha.session, "beta.near"), 403);
  await rejects(service.save(alpha.session, "beta.near", draft, 0, true), 403);
  const beta = await login("beta.near", alpha.binding);
  await rejects(service.read(alpha.session, "alpha.near"), 401);
  assert.equal((await service.read(beta.session, "beta.near")).character, null);
  await rejects(service.save(beta.session, "alpha.near", draft, 1, true), 403);
});
test("imports require confirmation and optimistic revision checks; prior revisions remain intact", async () => {
  const { session } = await login();
  await rejects(service.save(session, "alpha.near", draft, 0, false), 400);
  assert.deepEqual(await service.save(session, "alpha.near", draft, 0, true), {
    revision: 1,
  });
  await rejects(
    service.save(
      session,
      "alpha.near",
      { ...draft, name: "Lost update" },
      0,
      true,
    ),
    409,
  );
  assert.deepEqual(
    await service.save(
      session,
      "alpha.near",
      { ...draft, name: "Reviewed replacement" },
      1,
      true,
    ),
    { revision: 2 },
  );
  const revisions = await db.query<{ draft: typeof draft }>(
    "SELECT draft FROM character_revisions ORDER BY revision",
  );
  assert.equal(revisions.rows.length, 2);
  assert.equal(revisions.rows[0].draft.name, draft.name);
  await rejects(
    service.save(
      session,
      "alpha.near",
      { ...draft, owner_account: "another-id" },
      2,
      true,
    ),
    400,
  );
  await rejects(
    service.save(
      session,
      "alpha.near",
      { ...draft, outfit: "Invalid" },
      2,
      true,
    ),
    400,
  );
});
test("concurrent character writes cannot silently overwrite a revision", async () => {
  const { session } = await login();
  await service.save(session, "alpha.near", draft, 0, true);
  const result = await Promise.allSettled([
    service.save(session, "alpha.near", { ...draft, name: "One" }, 1, true),
    service.save(session, "alpha.near", { ...draft, name: "Two" }, 1, true),
  ]);
  assert.equal(result.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(
    (await db.query("SELECT * FROM character_revisions")).rows.length,
    2,
  );
});
test("challenge quotas are database backed and never create unverified users", async () => {
  const binding = token();
  for (let i = 0; i < 12; i++) await service.issue("alpha.near", binding);
  await rejects(service.issue("alpha.near", binding), 429);
  assert.equal((await db.query("SELECT * FROM guild_users")).rows.length, 0);
});
test("RPC authorization queries final mainnet access-key state and rejects limited keys or outages", async () => {
  let permission: unknown = "FullAccess";
  let failure = false;
  const transport: typeof fetch = async (_url, init) => {
    if (JSON.parse(String(init?.body)).method === "status")
      return Response.json({ result: { chain_id: "mainnet" } });
    assert.deepEqual(JSON.parse(String(init?.body)).params, {
      request_type: "view_access_key",
      finality: "final",
      account_id: "alpha.near",
      public_key: "ed25519:key",
    });
    if (failure) throw new Error();
    return Response.json({
      result: { permission, block_height: 123, block_hash: "final" },
    });
  };
  const check = mainnetKeyAuthorizer("https://rpc.example", transport);
  assert.equal(await check("alpha.near", "ed25519:key"), true);
  const wrongNetwork = mainnetKeyAuthorizer("https://rpc.example", async () =>
    Response.json({ result: { chain_id: "testnet" } }),
  );
  await rejects(wrongNetwork("alpha.near", "ed25519:key"), 503);
  permission = { FunctionCall: { receiver_id: "contract.near" } };
  assert.equal(await check("alpha.near", "ed25519:key"), false);
  failure = true;
  await rejects(check("alpha.near", "ed25519:key"), 503);
});
function request(
  path: string,
  method = "POST",
  data?: unknown,
  cookie = "",
  account = "alpha.near",
  site = origin,
) {
  return new NextRequest(`${origin}/api/guild/${path}`, {
    method,
    headers: {
      Origin: site,
      "Content-Type": "application/json",
      "X-Guild-Account": account,
      Cookie: cookie,
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
}
test("HTTP flow issues Secure HttpOnly SameSite cookies; CSRF, anonymous writes and oversized data fail closed", async () => {
  const handler = identityHandler(
    () => ({ origin }),
    () => service,
  );
  assert.equal(
    (
      await identityHandler(
        () => null,
        () => service,
      )(request("challenge", "POST", { accountId: "alpha.near" }), "challenge")
    ).status,
    503,
  );
  assert.equal(
    (
      await handler(
        request(
          "challenge",
          "POST",
          { accountId: "alpha.near" },
          "",
          "alpha.near",
          "https://evil.example",
        ),
        "challenge",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handler(
        request("character", "PUT", {
          draft,
          expectedRevision: 0,
          confirmed: true,
        }),
        "character",
      )
    ).status,
    401,
  );
  const issued = await handler(
      request("challenge", "POST", { accountId: "alpha.near" }),
      "challenge",
    ),
    challenge = await issued.json();
  const binding = issued.cookies.get("__Host-rh-guild-binding")!.value,
    cookie = `__Host-rh-guild-binding=${binding}`;
  assert.equal(
    (
      await handler(
        request(
          "verify",
          "POST",
          { id: challenge.id, ...(await proof(challenge)) },
          cookie,
          "beta.near",
        ),
        "verify",
      )
    ).status,
    403,
  );
  const verified = await handler(
    request(
      "verify",
      "POST",
      { id: challenge.id, ...(await proof(challenge)) },
      cookie,
    ),
    "verify",
  );
  assert.equal(verified.status, 200);
  const header = verified.headers.get("set-cookie")!;
  for (const flag of [
    "HttpOnly",
    "Secure",
    "SameSite=strict",
    "Path=/",
    "Max-Age=43200",
  ])
    assert.ok(header.includes(flag));
  assert.ok(verified.headers.get("cache-control")!.includes("no-store"));
  assert.equal("token" in (await verified.json()), false);
  const session = verified.cookies.get("__Host-rh-guild-session")!.value;
  const stored = await handler(
    request(
      "character",
      "PUT",
      { draft, expectedRevision: 0, confirmed: true },
      `__Host-rh-guild-session=${session}`,
    ),
    "character",
  );
  assert.equal(stored.status, 200);
  assert.equal(
    (
      await handler(
        request(
          "character",
          "GET",
          undefined,
          `__Host-rh-guild-session=${session}`,
          "beta.near",
        ),
        "character",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handler(
        request("challenge", "POST", { accountId: "x".repeat(5000) }),
        "challenge",
      )
    ).status,
    413,
  );
});
