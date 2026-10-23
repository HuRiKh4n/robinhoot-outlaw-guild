# Phase 5: cinematic assets — integration ready, supplied references missing

## Current inspection

Phase 5 starts from PR #6 at b68bc9c. PR #6 is open and stacked on PR #5. Its shared vector compositor and account-isolated local drafts are preserved. Only `public/images/file_000000001d188246a150a12121d3ed34.png` (the original fox mascot) exists as raster character art. Neither the supplied Wolf Ranger portrait nor cinematic UI mockup is in the repository or PR #6 discussion; neither was attached to this request. No replacement artwork was generated, traced, fabricated or purchased.

## Exact upload locations

| Reference | Repository path | Status |
| --- | --- | --- |
| Supplied Wolf Ranger original | `public/characters/wolf/ranger/portrait.png` | Missing; catalogue entry intentionally pending |
| Supplied cinematic UI mockup | `docs/references/robinhoot-cinematic-ui.png` | Missing; reference matching/visual acceptance blocked |

Upload these on `feat/phase-5-cinematic-creator` (or attach originals in the task), not main. Also identify which existing outfit the Wolf Ranger artwork depicts and its artist/source/usage permission. An unsupported outfit must not be silently renamed to make it fit. Requirements to ship the original production artwork and reproduce the supplied UI reference remain incomplete until the files arrive.

## Architecture

`lib/character/portraits.json` is the build-time catalogue. Each entry has a stable id, exact species/class/outfit, local PNG path, intrinsic dimensions, provenance credit and explicit `awaiting-artwork` or `ready` status. One entry covers exactly one outfit. Add separate art for each new combination; do not duplicate one portrait to claim visual changes. Personality is metadata for cinematic portraits and the UI states that it does not change the image. A name/personality change never selects unrelated art.

`resolveAppearance` in `lib/character/appearance.ts` is the only source selector for the live preview, WANTED poster, Outlaw Profile, character PNG and Guild Passport. It selects a ready exact match; otherwise it retains the PR #6 vector composition with an explicit prototype label. Pending image paths are never fetched and no unknown class/outfit inherits the Wolf image. The existing vector fallback is a clearly labelled preview, not a production-art substitute.

Production PNGs are reused unchanged with `object-fit: contain` in the framed UI and aspect-preserving containment in canvas. Framing, ambient light and shadow belong to the UI, not synthetic changes to the character. The same source image, not a screenshot or fixed mascot, is rendered in each output. Text and card decorations vary between surfaces; selected artwork does not. Prototype status is written into exported PNGs and shared text. Missing/corrupt ready art produces an explicit load failure and disables download rather than silently swapping to a different portrait. Edits invalidate old PNG URLs; the passport canvas is cleared before loading replacement art.

`npm run validate:art` runs before every production build. Ready entries must point to an existing local PNG, match real dimensions, be at least 960×1240 and at most 10 MB, have an exact allowed outfit and public-safe provenance, and not conflict with another entry's combination. Use optimized originals, ideally 1440×1860 or larger. PNG is deliberately the first supported production format; JPEG/WebP would need explicit validation support before registration. No remote URLs, runtime art generation, paid API, user file upload, server persistence or new dependency is introduced.

## UI and compatibility

A single responsive studio brings the framed portrait and creator controls together. Desktop has portrait/controls columns; Android has portrait followed by full-width controls, explicit SAVE DRAFT, then WANTED and passport downloads. Native selects preserve keyboard/mobile accessibility. Missing cinematic coverage is described for the current combination. Existing local/tab-only save feedback, account isolation, legacy draft parsing and Meteor account-only security boundaries are unchanged. No schema/key migration is needed: only appearance resolution changes, and no image URL is trusted from local storage.

The UI is an interim RobinHoot-styled layout foundation. The supplied cinematic mockup is still needed to verify the requested visual design. Original fox mascot, manifesto and roadmap remain untouched. No cinematic production portrait is bundled or claimed complete.

## Acceptance after uploads

Current automated coverage includes exact-match/ready-versus-pending resolver tests, catalogue publishing-guard tests (`npm run test:assets`), and desktop/Android Chromium tests of missing-art disclosure, synchronized fallback sources, PNG download pixels and responsive controls. Resolver tests use metadata-only synthetic entries, not bundled production artwork. The image-loading failure branch remains a manual acceptance check; production Wolf raster rendering and art-direction acceptance remain blocked on the original files. Update the missing-Wolf browser assertions to cover actual approved art when it is activated.

1. Inspect original artwork and mockup, confirm rights and outfit mapping; activate only real covered combinations with accurate dimensions.
2. Run asset validation, TypeScript, production build and all browser tests. Verify the ready raster branch in addition to the currently tested missing-art branch.
3. Compare image sources and actual exported PNG pixels across live preview, WANTED, profile and passport. Rapidly switch class/outfit/species; unsupported choices must show prototype status, never stale Wolf art.
4. On physical Android Chrome, check portrait framing, touch targets, storage feedback and both PNG downloads via Chrome Downloads. Verify actual Meteor app handoff separately. Emulation does not replace physical-device acceptance.
5. Artist/product approval of Wolf Ranger and UI-reference fidelity is required before calling the cinematic visual requirement complete. Do not merge or deploy production as part of this task.
