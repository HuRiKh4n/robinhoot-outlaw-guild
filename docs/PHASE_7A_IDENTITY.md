# Phase 7A — Secure Guild identity foundation

Status: implemented, gated and locally tested. **Persistent registration is not operational on the hosted preview.** No external database was provisioned, no production settings changed, and no real-wallet + hosted-database end-to-end acceptance test was performed. A server profile would be an off-chain application record, not an NFT, on-chain registration or guild membership.

## Architecture and hosting audit

The project uses Next.js 15.5 App Router, React 19 and a shared client WalletProvider. Home, My Outlaw and the six Bounty Board contracts remain intact. The character registry supplies all 12 Wolf images to previews and both PNG exports. Account-local drafts use namespaced localStorage, guests use sessionStorage; both remain untrusted local conveniences.

The repo has no prior database, authentication server, deployment-specific Vercel configuration or server sessions. Existing GitHub branch builds create Vercel previews. This revision adds Node.js route handlers and a PostgreSQL adapter suitable for serverless hosting; it does not provision infrastructure. A stable HTTPS preview hostname is required for cookies, challenge domains and consistent browser storage. Rotating deployment URLs are separate origins. Existing profiles and the cinematic Bounty Board are not redesigned.

## Meteor capability confirmed

Installed official `@meteorwallet/sdk@3.24.0` README documents `near::sign_message` for an already connected account and `near::sign_in_and_sign_message` for combined login. The declarations require message, recipient and a 32-byte nonce. Source paths implement NEP-413 in the web/extension client and normalize it for the mobile bridge. References:

- [Official SDK release documentation](https://www.npmjs.com/package/@meteorwallet/sdk/v/3.24.0)
- [NEP-413 signed message specification](https://github.com/near/NEPs/blob/master/neps/nep-0413.md)
- [Meteor integration/security documentation](https://github.com/Meteor-Wallet/meteor-public)

RobinHoot now has a narrowly scoped `signIdentityChallenge` method using **only** `near::sign_message`, after explicit user action on the separate identity page. Regular Connect Wallet still shares accounts only. No transaction, contract, function-call key, signing-key storage, callback URL or fee request is added. The rejecting keystore remains. There is no random/local-key fallback if Meteor does not support the action.

Capability in the SDK does not establish support in every installed wallet version. Physical Android Chrome Meteor Web/popup and mobile pairing/return, plus current desktop Meteor Web/extension, must still be accepted against a real configured backend. Cancellation, unsupported methods or wrong returned account fail closed. The foundation supports Ed25519 proofs backed by an **existing full-access account key**; function-call, secp256k1, multisig/contract-only and other unsupported proofs are rejected. Checking an existing key's FullAccess permission does **not** request adding or granting such a key.

## Implemented security flow

1. `POST /api/guild/challenge` accepts only an account ID. Exact configured Origin checking and bounded JSON input apply. PostgreSQL-backed account/browser/global quotas limit issuance. A server-generated 32-byte nonce, UUID, mainnet account, fixed recipient, origin and three-minute expiry define the server-stored message. The nonce is public, not a secret.
2. A random HttpOnly browser-binding cookie binds the challenge to this browser. The server stores its SHA-256 hash. Challenge data cannot be supplied or rewritten by the client; the server signs/verifies its stored payload.
3. Meteor explicitly prompts for an off-chain NEP-413 message. The account is checked before and after the prompt; switching aborts the old request. The recipient must match the page host.
4. `POST /api/guild/verify` verifies the NEP-413 Borsh encoding/tag and SHA-256 digest with Node Ed25519 verification. A test independently signs through the official NEAR signer. Wrong account, origin, browser binding, signature, expiration and used challenges are rejected.
5. A valid cryptographic challenge is consumed atomically **before** RPC and account creation. Concurrent proofs cannot reuse it. A subsequent RPC failure or authorization denial burns the challenge; retry requires a fresh one.
6. The trusted HTTPS RPC's `status` must identify mainnet (cached for five minutes). `query/view_access_key` at finality `final` must find that exact account/public key with FullAccess permission. Missing/limited keys fail; RPC failures fail closed. The same live key check occurs on every protected session/profile read/write, so key removal invalidates use of an existing session.
7. Only then are a Guild user, linked mainnet account and fresh opaque session created transactionally. Sessions last 12 hours without sliding renewal. The DB stores token hashes, not usable raw session tokens. Login rotates/revokes prior sessions for the same browser binding. Different accounts are not automatically linked to one user.
8. `__Host-rh-guild-session` and the browser-binding cookie are Secure, HttpOnly, SameSite=Strict, Path=/, with no Domain. State-changing requests require an exact Origin; no CORS allowance is provided. All API responses are no-store/private. Logout revokes the DB session and expires the session cookie.
9. Reads and writes require the session and expected account header to match. This header alone grants nothing. Ownership queries derive the account ID from the verified session, never a submitted owner/user/character ID. Wallet switching/disconnection clears the panel and triggers server logout when the feature is configured; login waits for pending logout to settle. A failed server sign-out is reported with a retry control rather than claiming the session was revoked; the separate server sign-out action can leave the account-only wallet connection intact.
10. Profile writes validate the five fields, require an explicit confirmation flag and expected revision, lock the session/current character and append an immutable-by-API revision in the same transaction. Concurrent stale writes return 409. No endpoint updates another account's character or a past revision.

## Data model and authorization

`db/migrations/001_guild_identity.sql` transactionally creates:

- `guild_users`: internal users.
- `near_accounts`: unique `(network, account_id)` linked to an internal user.
- `identity_challenges`: nonce, browser-binding hash, canonical payload, expiration and consumption.
- `identity_sessions`: hashed token, linked account, verified public key, expiry and revocation.
- `outlaw_characters`: one current five-field character per verified linked account, revision counter and schema version 1.
- `character_revisions`: append-only-by-API snapshots keyed by character/revision with schema version 1.
- `identity_rate_limits`: shared issuance quotas across server instances.

There is no browser database client or public database credential. Authorization is enforced by the server service, not claimed as PostgreSQL row-level security. Use a dedicated least-privilege runtime role, distinct from the migration owner. Grant SELECT/INSERT/UPDATE only as needed; grant character_revisions SELECT/INSERT only, never UPDATE/DELETE. The implementation needs DELETE on guild_users only to remove unused bootstrap rows during an account-insert race. Public table privileges are explicitly revoked. Database administrators still control retention/deletion; no immutable on-chain history is claimed.

## Local draft migration

`/guild-identity` is a separate opt-in page linked from My Outlaw. When unconfigured, it truthfully displays SERVER IDENTITY NOT CONFIGURED and no signing/import button. No user is registered by reading an account ID.

When configured, a verified session can review the connected account's browser-local draft, see the current server character/revision and explicitly confirm create/replace. Reading or connecting never uploads automatically. Existing server data is not silently replaced: confirmation plus an exact expected revision is required. A 409 requires reload/review. Previous server revisions are retained; the original browser-local data is never rewritten or deleted by this flow. Legacy local fields/outfit aliases are normalized on review using the existing parser.

The normal Character Creator remains local-first; authenticated server data is displayed on the identity page. Automatic server loading/synchronization inside the creator, portable backup/import, revision recovery and account recovery are Phase 7B product work, not operational features claimed here.

## Required external configuration — preview only first

1. Provision a managed PostgreSQL database with backups, a validated TLS certificate and a connection pooler compatible with transactions. Apply `001_guild_identity.sql` once using a separate migration/admin role. Do not run migrations in a request handler.
2. Create a restricted runtime role with the privileges above. Supply its credentials only in Vercel server-side environment variables. The pool is limited to three connections per instance; size global provider limits for serverless scale. URI SSL options cannot disable certificate validation. If needed supply the provider's trusted PEM CA via GUILD_DATABASE_CA.
3. Set DATABASE_URL, GUILD_AUTH_ORIGIN (one exact stable HTTPS origin, no trailing slash), NEAR_MAINNET_RPC_URL (trusted credential-protected mainnet HTTPS RPC) and optionally GUILD_DATABASE_CA for the **Preview** environment. Never use NEXT_PUBLIC_* for secrets. The example file has no credentials.
4. Rebuild the preview after setting environment variables. Keep GUILD_IDENTITY_ENABLED=false until schema, privilege, RPC and wallet acceptance checks are ready. Enabling requires all settings; missing/invalid configuration returns 503 and no session. Production remains disabled. Do not copy preview identities or cookies to production.
5. Configure Vercel/provider WAF limits for challenge/verification traffic, trusted client-IP handling and request limits before public activation. DB quotas are a foundation, not a complete abuse-protection service. Current quotas are deliberately conservative (12/account/browser and 300 global per 10 minutes); review capacity and account-targeted denial-of-service tradeoffs. No in-process limiter is relied on across Vercel instances.
6. Schedule a privileged cleanup job for expired challenges, revoked/expired sessions and rate buckets after defining retention. No public cleanup/admin endpoint is exposed. Define account deletion, backup retention and privacy/recovery policy before collecting real identities.

## Validation boundary

`npm run test:security` uses an embedded PostgreSQL engine (PGlite), real Ed25519 proofs from the official NEAR signer and actual service/HTTP-handler code. RPC authorization uses controlled responses. It covers replay/concurrency, expiration, domains/browser binding, key denial/revocation, session/logout/rotation, anonymous/cross-account writes, explicit imports, stale/concurrent revisions, quotas, chain/key RPC policy, cookie flags, CSRF and body size. This is not a live Meteor/hosted Postgres/Vercel end-to-end test.

Browser tests additionally verify that the default unconfigured page cannot register or request signatures, APIs fail closed without cookies, and local drafts survive. Full existing desktop/Android-emulated regression tests cover all 12 artworks, downloads, wallet, drafts and the untouched Bounty Board. No security tests use a real person's keys, seed phrases or private data.

## Exact Phase 7B next steps

1. Review this protocol, schema, dependency advisories and least-privilege grants; harden deployment abuse limits and monitoring without logging signatures/tokens/credentials.
2. Provision and migrate an isolated **preview** database, set its TLS/pooler and the exact preview origin/mainnet RPC, and configure retention/backup cleanup. Verify runtime permissions cannot rewrite historical revisions.
3. Enable the feature only on that controlled preview and complete the actual Meteor Web, desktop extension and physical Android bridge flows. Confirm the wallet shows exactly the server domain/account/expiry message with no transaction, AddKey, gas fee or private-key request. Confirm returned Ed25519 keys are active FullAccess keys on mainnet; unsupported variants stay rejected.
4. Test complete browser-to-Meteor-to-server-to-real-Postgres login, reload, two accounts/tabs/devices, delayed logout, key revocation, cookie expiry, replay races, database/RPC outages and restore from backups. Test real PostgreSQL row locks and constraints across multiple Vercel instances, not only the embedded test engine.
5. Complete creator-side authenticated load/save UX and explicit conflict/import/revision recovery flows without losing local drafts. Define linking/unlinking/recovery before exposing multi-wallet user linking. Add verified end-to-end browser coverage for the configured UI.
6. Only after those checks should persistent off-chain registration be described as operational. On-chain identity, NFT minting, token actions and rewards require separate authorization, contract design/testnet review and development; they are not part of 7B sign-in.

## Dependency audit

Production-only npm audit currently reports 3 moderate and 9 low affected-package entries (no high/critical), rooted in two inherited Meteor/NEAR dependency advisories: decode-uri-component denial-of-service [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) and elliptic [GHSA-848j-6mx2-7j84](https://github.com/advisories/GHSA-848j-6mx2-7j84). These are not twelve independent findings. New server Ed25519 verification uses Node crypto, but the wallet dependency chain still requires review before enabling public authentication. No blind force-fix or incompatible SDK downgrade is applied.
