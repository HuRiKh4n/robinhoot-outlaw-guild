import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import RaidChecker from '@/components/raid/RaidChecker';
import { raidRules, type RaidRules } from '@/lib/raid/eligibility';
import { TALE_LINE, coin } from '@/lib/token';

export const metadata: Metadata = { title: 'The Weekly Raid | RobinHoot', description: `Hold ${coin('the coin')} for three days and your name goes into the raid. Check whether you are ready.` };
export const revalidate = 1800;

const day = (time: number) => new Date(time).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });

export default async function RaidPage() {
  let rules: RaidRules | null = null;
  try { rules = await raidRules(); } catch { rules = null; }
  const open = Boolean(rules?.open);
  return <main className="raid-page page-dark"><SiteHeader />
    <section className="raid-hero">
      <Link className="raid-back" href="/bounties">← BACK TO THE BOUNTY BOARD</Link>
      <p className="raid-kicker">Every week, the guild rides out</p>
      <h1>The Weekly Raid</h1>
      <div className="ts-rule" aria-hidden="true"><i /></div>
      <p className="raid-lead">The loot from the Sheriff&rsquo;s tax goes to outlaws who stay. Hold for three days in a row for the weekly prize, five days for the Grand Prize, and your name can be called when the chest opens.</p>
    </section>

    <section className="raid-rules" aria-labelledby="rules-title">
      <h2 id="rules-title">This week&rsquo;s terms</h2>
      {open && rules ? <div className="raid-terms">
        <div><span>Hold at least</span><strong>{Number(rules.minTokens).toLocaleString('en-US')} ${rules.symbol}</strong><small>about ${rules.minUsd} at the {rules.priceSource}</small></div>
        <div><span>For</span><strong>72 h · 120 h</strong><small>weekly prize · Grand Prize, without dropping below once</small></div>
        <div><span>Week of</span><strong>{day(rules.weekStartsAt)}</strong><small>the amount is fixed until next Monday</small></div>
      </div> : <p className="raid-closed">{rules?.reason ?? 'The raid ledger could not be read right now. Come back soon.'}</p>}
      <ol className="raid-how">
        <li><b>The amount is set on Monday.</b> ${rules?.minUsd ?? 50} worth of {coin('the coin')} at last week&rsquo;s average price. If the price moves during the week, the amount stays the same.</li>
        <li><b>The chain remembers.</b> When the chest opens, the guild looks at your balance every 6 hours over the last 72 hours (120 for the Grand Prize) and at 6 more moments that nobody knows in advance.</li>
        <li><b>Tickets.</b> Your lowest balance in the window sets your tickets: $50 = 1, $200 = 2, up to 5 at $500, then one more for every extra $1,000, up to 10 at $5,000. Guild members get a rank bonus on top: Trench Rat +1, Outlaw (14 days held in a row) +2, Captain (30 days) +3, Legend (90 days) +5. <Link href="/my-outlaw">Make your outlaw →</Link></li>
        <li><b>Every check must pass.</b> Buy the day before, or sell and buy back in between, and the ledger shows it.</li>
        <li><b>The prize is paid in NEAR,</b> from the Guild Chest: every Sunday there is a draw: three Sundays out of four, 3 holders win the weekly prize; every fourth Sunday, 5 holders win the Grand Prize. Holding is your only ticket. <Link href="/draws">See the draws →</Link> <Link href="/loot">Where the gold comes from →</Link></li>
      </ol>
    </section>

    <RaidChecker open={open} />

    <footer><b>🦊 ROBINHOOT</b><p>{TALE_LINE}</p><p>A meme, a story and a guild. No promises of profit, only a fair split.</p></footer>
  </main>;
}
