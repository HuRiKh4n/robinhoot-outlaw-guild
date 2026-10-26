import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import RaidChecker from '@/components/raid/RaidChecker';
import { raidRules, type RaidRules } from '@/lib/raid/eligibility';

export const metadata: Metadata = { title: 'The Weekly Raid | RobinHoot', description: 'Hold your $RHOOT for three days and your name goes into the raid. Check whether you are ready.' };
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
      <p className="raid-lead">The loot from the Sheriff&rsquo;s tax goes to outlaws who stay. Hold for three days in a row for the weekly prize, five days for the monthly Grand Prize, and your name can be called when the chest opens.</p>
    </section>

    <section className="raid-rules" aria-labelledby="rules-title">
      <h2 id="rules-title">This week&rsquo;s terms</h2>
      {open && rules ? <div className="raid-terms">
        <div><span>Hold at least</span><strong>{Number(rules.minTokens).toLocaleString('en-US')} ${rules.symbol}</strong><small>about ${rules.minUsd} at the {rules.priceSource}</small></div>
        <div><span>For</span><strong>72 h · 120 h</strong><small>weekly prize · monthly Grand Prize, without dropping below once</small></div>
        <div><span>Week of</span><strong>{day(rules.weekStartsAt)}</strong><small>the amount is fixed until next Monday</small></div>
      </div> : <p className="raid-closed">{rules?.reason ?? 'The raid ledger could not be read right now. Come back soon.'}</p>}
      <ol className="raid-how">
        <li><b>The amount is set on Monday.</b> ${rules?.minUsd ?? 50} worth of $RHOOT at last week&rsquo;s average price. If the price moves during the week, the amount stays the same.</li>
        <li><b>The chain remembers.</b> When the chest opens, the guild looks at your balance every 6 hours over the last 72 hours (120 for the Grand Prize) and at 6 more moments picked by chance, at that very moment.</li>
        <li><b>Bring your outlaw.</b> Only wallets registered on the site with their own outlaw can win. Wearing your outlaw as your Telegram picture earns you the guild&rsquo;s respect.</li>
        <li><b>Every check must pass.</b> Buy the day before, or sell and buy back in between, and the ledger shows it.</li>
        <li><b>The prize is paid in NEAR,</b> from the Guild Chest: a weekly prize for 5 outlaws, and every month a Grand Prize for 10. Holding is your ticket. <Link href="/loot">Where the gold comes from →</Link></li>
      </ol>
    </section>

    <RaidChecker open={open} />

    <footer><b>🦊 ROBINHOOT</b><p>A TALE FROM THE KINGDOM OF NEAR · $RHOOT</p><p>A meme, a story and a guild. No promises of profit, only a fair split.</p></footer>
  </main>;
}
