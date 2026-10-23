# Cinematic character registry and current asset inventory

## Exact missing files

On the remote `feat/phase-5-cinematic-creator` branch inspected for this revision, all four newly approved files are absent on the case-sensitive Linux filesystem:

- `public/characters/wolf/ranger/patched-cloak.png`
- `public/characters/wolf/ranger/leather-vest.png`
- `public/characters/wolf/ranger/forest-hood.png`
- `public/characters/wolf/mage/arcane-robes.png`

These exact paths are registered in `lib/character/portraits.json` as `awaiting-artwork`. They are not fetched or claimed integrated. Do not upload a renamed Ranger image as Mage or a different outfit. The only available Wolf file is the original `public/characters/wolf/ranger/portrait.png` from deb7bc8: 1030×1536, 1,848,193 bytes; SHA-256 `bb00b8a3d99fd1d83189b54f9718c1daf4cd744230c33dddc16e914fc369127e`. It is unchanged and explicitly registered as the same-outfit Patched Cloak fallback.

## Exact selection contract

`resolveAppearance` prefers ready exact species/class/outfit artwork, then an explicitly registered fallback for that **same** combination. It never reuses Ranger for Mage, Rogue or Warrior, nor Patched Cloak for a different outfit. Unsupported choices display a typographic unavailable state, with no SVG/cartoon/emoji replacement. Original unused vector source remains in the repository for historical compatibility but is no longer used by the cinematic creator or exports.

One resolver supplies live preview, Outlaw Profile, Wanted Poster, passport and character PNG. UI contains the full original; canvas uses uniform scaling from natural dimensions, without cropping body parts or stretching. When no image exists, downloads render identity details with an explicit artwork-unavailable notice and no illustration. A ready image that fails to load disables its download rather than quietly substituting another picture. Old PNG URLs are invalidated and old passport pixels cleared when selections change.

## Wardrobe and draft compatibility

Outfit names are derived from catalogue entries per class, retaining the legacy wardrobe for classes without registered outfits. Ranger offers Patched Cloak, Leather Vest and Forest Hood. Mage offers Arcane Robes. Changing class atomically selects its first valid outfit; no old invalid outfit can leak into the new class. Class-card previews use that same transition logic.

The parser validates stored outfits against the class wardrobe. Old Ranger `Ragged Hood` maps to Forest Hood and `Worn Leather Vest` maps to Leather Vest. Old Mage drafts move to Arcane Robes. Name, species, personality, draft keys and account/guest isolation remain intact. Reading does not rewrite data; the next deliberate edit saves the normalized shape. No destructive migration or wallet operation is introduced.

## Registering future original artwork

1. Upload the approved original PNG at its exact path, without modification.
2. Record actual dimensions, source/attribution and `status: ready` in `portraits.json`. New species/classes can use the existing choices; a new outfit name registered for a class automatically becomes a wardrobe option. No creator redesign is needed.
3. A primary and fallback may cover the same combination; primary always wins. Do not add multiple ready primary entries or fallbacks for one combination.
4. Run `npm run validate:art`, TypeScript, production build and browser tests. Validation checks local PNG paths, actual file/header dimensions, minimum 960×1240, maximum 10 MB and unambiguous coverage. Missing pending paths are printed explicitly. A present pending file is reported for activation; uploading alone does not falsely mark it ready before its metadata is verified.
5. Check original-image decoding, crop-free previews, actual exported pixels, rapid selection changes, keyboard controls and physical Android downloads. Browser tests currently verify the original fallback and unavailable states; tests of four ready variants use metadata-only resolver fixtures because those files are absent.

No runtime art service, paid API, replacement generation, transaction, signing, minting or authenticated membership is introduced. The original cinematic UI mockup also remains unavailable at `docs/references/robinhoot-cinematic-ui.png`; no reference fidelity is claimed. The independently refined charcoal/emerald studio, aged parchment poster, Meteor integration, routes, local drafts and download actions remain.
