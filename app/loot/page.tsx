import { RANKS } from '@/lib/raid/ranks';
import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { lootWallets, walletAddress } from '@/lib/loot';

export const metadata: Metadata = { title: 'The Loot | RobinHoot', description: 'Where the gold goes: 1 billion $RHOOT, a fair launch, a 2% Sheriff’s tax paid in NEAR, 80% of it to the guild. Every wallet public.' };
export const revalidate = 3600;

const Split = ({ parts }: { parts: { pct: number; label: string; note: string; tone: string }[] }) =>
  <div className="loot-split">
    <div className="loot-bar" aria-hidden="true">{parts.map(part => <span key={part.label} className={`tone-${part.tone}`} style={{ flexGrow: part.pct }}>{part.pct}%</span>)}</div>
    <ul>{parts.map(part => <li key={part.label}><i className={`tone-${part.tone}`} aria-hidden="true" /><b>{part.pct}% · {part.label}</b><span>{part.note}</span></li>)}</ul>
  </div>;

export default function LootPage() {
  return <main className="loot-page page-dark"><SiteHeader />
    <section className="loot-hero">
      <Link className="raid-back" href="/">← BACK TO THE HIDEOUT</Link>
      <p className="raid-kicker">Every coin accounted for</p>
      <h1>The Loot</h1>
      <div className="ts-rule" aria-hidden="true"><i /></div>
      <p className="raid-lead">The Sheriff hides his books. The guild nails its own to the tavern door. Here is where every coin of $RHOOT comes from and where it goes.</p>
    </section>

    <section className="loot-section" aria-labelledby="coin-title">
      <h2 id="coin-title">The coin</h2>
      <div className="raid-terms">
        <div><span>Supply</span><strong>1,000,000,000</strong><small>$RHOOT, and never a coin more</small></div>
        <div><span>Launch</span><strong>Fair, on JustHoot</strong><small>everyone buys on the same curve</small></div>
        <div><span>Presale</span><strong>None</strong><small>no private round, no free team tokens</small></div>
      </div>
    </section>

    <section className="loot-section" aria-labelledby="tax-title">
      <h2 id="tax-title">The Sheriff&rsquo;s tax: 2%</h2>
      <p className="loot-lead">Every buy and every sell pays 2%, in NEAR. The Sheriff spends his on himself. Ours goes back to the trenches.</p>
      <Split parts={[
        { pct: 80, label: 'The Guild Chest', note: 'Prizes for the outlaws, paid in NEAR', tone: 'gold' },
        { pct: 20, label: 'The Hideout', note: 'Site, art, videos and tools', tone: 'ember' },
      ]} />
      <p className="loot-example">Example: 1,000 NEAR traded in a week → 20 NEAR of tax → 16 NEAR to the guild, 4 NEAR to the hideout.</p>
    </section>

    <section className="loot-section" aria-labelledby="chest-title">
      <h2 id="chest-title">Hold &amp; Win</h2>
      <p className="loot-lead"><b>Hold the coin. Win NEAR. Every Sunday.</b> No sign-up, no forms: the chain knows who stayed. Three Sundays out of four it&rsquo;s the weekly prize; the fourth is the Grand Prize.</p>
      <Split parts={[
        { pct: 36, label: 'The weekly prizes', note: 'Sundays 1, 2 and 3 of every cycle: 3 holders drawn, the Lucky Outlaw takes 40%, two more take 30% each', tone: 'gold' },
        { pct: 54, label: 'The Grand Prize', note: 'Builds up for four weeks; on the 4th Sunday, 5 holders drawn: The Big Heist takes 50%, four more take 12.5% each. 40% stays in the chest', tone: 'blood' },
        { pct: 10, label: 'The reserve', note: 'Kept for lean weeks, so the prizes stay steady', tone: 'ember' },
      ]} />
      <ol className="raid-how">
        <li><b>Hold.</b> At least $50 of the coin for 3 days in a row for a weekly prize, 5 days for the Grand Prize. <Link href="/raid">Check if you are in →</Link></li>
        <li><b>That&rsquo;s it.</b> Every holder who stayed is in the draw automatically. The longer you hold, the more draws you are in.</li>
        <li><b>Hold more, get more tickets.</b> Your tickets follow your lowest balance in those days: a little edge for big holders, a real chance for everyone.
          <div className="loot-tickets" role="table" aria-label="Tickets by balance">
            {[['$50', 1], ['$200', 2], ['$300', 3], ['$400', 4], ['$500', 5], ['$1,000', 6], ['$2,000', 7], ['$3,000', 8], ['$4,000', 9], ['$5,000+', 10]].map(([usd, t]) => <div key={String(usd)} role="row"><span role="cell">{usd}</span><b role="cell">{t} 🎟️</b></div>)}
          </div>
          Linked wallets (sub-accounts of the same parent, or wallets funded by the same wallet) count as one.
        </li>
        <li><b>Ride with the Guild, earn your rank.</b> Make your outlaw and join the Guild (one per wallet, free): your rank adds bonus tickets on top, as long as you qualify for the draw. Your rank grows every day you hold at least $50 in a row; sell below it and you start again.
          <div className="loot-tickets" role="table" aria-label="Bonus tickets by rank">
            {RANKS.map(rank => <div key={rank.id} role="row"><span role="cell">{rank.icon} {rank.name}{rank.days ? ` · ${rank.days} days` : ''}</span><b role="cell">+{rank.bonus} 🎟️</b></div>)}
          </div>
          A big holder who is a Legend can reach 15 tickets; a $50 Legend has 6. <Link href="/my-outlaw">Make your outlaw →</Link>
        </li>
        <li><b>Drawn in the open.</b> Every Sunday at 20:00 UTC, the dice is the first NEAR block after that moment. Anyone can check it. <Link href="/draws">See the draws →</Link></li>
        <li><b>Paid in NEAR, announced on X.</b> Straight from the Guild Chest to the winners&rsquo; wallets.</li>
      </ol>
    </section>

    <section className="loot-section" aria-labelledby="example-title">
      <h2 id="example-title">What the chest could hold</h2>
      <p className="loot-lead">An example, not a promise: if the guild trades <b>$20,000 a day</b>, this is how one four-Sunday cycle would look. Less volume, smaller prizes; more volume, bigger ones.</p>
      <div className="loot-flow" aria-label="$400 of tax a day, $8,960 every four weeks into the Guild Chest">
        <div><strong>$400</strong><span>tax a day</span></div>
        <i aria-hidden="true">→</i>
        <div><strong>$8,960</strong><span>every 4 weeks into the Guild Chest</span></div>
      </div>
      <div className="loot-cards">
        <article className="loot-card">
          <p className="loot-card-kicker">Sundays 1, 2, 3 · 3 holders each</p>
          <div className="loot-card-top"><span>🍀 The Lucky Outlaw</span><strong>$430</strong></div>
          <div className="loot-card-rest"><span>2 more holders</span><strong>$322 each</strong></div>
          <p className="loot-card-note">About $1,075 every weekly Sunday. Hold 3 days and you are in.</p>
        </article>
        <article className="loot-card loot-card-grand">
          <p className="loot-card-kicker">Sunday 4 · the Grand Prize · 5 holders</p>
          <div className="loot-card-top"><span>👑 The Big Heist</span><strong>$1,452</strong></div>
          <div className="loot-card-rest"><span>4 more holders</span><strong>$363 each</strong></div>
          <p className="loot-card-note">First cycle. The chest keeps 40% for the next one, so it grows: up to about <b>$2,420</b> and <b>$605 each</b>.</p>
        </article>
      </div>
      <p className="loot-example">Another 10% of the chest (about $900 a cycle) is kept as a reserve for lean weeks. Prizes are paid in NEAR, so their dollar value moves with the price of NEAR. Figures are rounded.</p>
    </section>

    <section className="loot-section" aria-labelledby="bag-title">
      <h2 id="bag-title">The founder&rsquo;s bag: 5%</h2>
      <p className="loot-lead">At launch the founder buys 5% on the same curve as everyone else, paying for it in NEAR. Then it is split into two public wallets.</p>
      <Split parts={[
        { pct: 3, label: 'The Herald (marketing)', note: 'Prizes, airdrops to early outlaws, partnerships. Any sale is small and announced.', tone: 'gold' },
        { pct: 2, label: 'The Founder (team)', note: 'No sales for 3 months. Then small amounts, always announced first.', tone: 'ember' },
      ]} />
    </section>

    <section className="loot-section" aria-labelledby="books-title">
      <h2 id="books-title">The open books</h2>
      <p className="loot-lead">Every wallet is public. Anyone can follow the gold on the chain.</p>
      <div className="loot-wallets">{lootWallets.map(wallet => {
        const address = walletAddress(wallet.key);
        return <article key={wallet.key}>
          <h3>{wallet.name}</h3>
          <p>{wallet.use}</p>
          {address
            ? <a href={`https://nearblocks.io/address/${address}`} target="_blank" rel="noopener noreferrer">{address} ↗</a>
            : <span className="loot-soon">Address published at launch</span>}
        </article>;
      })}</div>
    </section>

    <p className="loot-fine">$RHOOT is a meme, a story and a guild. It is not an investment and carries no promise of profit. Prizes depend on trading volume and can be small. Never share your seed phrase.</p>

    <footer><b>🦊 ROBINHOOT</b><p>A TALE FROM THE KINGDOM OF NEAR · $RHOOT</p><p>No promises of profit, only a fair split.</p></footer>
  </main>;
}
