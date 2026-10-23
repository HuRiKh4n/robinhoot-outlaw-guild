# Character Creator 2.0 — visual status and asset contract

## Complete functionality

- Seven illustrated species: Fox, Wolf, Raccoon, Bear, Rabbit, Badger and Owl. Species alter head markings, ears, fur palette and tail anatomy.
- Seven equipment sets: Ranger (bow/quiver), Rogue (dagger/pouches), Warrior (sword/pauldron), Mage (crystal staff/mantle), Scout (compass/satchel), Trickster (cards/coin pouch), Guardian (shield).
- Three clothing layers: Patched Cloak, Ragged Hood and Worn Leather Vest.
- Live preview, WANTED poster and Outlaw Profile use the same local vector composition. Guild Passport rasterizes that same SVG into its existing canvas, then exports the displayed canvas as PNG.
- Earthy palettes, shaded fur/leather/steel, worn patches, stitchwork, a scar, atmospheric backdrop and personality-dependent eye color are implemented in the vector set.
- No emoji character portraits remain. The original fox mascot stays untouched on the landing page. Brand emoji symbols are navigation decoration, not character artwork.

## Artwork is a prototype, not final production art

The repository previously contained only one fixed mascot raster, with no compatible layered character set. This phase supplies original authored SVG geometry in `lib/character/layers.ts` and a deterministic compositor in `lib/character/render.ts`. These are actual, distinct vector illustrations, not emoji or generic external placeholders; however, they are explicitly presented as **vector illustration prototypes**. They do not yet meet a finished cinematic painted RPG art standard. The UI and README disclose this limitation. No artwork service is connected and no runtime AI-art generation is claimed.

Still required for a production art release:

- Artist-reviewed, expressive anatomy and high-detail painted fur for all seven species.
- Production clothing/equipment art for the seven classes and three outfits, with richer material texture, weathering, silhouette variation and lighting consistent with the mascot.
- Additional pose/expression variation and species-specific equipment fitting, especially Owl wings and Bear proportions.
- Art-direction review at phone preview size and full PNG resolution, and recorded provenance/licensing for any replacement assets.

Do not remove the prototype disclosure until those assets have been delivered and reviewed. Functional completeness does not imply the final artwork requirement is complete.

## Reusable layer contract

The shared registration is 480×620. Backdrop sits behind tail/legs, torso/clothing, arms/belt, neck/ears/head/markings, neck accessories and class equipment. Inline gradients/patterns are self-contained SVG primitives; no external references, fonts, user-supplied SVG, scripts or foreignObject are allowed. User names are never interpolated into SVG markup.

Replace the named species/clothing/equipment definitions under this contract, then verify every combination. If a future production raster layer pipeline is used, preload and composite same-origin layers into the same frame; do not substitute a fixed mascot for an unsupported combination. Missing art must produce an explicit unavailable state. Passport export must continue using the same composition as the live preview.

## Draft compatibility

No schema or storage key was changed. Existing options remain available, with Bear, Rogue, Warrior and Mage added. Appearance is derived from species/class/outfit/personality rather than saved separately, avoiding incompatible duplicated avatar state. The existing reader accepts `animal` and `trait` aliases and validates choices. Reads do not rewrite saved data; the next deliberate edit writes the normalized existing shape. Wallet account isolation and separate guest drafts are unchanged.

## Validation and limits

Browser tests verify distinct SVG sources for every species/class/outfit, actual PNG pixel changes for species/equipment/clothing, equality between the downloaded PNG and displayed passport canvas, shared poster/profile sources, legacy drafts, keyboard use and responsive layouts. Existing wallet permission, account-switching, reload, disconnect and account-isolation tests remain in place.

Vector art uses browser-native SVG/canvas with no new package or paid API. It needs visual/artist review in addition to automated tests. Physical Android download/share and live Meteor handoff remain manual acceptance checks. Existing upstream dependency advisories remain documented separately in METEOR_REVIEW.md.

## Phase 5 follow-up

The vector work above remains an explicitly labelled fallback. The new cinematic catalogue and shared resolver are documented in [CINEMATIC_ASSETS.md](CINEMATIC_ASSETS.md). The owner-uploaded Wolf Ranger portrait is now active; the cinematic UI reference is still missing. Wolf Ranger uses its original PNG, with explicit disclosures for unsupported outfit variations. The pipeline does not treat the mascot or a vector recreation as the requested Wolf artwork. New production entries require exact species/class/outfit coverage and real same-origin PNG files.
