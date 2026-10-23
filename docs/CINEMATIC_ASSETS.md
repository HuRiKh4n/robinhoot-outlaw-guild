# Phase 5: cinematic Wolf Ranger

## Integrated asset

Owner upload commit `deb7bc8` supplied `public/characters/wolf/ranger/portrait.png`. The PNG is 1030×1536, 1,848,193 bytes. SHA-256: `bb00b8a3d99fd1d83189b54f9718c1daf4cd744230c33dddc16e914fc369127e`. The integration does not modify, regenerate, optimize, crop or re-encode this source. Browser tests verify the served bytes and natural dimensions.

The artwork visibly depicts Wolf Ranger with a weathered cloak, leather equipment, bow and quiver. Its base outfit maps to the existing **Patched Cloak** choice. Source attribution records the repository-owner upload without inventing an artist or license.

## Shared rendering and honest coverage

`lib/character/portraits.json` registers ready local PNGs with exact species/class/outfit, dimensions and source attribution. `resolveAppearance` supplies the same source to live preview, WANTED, Outlaw Profile, character download and passport. UI uses containment; canvas calculates one uniform scale from natural dimensions. No distortion or cropping is introduced. Source is served at original quality; card exports resample it into the existing 840×1120 composition.

`baseForClass: true` explicitly permits this Wolf Ranger portrait to remain visible when a different outfit is selected. Exact approved artwork takes precedence if supplied later. The base is never reused for another class or species. Unsupported outfit selections remain saved and displayed as metadata, while captions, accessibility text, availability feedback, passport details, shared text and exported PNG status disclose that the selected outfit is not depicted. Personality is also metadata and does not change the cinematic image. Do not duplicate this image to claim outfit variants.

Other species/classes retain the clearly labelled PR #6 vector prototype. A failed cinematic image does not silently fall back to a vector: the live view reports failure and PNG downloads remain unavailable. Replacement loads clear old passport pixels and invalidate stale downloads.

## Adding future art

Add original PNGs under `public/characters/<species>/<class>/…png` and a catalogue entry with accurate intrinsic width/height, depicted outfit and public-safe provenance. Use one explicit base per species/class at most. `npm run validate:art` runs before builds, validating file presence, PNG header, exact dimensions, minimum 960×1240, maximum 10 MB, allowed local paths/outfits and unambiguous coverage. Do not upscale an original merely to pass validation. PNG is the supported production format; other formats need validation support.

The original cinematic UI mockup remains missing. Upload it to `docs/references/robinhoot-cinematic-ui.png`. The current responsive RobinHoot studio is a layout foundation, not a verified reproduction of that reference. Other premium species/class/outfit art remains unavailable.

## Preservation and validation

The draft schema, legacy reader, guest sessionStorage and per-account localStorage keys are unchanged. No wallet code, permissions, signing, transactions, paid API, new dependency, backend or minting are introduced. Original fox mascot, manifesto and roadmap remain unchanged.

Tests cover original served PNG checksum, browser decoding, shared portrait sources, aspect-preserving passport pixels, actual selection-aware PNG downloads, explicit outfit limitations, fallback on class change, 320/393/768/1280 layouts, draft restoration/storage errors and Meteor/account isolation. Inspect Wolf Ranger screenshots and test download saving on physical Android Chrome; emulation cannot confirm device filesystem policy or live wallet handoff. Reference fidelity remains pending the UI mockup.
