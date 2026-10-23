# RobinHoot — The Outlaw Guild

Responsive NEAR-community website built with Next.js App Router, React 19 and TypeScript.

## Run locally

Use Node.js 22 or 24 and npm. Install the committed dependency graph:

```bash
npm ci
npm run dev
```

Open http://localhost:3000. No environment variables or API keys are needed.

## Implemented

- Landing page, manifesto and five-chapter roadmap
- Local outlaw character preview with emoji placeholders; drafts survive reloads within the tab
- Responsive wallet control and accessible native dialog
- NEAR mainnet account connection, session restoration and disconnection via NEAR Wallet Selector
- MyNearWallet account switching by disconnecting and reopening the wallet; an active-account dropdown is available if an adapter returns multiple accounts

## Wallet boundaries and compatibility

Selector core and MyNearWallet are pinned to `10.1.4`, the current npm release when implemented. The SDK is dynamically imported after client mount, with shared initialization and subscription cleanup for React Strict Mode. No wallet code runs during server rendering. A small custom dialog avoids requiring a contract ID for the standard Selector transaction-oriented modal.

This phase calls only `signIn({})`, `getAccounts` (through Selector restoration), `signOut` and `setActiveAccount`. It never supplies `createAccessKeyFor`, `contractId` or method permissions and never calls signing, transaction or ownership-verification APIs. No token approvals or on-chain transactions are requested. The connection facade does not expose signing methods. Account state is not authenticated identity or holder verification; persisted browser state can be edited by its user.

MyNearWallet uses `https://app.mynearwallet.com/login/` in a popup/new tab and returns through the adapter's wallet-origin message flow. Desktop and Android Chrome must allow popups and preserve the opener relationship. Open Vercel previews as a top-level page, not in an embedded iframe. No extension is required. There is no custom deep-link scheme or callback parser. If the browser blocks the popup, or the user closes it, the dialog provides a retry. Switching disconnects first, so cancellation leaves the site disconnected. Disconnect clears the application's adapter session; it does not log the user out of the wallet website or revoke unrelated on-chain keys. Closing the RobinHoot dialog does not cancel an already open wallet tab.

**Meteor limitation:** the current `@near-wallet-selector/meteor-wallet@10.1.4` depends on `@meteorwallet/sdk@1.0.24`, whose login generates a key pair, sends a public key with an `ALL_METHODS`/`SELECTED_METHODS` access request and persists that key. It has no explicit account-only login mode. Meteor is therefore excluded from this read-only phase rather than requesting unintended access. Re-evaluate when a maintained adapter offers a documented account-only flow.

Browser automation exercises the actual Selector/MyNearWallet packages with a simulated external wallet response on desktop Chromium and Pixel 7 Chromium emulation. It is not a real Android device or a live wallet acceptance test. Real MyNearWallet login/account selection, wallet-side UI and Android tab-return behavior still need manual verification on the Vercel preview. No mainnet signing should be accepted or needed.

The existing Google Fonts import remains. This phase does not add a backend, membership registration, AI generation, NFT minting or treasury operations.

## Validation

```bash
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser tests start the production server, so build first. Environments with system Chromium can use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`.

Tests cover permission-free wallet login URLs, account restoration, switching, disconnect persistence, creator preservation, blocked popups, cancelled handoff and unavailable storage. Wallet UI is mocked; tests use no private keys or real funds.

Next.js's PostCSS dependency is overridden to patched `8.5.31` to address audit findings without a framework major upgrade. Selector's transitive elliptic/secp256k1 dependency still has a low-severity advisory; no cryptographic signing is used by this phase. Review upstream fixes before adding signing capabilities.

## Preview review and deployment

Open the feature branch PR and use its Vercel preview integration. No production deployment is part of Phase 1. No wallet environment configuration is needed; the network is intentionally fixed to mainnet.

On desktop and a physical Android device:

1. Open the preview directly and confirm the original page and creator work without a wallet.
2. Connect through MyNearWallet. Confirm the wallet requests account sharing only: no transaction, access-key addition or signature.
3. Return to RobinHoot, verify the account and mainnet label, and reload to check restoration.
4. Switch accounts, including cancelling the wallet window. Confirm the previous account is disconnected before the new selection.
5. Disconnect, reload, and verify the account is no longer displayed.
6. Repeat with popups blocked, browser Back/tab switching and a long account ID. Check keyboard focus and narrow-screen dialog usability.

## Planned (not live)

- Verified wallet authentication and holder verification
- AI-generated character PFPs and downloadable WANTED posters
- Database-backed profiles, bounties and treasury distributions

Never enter a seed phrase into RobinHoot. No transactions occur in this phase.
