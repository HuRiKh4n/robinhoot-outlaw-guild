# Wallet-associated Outlaw identity: audit and next phase

Reviewed October 23, 2026. Current implementation is a local character prototype, not an authenticated identity service or guild registration.

## Already functional

- `lib/near/wallet.ts` dynamically initializes Meteor SDK 3.24.0 on mainnet. Account-only `near::sign_in` omits function-call keys, contracts and message parameters. A rejecting keystore prevents app use of NEAR signing keys; key-bearing accounts are rejected on connection and excluded from restoration. Bridge transport identities are distinct from account access keys. No signing or transaction API is exposed by the application wrapper.
- `WalletProvider` supplies one active account to the header and editor. Restoration, account switching, local disconnect, cancellation and storage errors are supported. External mobile pairing depends on Meteor services; real Android handoff remains a device acceptance check.
- Connected characters use `localStorage` key `robinhoot:profile:v1:mainnet:<encoded accountId>`. All five selections (name, species, class, outfit, personality) persist across browser sessions on the same origin/browser profile. A fresh keyed editor per account prevents previous state being saved under another account. Disconnect keeps account drafts and restores the separate guest draft.
- Guests use tab-scoped `sessionStorage` key `robinhoot:outlaw-draft`. No automatic cross-account copying, server upload or cross-device synchronization occurs. Preview URLs/origins and separate browsers do not share storage. Clearing site data, private browsing expiry or storage failures can lose drafts.
- The parser accepts only creator fields and allowlisted values, reads old animal/trait fields and Ranger aliases, normalizes invalid class outfits and retains valid choices. Stored account IDs and profiles are untrusted; anyone with browser access can edit them. No privileges depend on these values.
- All 12 exact Wolf variants use one resolver for live preview, profile, Wanted Poster and exports. Passport account display is opt-in and shortened. Download readiness is tied to current selections; unavailable or failed art never silently uses another class.

## Safe improvements in this revision

1. Verify replacement Warrior originals as genuine PNG signatures at unchanged case-sensitive paths, retain original bytes/dimensions, update source checksums and restore strict PNG-only build validation. Browser tests verify all 12 decoded sources and both actual PNG exports per variant.
2. Offer **USE GUEST CHARACTER FOR THIS ACCOUNT** only when the connected account has no saved draft and a guest draft exists. Copying is explicit; it preserves the guest original and saves the normalized five-field character locally under the active mainnet account. Existing account drafts are never deliberately replaced. Storage is checked again on click to catch intervening saves; this is not a transactional multi-tab conflict-resolution service.
3. Report storage failure without changing the selected character or claiming a save. Existing save, switch and disconnect behavior remains unchanged. No new schema/key is needed and there is no destructive migration.
4. Test full character restoration in a fresh browser context with persisted local storage but no guest session storage, without another wallet login. Test no-overwrite and storage-failure paths in desktop and Android-sized Chromium.

## Security boundaries and limitations

Account association is an editable local convenience, not cryptographic authentication, ownership proof, reputation, holder gating or membership. Neither wallet metadata nor a downloaded PNG can authorize server or contract operations. The current wallet flow must not be described as signed login. Existing Meteor dependency limitations are recorded in [METEOR_REVIEW.md](METEOR_REVIEW.md); this review is not an independent audit of the entire SDK.

No automatic guest promotion, destructive migration, new signing prompt, chain call, token approval, paid service or NFT minting is introduced. Guest drafts remain tab-only. Cross-tab edits to existing drafts remain last-write-wins; cross-device backup and recovery are not implemented. Never store secrets in character metadata or export a wallet's SDK/bridge storage as a profile backup.

## Recommended next development steps (not implemented)

1. Define a versioned, portable character document containing the five creator fields and stable asset-registry IDs. Keep account/network association separate from immutable character content. Specify validation, migration, retention, deletion and recovery. Keep reading v1 browser keys until any explicitly reviewed migration is recoverable.
2. Add a clearly local profile backup/import workflow if portability is needed before authentication. Validate size, schema and registry references, preview changes and require explicit overwrite consent. Export character data only, never wallet/bridge state. No wallet signature is needed for this local feature.
3. For future server-backed identities, first review the product and security requirements and obtain authorization for a separate authenticated phase. Use an audited wallet challenge protocol (for example NEP-413) with server-issued single-use nonce, expected recipient/domain, expiration, replay protection, account/public-key verification and secure session cookies. Account-only connection alone is insufficient. No such request is allowed in this phase.
4. Design account linking, unlinking, recovery, authorization and server-side schema checks before cross-device storage. Prevent account IDs supplied by a browser from selecting another user's record. Treat public artwork IDs as catalogue references, not proof of asset ownership.
5. If on-chain identity is later explicitly authorized, define whether it is a registry or NFT, review contract design, upgrades, metadata integrity/availability, revocation/transfer rules, privacy, storage deposits and user-visible fees. Test on testnet and audit contracts before any mainnet use. Public personal data cannot be assumed erasable.
6. Keep minting/registration a separate, explicit, informed transaction flow. Default to no persistent access key; any future permission must be narrowly scoped and independently reviewed. Clearly distinguish local draft, server-verified identity and on-chain registration in UI and exports; show an on-chain claim only after verifying a confirmed contract record.
7. Validate physical Android Chrome with top-level HTTPS: real Meteor pairing/handoff, session return, account switching, browser restart, storage denial, and device Downloads behavior. Current automation mocks external wallet responses while running the real SDK and production app.
