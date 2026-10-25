# The Hideout: redesign plan (phases 1–2)

Feedback: "looks too normal, like a normal NFT site". Answer: one strong idea, not more luxury.
The homepage becomes **a place**, the outlaws' secret hideout under the trenches, explored by touching objects.

## Phase 1: audit (current state)

- Routes: `/` (home sections), `/my-outlaw` (creator + WANTED poster + passport), `/bounties`, `/bounties/[slug]`, `/guild-identity` (gated, hidden).
- Home today: hero + marquee, tale, Sheriff of Whaleingham, 3 steps, bounty teaser, treasure-map roadmap, footer. Motion: embers, moon/castle parallax, ink reveal, coins.
- Global: `SiteHeader` (3 links + wallet + lute), `SoundProvider` in root layout (music persists across pages, off by default), Google fonts (Oswald, DM Sans, IM Fell English).
- Creator: `OutlawProfile` + `ChoiceDeck` + `CharacterPreview`, catalogue `lib/character/portraits.json` (80 portraits, WebP display copies). Wallet: Meteor, account-only.
- Constraints kept: wallet flows, draft data, creator logic, honest "coming soon", no reward promises, no paid services, reduced motion, no autoplay.

## Phase 2: composition and hotspots

Two illustrations of the **same room**: desktop 16:9 and mobile 9:16. Hotspots are HTML buttons/links over the image, positioned with normalised coordinates (x, y, w, h as fractions of the image). They will be re-calibrated on the final art.

| # | Object | Action | Desktop 16:9 (x, y, w, h) | Mobile 9:16 (x, y, w, h) |
|---|---|---|---|---|
| 1 | WANTED wall (fox pinning a poster) | **Forge your outlaw** → `/my-outlaw` | .03 .10 .23 .52 | .03 .22 .45 .26 |
| 2 | Storybook on the table | The tale (parchment overlay, `#tale`) | .23 .63 .20 .29 | .05 .60 .44 .18 |
| 3 | Window → Sheriff's golden castle | The villain (overlay, `#sheriff`) | .40 .05 .19 .34 | .25 .03 .50 .17 |
| 4 | Padlocked chest | Roadmap (overlay, `#road`) | .46 .70 .15 .24 | .36 .79 .30 .12 |
| 5 | Raccoon bard with lute | Music on/off (same as lute button) | .70 .42 .11 .47 | .56 .52 .38 .24 |
| 6 | Bounty board | `/bounties` | .81 .09 .16 .53 | .52 .22 .45 .26 |
| – | Fireplace | decoration, main warm light, flicker | .57 .36 .13 .46 | .20 .48 .36 .12 |

Sketches: `docs/hideout/sketch-*.png` (colour blocks only, to give the image model) and `docs/hideout/schema-*.png` (labelled).

### Interaction (phase 3+)
- Hotspots: real `<a>`/`<button>` elements, visible label on hover, focus and tap; keyboard order 1→6; soft glow outline.
- Overlays (tale, Sheriff, roadmap) open as parchment dialogs with their own URL hash, close with Esc/back; the current copy is reused.
- Persistent alternative navigation: header links stay; on phones a fixed bottom bar (Tale · Forge · Bounties · 🎵) with **Forge Your Outlaw** as the central, prominent button.
- Living details (CSS only, off with reduced motion): fire flicker, occasional embers, WANTED posters swaying, castle window light changing, small surprises (a mouse crossing, a coin wobbling).
- Performance: each final image ≤ 400 KB WebP at 1920 / 1280 / 828 widths; scene above the fold, nothing else heavy.
- Below the scene (for search engines and people who scroll): a short storybook strip with the same content, so nothing depends on exploring.

### Phase 5
The creator becomes "pinning your own WANTED poster on the wall": same logic and data, new skin.
