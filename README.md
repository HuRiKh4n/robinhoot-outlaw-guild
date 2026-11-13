# RobinHoot 🦊🏹 — the memecoin whose prize chest has no owner

**$ROBINHOOT** is a memecoin on NEAR (live on JustHoot since 6 Nov 2026, paired with NEAR, CA `robinhoot-2.v2-launchpad.justhoot.near`).
Its mechanic is **Hold & Win**: the 2% trading tax goes into the **Guild Chest**, a NEAR contract with **no owner, no access keys and no withdraw method**, which splits the tax on arrival and, every Sunday, **rolls NEAR's on-chain randomness and pays the winning holders in the same transaction**.

Built for **NEAR HACKATHON 2026**, track **Memecoins With Mechanics**.
Sister project, also submitted (track *Games*): **[The Heist](https://github.com/HuRiKh4n/robinhoot-heist)**, a tap-to-run crash game in the same tale.

▶ Site: **https://robinhoot.fun** · the chest: **https://robinhoot.fun/chest** · am I in?: **https://robinhoot.fun/raid**

---

## Check it in 5 minutes (do X → see Y)

| Do | See |
|---|---|
| `cd contracts && cargo test -p guild-chest` | 12 tests pass: the 20 / 30·50·20 split, 40/30/30 weekly payouts, the Grand Prize paying 60% and keeping 40%, only the bot / only on time / never twice, ticket weighting, bounced payments going back, abandoned pots released, token mode. |
| Open https://robinhoot.fun/chest | Pots, totals and every draw read **live from the contract** (testnet demo until the mainnet chest is deployed), each payout linked to its block. |
| Look up `guild-chest-mw2kret3.testnet` on a testnet explorer | The demo run: tax tx `41jVVBR8h3FpRaPPJy4JaWLx8nYN1dPTGejJixg5gXGX` split 20/24/40/16; draw tx `EFSH1ytSwPjztRtUqijPMGz5uEMSazZeioBiqYRuE2k7` paid 3 holders 0.48 / 0.36 / 0.36 NEAR; then the account's only key was deleted. |
| Run `node scripts/chest/testnet-demo.mjs <guild_chest.wasm> out.json` (or Actions → *Guild Chest testnet demo*) | A fresh chest on testnet: deploy, tax, draw, payouts checked, key deleted. |
| Open https://robinhoot.fun/raid and paste any holder | Whether that wallet qualifies this week, its tickets and why (lowest balance, rank bonus, exclusions). |
| `node scripts/draw.mjs weekly 2026-11-22` (after that Sunday) | Rebuilds that week's eligible list from public chain data. The contract stores the sha256 of the list it received (`list_hash`, sorted `account:tickets` lines), so anyone can compare. |

## The mechanic

```
every trade ──2% tax (NEAR)──► robinh00d.near (JustHoot creator) ──hourly bot──► Guild Chest (robinchest.near, no keys)
                                                                                      │ deposit_tax splits on arrival
                                          ┌──────────── 20% dev ◄─────────────────────┤
                                          │             80% guild: 30% weekly pot · 50% Grand Prize pot · 20% reserve
Sunday 20:00 UTC: draw bot submits eligible list ─► contract rolls env::random_seed ─► pays winners in the same tx
```

- **Weekly (Sundays 1–3 of every 4):** the whole weekly pot to 3 holders, 40 / 30 / 30.
- **Grand Prize (4th Sunday):** 60% of the Grand pot to 5 holders, 50% + 4 × 12.5%; 40% rolls into the next cycle.
- **Entry:** hold ≥ $50 of the coin (converted to tokens weekly at the 7-day average price) for 72 h (120 h for the Grand Prize), checked at 6-hourly checkpoints plus 6 seed-derived random moments. No sign-up.
- **Tickets:** by the *lowest* balance in the window, $50 = 1 … $5,000+ = 10 (cap), plus an outlaw-rank bonus for consecutive days held (+1/+2/+3/+5). Max 15.

### Who can do what (the trust model)

| Actor | Can | Cannot |
|---|---|---|
| Anyone | send NEAR to the chest; read pots, draws and winners; call `flush()`; call `release_abandoned()` after 5 silent weeks | take anything out |
| Founder | forward the tax; `top_up` a pot from the reserve | withdraw, change the split, pick winners, upgrade the contract (no keys) |
| Draw bot (`drawer.robinchest.near`) | submit the eligible list once per Sunday, inside that week's window | choose winners, move coins, replay or pre-date a draw |
| Contract | split, roll the dice, pay, refund a bounced payment to its pot | anything not in its code |

The bot's list is reproducible by anyone from public chain data, and its sha256 (`list_hash`) is stored on-chain with the seed for every draw.

### Sybil and abuse limits

- **Splitting a balance doesn't pay:** tickets grow with balance but are capped, the $50 minimum applies per wallet, and sub-accounts of the same parent are counted as one.
- **No flash-holding:** the lowest balance over 72/120 h decides, plus random checkpoints nobody knows in advance.
- **Insiders excluded:** the creator wallet, the chest, the bot, the dev/reserve wallet, pools and the token contract are excluded (`RAID_EXCLUDED_ACCOUNTS`) and shown as "never in the draws" on /loot.
- **Bot failure:** a missed Sunday is skipped, never replayed; after 5 weeks of silence anyone can push the pots to the reserve so nothing is stuck.

## 60-day simulation (2% tax, $ at constant prices)

| Daily volume | Weekly prizes (Sundays 1–3, 5–7) | Grand Prize paid (Sun 4 → Sun 8) | Paid to holders in 60 days | Dev | Reserve | Still in the chest |
|---|---|---|---|---|---|---|
| $5,000 | $168 each ($336 the Sunday after a Grand) | $672 → $941 | **$2,789** | $1,200 | $960 | $1,051 |
| $10,000 | $336 each ($672) | $1,344 → $1,882 | **$5,578** | $2,400 | $1,920 | $2,102 |
| $30,000 | $1,008 each ($2,016) | $4,032 → $5,645 | **$16,733** | $7,200 | $5,760 | $6,307 |

The Grand Prize grows cycle after cycle because 40% always stays. Prizes are in NEAR, so their dollar value moves with NEAR.

## What else is in the guild

- **Outlaws:** 7 animals × 6 classes; join with a free NEP-413 signature, get a portrait painted by NEAR AI Cloud (FLUX.2), rank up for bonus tickets (/my-outlaw).
- **Tobias the bard:** a Telegram bot on **NEAR AI Cloud**. Holders vote his weekly mission and his "soul" in the Guild Council (/council), weighted by draw tickets; fixed rules (no price talk, no invented facts) can't be voted away.
- **The Heist:** the crash game, separate repo above.

## Repository

```
contracts/guild-chest     the Guild Chest (Rust, near-sdk 5): split, draw, payouts, safety valve, views, 12 tests
scripts/draw.mjs          builds the eligible list from chain data and submits it to the chest
scripts/chest/            testnet demo, mainnet deploy (deletes every key), hourly tax forwarder
app/ components/ lib/     the Next.js site (robinhoot.fun): /chest, /raid, /draws, /loot, /my-outlaw, /council, /api/telegram
.github/workflows         contract tests, testnet demo, mainnet deploy, Sunday draw, tax forwarder, typecheck
docs/SITE-NOTES.md        earlier notes on the site and wallet integration
```

## Built during the hackathon

Code written from 19 Oct 2026 counts (rule Q-001). The site, outlaws, ranks, Council and bard were built 25–31 Oct; the Guild Chest contract, its demo, the live chest page, the draw integration and the tax forwarder from 1 Nov. The token was launched on JustHoot during the hackathon (6 Nov); we never touch the token contract itself. Mainnet chest deployment is scheduled for the week of 16 Nov; the first paid draw is Sunday 22 Nov 2026 (Grand Prize 13 Dec).

The meme, the art and the outlaws are RobinHoot's. No promise of profit: prizes depend on trading volume.
