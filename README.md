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
- Local character creator with class, species, outfit, personality and layered vector illustration previews
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

## My Outlaw and Guild Passport (Issue #4)

Open **My Outlaw / Passport** from the hero, navigation or profile section, or visit `/my-outlaw`. This dedicated view reuses the same creator options and versioned local draft keys as the landing page. It distinguishes a new/sample identity, account-connected mode and a separate disconnected draft. Changes follow you between the landing creator and My Outlaw view.

The Character Card / Guild Passport uses the selected character composition and identity details. It is explicitly marked **Preview / Not minted / Not registered**, including inside the exported image. The original fox mascot remains on the landing page; creator artwork is composed from local illustrated layers. It grants no membership, authentication, rewards or on-chain status.

**Download Card PNG** exports the same 840×1120 browser canvas shown in the preview. It uses only the self-contained local SVG illustrations and system fonts, with no new dependency, remote renderer or backend. The shortened NEAR account is hidden by default; opt in to include it in both image and shared text. Account changes reset that choice and discard/revoke the previous image URL. Edits invalidate the previous download until its replacement is ready.

**Share / Copy Details** uses the browser's native share sheet where available, then the clipboard. Cancellation is harmless. If clipboard access is denied, a focused, selected text field supports manual copying. If canvas/image export is unavailable, the identity details and share/copy flow still work. If the character illustration fails to render, PNG download is unavailable and the text share/copy flow remains available; it does not silently substitute an emoji or the mascot. System-font and emoji appearance vary by device; mobile browsers may open the PNG rather than saving it directly. Shared text always carries the prototype and ownership disclaimers. Sharing is initiated only by the user's button press and never authenticates a wallet.

Phase 3 adds no dependencies or wallet operations. The Meteor client, keystore guard, wallet provider and public assets are unchanged. Existing upstream dependency advisories and physical Android/Meteor acceptance limitations still apply.

## Phase 4: Character Creator 2.0

The large live illustration, WANTED poster, profile and downloadable passport now derive their appearance from the same reusable species, clothing and equipment layers. Fox, Wolf, Raccoon, Bear, Rabbit, Badger and Owl are supported. Ranger, Rogue, Warrior, Mage and all previous classes have distinct equipment; each existing outfit changes visible clothing. Existing choices, fields and account/guest draft keys are retained, including legacy animal/trait reads. No destructive data migration is needed.

**Visual status:** functional local vector illustration prototypes are implemented. Final cinematic painted artwork, richer species anatomy and production clothing/equipment polish still require an artist. This limitation is stated in the creator UI; do not treat the final production artwork requirement as complete. See [the art status and layer contract](docs/CHARACTER_ART.md) for the exact completed/missing work. This is not an AI-generation service and adds no paid API or package.

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

Use the Issue #4 feature-branch PR preview (Meteor's original investigation remains in PR #1). No production deployment is part of this phase.

1. On desktop and physical Android Chrome, open the preview directly and edit a character before connecting.
2. Select Meteor Web or the installed extension on desktop. On Android, test Meteor Web and Meteor Mobile pairing/PIN/Open/return when offered.
3. Confirm account sharing only. Do not accept a key-addition, transaction, token-approval or message-signing prompt.
4. Verify the displayed account and mainnet label, then reload for restoration.
5. Save different character drafts for two accounts, reload and switch between them. Confirm isolation and restoration. Test cancellation; switching disconnects the old session first.
6. Disconnect and reload. Confirm the unconnected draft returns, separately from both wallet drafts. Check profile prototype/ownership labels and Edit Profile focus.
7. Open `/my-outlaw`, edit and reload a draft, test PNG download and share/copy (including cancellation and denied clipboard), and confirm account display is opt-in and the export includes all prototype labels.
8. Repeat with blocked popups, tab switching, long account IDs and keyboard navigation. Verify mobile bridge availability and error recovery on a real device.

Live wallet acceptance and physical Android handoff are not replaced by browser emulation.

## Planned (not live)

- Verified wallet authentication and holder verification
- AI-generated PFPs and downloadable posters
- Database-backed profiles, bounties and treasury distributions

Never enter a seed phrase into RobinHoot. No on-chain transactions occur in this phase.

## Visible save and download actions

The creator includes an explicit **SAVE DRAFT** button in addition to auto-save. Feedback distinguishes per-account browser-local storage from the unconnected tab-only draft, and reports denied/full storage without claiming a save. Neither action uploads or registers a character.

**DOWNLOAD CHARACTER** sits directly below the WANTED poster on both `/` and `/my-outlaw` and exports `robinhoot-character.png`. **DOWNLOAD GUILD PASSPORT** sits directly below the passport image on `/my-outlaw` and exports `robinhoot-passport-preview.png`. Both are 840×1120 PNG files with the current character selections and prototype labels. Buttons remain visible while preparing and become enabled only for the current image.

Downloads use a prepared blob and a synchronous, user-initiated HTML download action, including on Android Chrome. The page reports a download request, not an unobservable device-save success. Check Chrome's Downloads list; if browser settings open the image instead, use the visible **Open PNG if download does not start** link and the browser's save-image action. The site cannot force an OS folder or bypass device/browser policy. Physical Android saving still needs preview acceptance testing; automated mobile Chromium tests capture and validate the emitted PNG files.

## Phase 5 — exact cinematic wardrobe registry

The charcoal/emerald mobile RPG studio uses a large full-character portrait before compact keyboard-accessible choice cards. Class-dependent outfit cards are derived from `lib/character/portraits.json`: Ranger has Patched Cloak, Leather Vest and Forest Hood; Mage has Arcane Robes. Class changes atomically choose the first valid outfit. Existing Ranger draft aliases migrate safely on read without rewriting storage.

**All four newly approved artwork paths are now present.** Their catalogue entries still await activation; they are not yet claimed integrated. The unchanged original Wolf Ranger `portrait.png` is an explicitly labelled fallback for Patched Cloak only. No Ranger image is used for Mage or any other outfit. Unsupported selections show a clear unavailable state, without cartoon or emoji substitutes. Character/passport PNG downloads remain available as clearly labelled identity-only cards when artwork is missing.

The same resolver drives the live preview, Wanted Poster, Outlaw Profile, Guild Passport and PNGs. Actual artwork is contained without distortion or cropping. Wallet behavior, profile/passport routes and isolated guest/account drafts are preserved. No external image API or AI generation is introduced.

See [the exact missing paths, asset contract and activation procedure](docs/CINEMATIC_ASSETS.md). `npm run validate:art` runs before builds and prints missing registered paths. Upload originals at their exact paths, record dimensions and mark their catalogue entries ready after verification. New registered outfit names become options automatically. The cinematic UI mockup is also still missing; reference matching is not claimed.
