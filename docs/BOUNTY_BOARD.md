# Phase 6: Bounty Board preview

## Functional

- `/bounties` is an accessible, mobile-first board with six parchment-style mission cards, three category filters and announced result counts. A visible mobile navigation row and home-page callout provide discovery without hiding the wallet.
- `/bounties/[slug]` provides shareable, statically generated contract details for each catalogue entry, with title, category, difficulty, proposed requirements and examples of possible future evidence. Unknown slugs return 404.
- Every mission is `PREVIEW / COMING SOON`. Reputation and rewards are concept previews, with no assigned points, earned badges, leaderboard, submission form, completion action or reward claim.
- The roadmap distinguishes available website/local character prototypes, the Bounty Board preview and future review/reputation/rewards/governance work. It does not claim AI generation or authenticated/on-chain identities are live.
- Existing wallet, local drafts, 12 Wolf portraits, profile/passport routes and PNG exports remain unchanged. Browsing is public and requires no wallet connection, signing or paid action.

## Extensibility and next steps

`lib/bounties/catalogue.ts` holds typed editorial records with stable IDs, URL slugs, category, difficulty, preview status, proposed requirements and future evidence examples. Components render this public catalogue; it is not a permissions service. The literal preview status prevents accidentally advertising a mission as open without deliberately expanding the model. Client filters never save progress or mutate a profile.

A future submission phase needs separately reviewed scope and infrastructure:

1. Define immutable mission revisions, availability windows and final rules. Treat this preview catalogue as editorial copy, not finalized eligibility or a funding commitment.
2. Add a genuine authenticated server session and authorize every submission against the verified account, not client-editable local wallet metadata. See [Outlaw identity planning](OUTLAW_IDENTITY.md). Wallet signatures are not introduced here.
3. Design evidence validation, file limits, safe uploads, malware/content checks, privacy/consent, rate limits and anti-spam controls. Do not ask for private keys or sensitive account information.
4. Persist submission/review states and reviewer audit history on the server. Define moderation, fair review criteria, appeal rules, attribution and conflict-of-interest handling before opening missions.
5. Derive reputation/badges from verified records with published criteria. Never treat a client-side click or editable local storage as proof of completion.
6. Define any rewards only after rules, eligibility, funding and appropriate review exist. Keep payments or on-chain operations out of this preview. No token distribution, return, badge or payment is guaranteed.

No new API, database, storage key, signing capability, token transfer, NFT or on-chain reward is implemented. The board may be browsed with a connected wallet, but connection itself neither authenticates a submission nor grants membership/reputation.

## Validation

Run `npm run typecheck`, `npm run build`, `npm run test:assets` and `npm run test:e2e`. Bounty tests cover all category filters with keyboard activation, all six detail routes, invalid slugs, closed-submission messaging, no action forms, touch-target sizes and horizontal layout at 320/393/768/1280px. They also navigate from a saved wallet character through the board and back, checking preservation of account, local draft, selected artwork and roadmap status.

Full browser regression tests include all 12 Wolf sources, portrait synchronization and both actual PNG exports. Automated Android checks use Pixel 7 Chromium emulation of the production app; live Meteor services and physical Android downloads still require device acceptance. The executor cannot browse Vercel directly under its network policy; Vercel build readiness is checked through GitHub status.
