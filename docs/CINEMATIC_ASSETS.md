# Cinematic character registry and current asset inventory

## Active originals (all twelve activated)

All twelve approved originals are now present at the exact case-sensitive paths below. The misplaced Mage file was moved byte-for-byte from `ranger/mage/arcane-robes.png` to `mage/arcane-robes.png`; the accidental `README.md.` and empty misplaced directory were removed:

- `public/characters/wolf/ranger/patched-cloak.png`
- `public/characters/wolf/ranger/leather-vest.png`
- `public/characters/wolf/ranger/forest-hood.png`
- `public/characters/wolf/mage/arcane-robes.png`
- `public/characters/wolf/mage/dark-sorcerer.png`
- `public/characters/wolf/mage/mystic-hood.png`
- `public/characters/wolf/rogue/shadow-hood.png`
- `public/characters/wolf/rogue/assassin-gear.png`
- `public/characters/wolf/rogue/thief-cloak.png`

- `public/characters/wolf/warrior/battle-armor.png`
- `public/characters/wolf/warrior/berserker.png`
- `public/characters/wolf/warrior/royal-guard.png`

These exact paths are now registered as `ready` with their actual dimensions (1030×1536; Mystic Hood and Rogue originals 1031×1536; Warrior originals 1024×1536) and repository-owner source attribution. The creator uses all twelve original images for their corresponding selections. No image was modified during activation. Do not upload a renamed Ranger image as Mage or a different outfit. The lower-priority same-outfit fallback remains the original `public/characters/wolf/ranger/portrait.png` from deb7bc8: 1030×1536, 1,848,193 bytes; SHA-256 `bb00b8a3d99fd1d83189b54f9718c1daf4cd744230c33dddc16e914fc369127e`. It is unchanged and explicitly registered as the same-outfit Patched Cloak fallback.

## Exact selection contract

`resolveAppearance` prefers ready exact species/class/outfit artwork, then an explicitly registered fallback for that **same** combination. It never reuses Ranger for Mage, Rogue or Warrior, nor Patched Cloak for a different outfit. Unsupported choices display a typographic unavailable state, with no SVG/cartoon/emoji replacement. Original unused vector source remains in the repository for historical compatibility but is no longer used by the cinematic creator or exports.

One resolver supplies live preview, Outlaw Profile, Wanted Poster, passport and character PNG. UI contains the full original; canvas uses uniform scaling from natural dimensions, without cropping body parts or stretching. When no image exists, downloads render identity details with an explicit artwork-unavailable notice and no illustration. A ready image that fails to load disables its download rather than quietly substituting another picture. Old PNG URLs are invalidated and old passport pixels cleared when selections change.

## Wardrobe and draft compatibility

Outfit names are derived from catalogue entries per class, retaining the legacy wardrobe for classes without registered outfits. Ranger offers Patched Cloak, Leather Vest and Forest Hood. Mage offers Arcane Robes, Dark Sorcerer and Mystic Hood. Rogue offers Shadow Hood, Assassin Gear and Thief Cloak. Warrior offers Battle Armor, Berserker and Royal Guard. Changing class atomically selects its first valid outfit; no old invalid outfit can leak into the new class. Class-card previews use that same transition logic.

The parser validates stored outfits against the class wardrobe. Old Ranger `Ragged Hood` maps to Forest Hood and `Worn Leather Vest` maps to Leather Vest. Old Mage drafts move to Arcane Robes. Name, species, personality, draft keys and account/guest isolation remain intact. Reading does not rewrite data; the next deliberate edit saves the normalized shape. No destructive migration or wallet operation is introduced.

## Registering future original artwork

1. Upload the approved original PNG at its exact path, without modification.
2. Record actual dimensions, source/attribution and `status: ready` in `portraits.json`. New species/classes can use the existing choices; a new outfit name registered for a class automatically becomes a wardrobe option. No creator redesign is needed.
3. A primary and fallback may cover the same combination; primary always wins. Do not add multiple ready primary entries or fallbacks for one combination.
4. Run `npm run validate:art`, TypeScript, production build and browser tests. Validation checks exact local paths, PNG signatures and actual header dimensions, minimum 960×1240, maximum 10 MB and unambiguous coverage. Missing pending paths are printed explicitly. A present pending file is reported for activation; uploading alone does not falsely mark it ready before its metadata is verified.
5. Check original-image decoding, crop-free previews, actual exported pixels, rapid selection changes, keyboard controls and physical Android downloads. Browser tests now render all twelve real originals, verify served checksums and decoding, switch without navigation, compare live/poster/profile sources, and compare both downloaded PNG image regions against independent rasterizations of each selected original. Passport PNGs are also compared byte-for-byte with the visible canvas. Unsupported classes still display no substitute artwork.

No runtime art service, paid API, replacement generation, transaction, signing, minting or authenticated membership is introduced. The original cinematic UI mockup also remains unavailable at `docs/references/robinhoot-cinematic-ui.png`; no reference fidelity is claimed. The independently refined charcoal/emerald studio, aged parchment poster, Meteor integration, routes, local drafts and download actions remain.

## Active original checksums

| Combination | SHA-256 |
| --- | --- |
| Ranger / Patched Cloak | `799fe7d245d58e77c15eea6c79cdb0321bf0234da76334baa3b526fcfd74134e` |
| Ranger / Leather Vest | `40a85cc3cfe290c3f0d81efef43bb796c9fafd14798c677ec7a0ac9fcdec6674` |
| Ranger / Forest Hood | `6fc8e8c4b1c1e57a9e43475427ec7c487f5d76dca717ed62fb37fa9e491618fc` |
| Mage / Arcane Robes | `44959834c1c7692650ee8bef504d3a2d460dffe8354db99a96dd465bdfc545c3` |
| Mage / Dark Sorcerer | `49ff71bb130b564a6e5c5a5ae4f766a26613c64c24fd2ad2ddd8288e8da62e7b` |
| Mage / Mystic Hood | `6ab933bcf46a3380a627795e505cb054499029e08be94ac02acb273da0d89e81` |
| Rogue / Shadow Hood | `2d7714ecf4394521bf2065c0dd8050d83d4deca9ff628e6a50c9cd8539a98d8d` |
| Rogue / Assassin Gear | `523402f37d806e5951f6893ba2eae8117c45832a688a9c016a7b6255ec2e25bf` |
| Rogue / Thief Cloak | `41d17aed5089c7689d3785d3f8e784e50572b93909a30512cdb7967eb2629891` |

All twelve images were visually inspected. Automated mobile tests use Pixel 7 Chromium emulation of the production build; physical Android storage policies and live wallet handoff still need device acceptance.

The replacement Warrior originals are genuine 1024×1536 PNGs at the requested paths. Their bytes and paths are preserved; strict PNG signature validation is restored, and browser canvas exports remain genuine PNG. Invalid legacy Warrior outfits normalize to Battle Armor on read; valid outfits, names and personality are preserved without rewriting storage.

- Warrior / Battle Armor: SHA-256 `92376df3d7d70a690524f0de04c86ca29ded45f3d7ae22dc39beb19f407ce9d2`
- Warrior / Berserker: SHA-256 `a1c09136b17d0dbc894480a293f642060ba203d7163e7d317cc6aea08b534411`
- Warrior / Royal Guard: SHA-256 `90edcf8fca989e6843fff34f6e04543980d31551e95d2d03e30b19a108274438`
