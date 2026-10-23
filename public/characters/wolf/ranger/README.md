# Wolf Ranger artwork upload

Place the supplied original Wolf Ranger portrait at:

`public/characters/wolf/ranger/portrait.png`

No Wolf Ranger image was provided or found in the repository. There is deliberately no substitute image at that path. Do not copy the existing fox mascot or synthesize a replacement.

Use a real PNG (recommended 1440×1860 or larger, minimum 960×1240, maximum 10 MB). Preserve the supplied artwork and aspect ratio. Keep any important details within the image; the shared renderer contains rather than crops it.

Then update `lib/character/portraits.json`:

- Record the image's real pixel width and height.
- Set `outfit` to the exact existing outfit depicted: `Patched Cloak`, `Ragged Hood` or `Worn Leather Vest`. If none matches, keep it pending until an explicit product/art mapping is agreed. Do not invent coverage.
- Add artist/source and permission/provenance information to `credit` (public-safe information only).
- Set `status` to `ready` only after visual and rights review.
- Run `npm run validate:art`, TypeScript, build and browser tests.

Changing `status` alone cannot publish a missing image: the production build validates the PNG, its size, dimensions and coverage. The current `awaiting-artwork` record is intentionally not loaded by the browser.
