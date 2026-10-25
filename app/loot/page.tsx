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
      <h2 id="chest-title">The Guild Chest</h2>
      <p className="loot-lead">Two prizes, both won by work, never by luck.</p>
      <Split parts={[
        { pct: 60, label: 'The Bounty of the Week', note: 'One themed bounty every Monday, 1 to 3 winners on Sunday', tone: 'gold' },
        { pct: 40, label: 'The Assault on the Castle', note: 'Builds up all month into one big prize, chosen by the guild', tone: 'blood' },
      ]} />
      <ol className="raid-how">
        <li><b>Ride with the guild.</b> To win, hold at least $50 of $RHOOT for 72 hours in a row. The amount in tokens is set every Monday. <Link href="/raid">Check if you are ready →</Link></li>
        <li><b>Do the job.</b> Winners are picked for the work they bring: memes, art, stories, new outlaws at the campfire. <Link href="/bounties">See the bounty board →</Link></li>
        <li><b>Get paid in NEAR.</b> Straight from the Guild Chest, and every payout is posted in public.</li>
      </ol>
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
