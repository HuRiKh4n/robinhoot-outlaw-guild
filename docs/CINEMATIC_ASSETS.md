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

## Fox roster (sixteen originals) and class changes

Sixteen approved original Fox PNGs (1024×1536) were added unchanged under `public/characters/fox/<class>/<outfit>.png`: all twelve Ranger/Mage/Rogue/Warrior outfits plus two new Scout outfits (Wanderer Pack, Dust Hood) and two new Trickster outfits (Jester Motley, Card Sharp). Registering these outfits gives Scout and Trickster their own cinematic wardrobes; for species without that art (e.g. Wolf Scout) the creator still shows the explicit unavailable state.

Guardian has no artwork or wardrobe yet and is no longer offered. Old drafts that stored `Guardian` read as `Warrior` (outfit normalized to its first valid choice) without rewriting storage. The default new character is Wolf / Ranger / Patched Cloak so first-time visitors see real artwork.

New artwork can be dropped at the exact path and registered with `npm run register:art`, which records real PNG dimensions and `status: ready`, activates matching pending entries and never modifies images. Prompts for the remaining 84 combinations are in `docs/CHARACTER_PROMPTS.md`.

| Combination | SHA-256 |
| --- | --- |
| Fox / Ranger / Patched Cloak | `6f476f23bfaf4f8de9c689add5e2b1814aebccedd43d1524bf0cdb63391c7163` |
| Fox / Ranger / Leather Vest | `e1858823455da48fababd9b16152a777eb869fe54399f341d02b70fa2ca1355b` |
| Fox / Ranger / Forest Hood | `ddfd328f255612c8fe2efda98174a1c5e0f75332ee76a3f3ff436f636cb28d38` |
| Fox / Mage / Arcane Robes | `bf7ea08bf0925e7f6b031309d02b932188cc457e9ac93a20358350dc86c3ba17` |
| Fox / Mage / Dark Sorcerer | `ab0d7eca80f1968e7e6c729dde2be95f23245c7bad616c71144f5032e74d54ad` |
| Fox / Mage / Mystic Hood | `926a39065877277f6c1728c12d16ae842ca13c7abcf9311c96120a2d3285cc72` |
| Fox / Rogue / Shadow Hood | `4d4453b695c010a67662ffb6382346895c3362ef2013c466a7573679b340d692` |
| Fox / Rogue / Assassin Gear | `e282e3e2fb82d60bcd271b9c0c429ed36685570e89ef4cc01527a1978d1f99c7` |
| Fox / Rogue / Thief Cloak | `3ac432f30714afe899fb7d84714ea80d760518a1db014b5e23e4d31d13b576ea` |
| Fox / Warrior / Battle Armor | `c913781602bbb38a1b5fd5da29b7f31dfe9aed5c063db64cda20d73b45da1bc1` |
| Fox / Warrior / Berserker | `24e46e3087e8d1ad26d1035ae997528536be65c7abca51fd2fefa5edd7415dc0` |
| Fox / Warrior / Royal Guard | `c3ddbb3461d90a001f3971d603fca832d12ead1cf73aea5cf59f8b26d533f963` |
| Fox / Scout / Wanderer Pack | `6f200c1022681a35ea0294ae63ef4185b3bf39b7bcfc0b1cc4cd4c53ce3946ed` |
| Fox / Scout / Dust Hood | `1a0824b622ae78c2bead3671f4072dfb49b4d8e0ea0c5a89386134a2f91b4839` |
| Fox / Trickster / Jester Motley | `0722893c1dc415caa41a7680ae0ade3f53f99af3f6704ba0a09ebd08798a7c04` |
| Fox / Trickster / Card Sharp | `f61cdc72ffcda044a8e9413337f75c92a7f7421388b97bd294483d5f575fa398` |

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

## Web display copies and offered species

Each original PNG has two generated display copies next to it: `name.webp` (800 px, ~120 KB) for the live preview, poster and profile, and `name.thumb.webp` (240 px, ~12 KB) for choice-card thumbnails. The PNG original is unchanged and still feeds both PNG downloads. Previously every choice card loaded the full ~2.4 MB PNG. After adding art, run `npm run register:art` then `python3 scripts/make-web-derivatives.py`; `validate:art` (and therefore the build) fails if a ready portrait lacks either copy.

The creator offers only species with at least one ready portrait (currently Wolf, Fox, Raccoon, Rabbit, Badger). Owl and Bear remain valid in stored drafts, show the explicit unavailable state there, and reappear automatically once their art is registered.
