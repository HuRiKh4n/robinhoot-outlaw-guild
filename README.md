# RobinHoot — The Outlaw Guild

Responsive NEAR-community website built with Next.js App Router, React 19 and TypeScript.

## Run locally

Use Node.js 22 or 24 and npm:

```bash
npm ci
npm run dev
```

Open http://localhost:3000. No environment variables or API keys are needed.

## Implemented

- Original landing page, manifesto, five-chapter roadmap and responsive design
- Local character creator with class, species, outfit, personality and emoji poster previews
- Outlaw Profile preview/edit section, with browser-local drafts separated by mainnet wallet account
- Separate tab-persistent unconnected draft mode
- Mainnet account-only connection through the official Meteor SDK 3.24.0
- Account display, session restoration, switching through reconnection and disconnect
- Desktop Meteor Web/extension options and Android Meteor Web/mobile pairing options
- Accessible RobinHoot dialog, SDK popup handoff, retryable cancellation and storage errors

MyNearWallet has been removed. The legacy Meteor Wallet Selector adapters still depend on older SDKs; they do not expose the new supported account-only API. This revision uses the official Meteor SDK directly instead. See [the integration investigation](docs/METEOR_REVIEW.md) for official sources, inspected code paths, permissions and compatibility limitations.

## Outlaw Profile prototype (Issue #2)

Open **Outlaw Profile** from desktop navigation or **View your Outlaw Profile** below the creator. Edit the creator to update both the WANTED poster and profile preview; **Edit Profile** returns focus to the name field.

Wallet drafts are stored under versioned, network/account-specific localStorage keys. Connecting or switching loads that account's own draft, never copies another wallet's or the unconnected draft. Disconnect returns to the separate guest draft in sessionStorage. Returning to an account restores its local draft. Existing tab drafts are accepted as unconnected drafts only. Stored values are validated against the creator choices; extra fields are discarded.

These are editable local prototypes: a connected wallet is **NOT authenticated ownership**, and profiles are **NOT registered on-chain or server-verified**. Local data grants no reputation or membership. Drafts are not shared across devices, can be altered or lost when browser storage is cleared, and are not backed up. Separate tabs editing the same account do not merge changes; reload to read the latest stored draft. If storage is unavailable, the creator still works for the current visit and reports that edits cannot be saved.

The mobile wallet header truncates account IDs on one line while exposing the full ID to assistive technology and the wallet dialog. All wallet actions remain account-only; no persistence server, points, missions, signing, access keys or approvals were added.

## Connection security

RobinHoot requests only `near::sign_in` with the NEAR mainnet network target. It supplies no function-call-key definition, legacy contract or message parameters. It never calls transaction, signing, account-transfer or ownership-verification actions. A rejecting keystore prevents NEAR authorization-key storage; only account-only sessions are displayed/restored. Connection is not verified authentication or holder verification.

The SDK's mobile transport can persist identity keys for encrypted bridge communication. These are not NEAR account access keys and do not authorize NEAR transactions. Disconnect removes RobinHoot's connected-account records, not the user's wallet account or unrelated on-chain keys. Browser account metadata is untrusted.

The SDK is dynamically initialized after client mount and provides its own isolated popup. Use a top-level page and allow wallet popups. Android users can use Meteor Web or the supported Meteor Mobile pairing/Open button when the bridge is reachable. No custom deep links or permission bypasses are used. The original Google Fonts import remains.

## Validation

```bash
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Build before browser testing; tests start the production server. For system Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`.

Tests exercise the real Meteor SDK with mocked external wallet responses on desktop Chromium and Pixel 7 emulation. They check mainnet account-only login payloads, restoration, per-account draft isolation, switching, disconnect, guest drafts, invalid local data, creator preservation, popup errors and storage failure. Header geometry is checked at 320, 360, 393, 600, 768, 1024 and 1280 pixels. Desktop extension transport has a separate test; Android Chrome does not support desktop extensions.

Current dependency audit limitations and patch overrides are documented in [the investigation](docs/METEOR_REVIEW.md).

## Vercel preview review

Use the Issue #2 feature-branch PR preview (Meteor's original investigation remains in PR #1). No production deployment is part of this phase.

1. On desktop and physical Android Chrome, open the preview directly and edit a character before connecting.
2. Select Meteor Web or the installed extension on desktop. On Android, test Meteor Web and Meteor Mobile pairing/PIN/Open/return when offered.
3. Confirm account sharing only. Do not accept a key-addition, transaction, token-approval or message-signing prompt.
4. Verify the displayed account and mainnet label, then reload for restoration.
5. Save different character drafts for two accounts, reload and switch between them. Confirm isolation and restoration. Test cancellation; switching disconnects the old session first.
6. Disconnect and reload. Confirm the unconnected draft returns, separately from both wallet drafts. Check profile prototype/ownership labels and Edit Profile focus.
7. Repeat with blocked popups, tab switching, long account IDs and keyboard navigation. Verify mobile bridge availability and error recovery on a real device.

Live wallet acceptance and physical Android handoff are not replaced by browser emulation.

## Planned (not live)

- Verified wallet authentication and holder verification
- AI-generated PFPs and downloadable posters
- Database-backed profiles, bounties and treasury distributions

Never enter a seed phrase into RobinHoot. No on-chain transactions occur in this phase.
