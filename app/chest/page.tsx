import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import ChestLive from '@/components/chest/ChestLive';

export const metadata: Metadata = { title: 'The Guild Chest | RobinHoot', description: 'A NEAR contract with no owner that holds the prizes and pays the winners by itself.' };

export default function ChestPage() {
  return <main className="raid-page page-dark"><SiteHeader />
    <section className="raid-hero">
      <Link className="raid-back" href="/loot">← BACK TO THE LOOT</Link>
      <p className="raid-kicker">No owner. No keys. No withdraw.</p>
      <h1>The Guild Chest</h1>
      <div className="ts-rule" aria-hidden="true"><i /></div>
      <p className="raid-lead">The prizes don&apos;t sit in anyone&apos;s wallet. They sit in a NEAR contract that nobody controls, not even the founder. It splits every coin that comes in, rolls its own dice every Sunday and pays the winners by itself.</p>
    </section>
    <ChestLive />
    <section className="raid-rules" aria-labelledby="who-title">
      <h2 id="who-title">Who can do what</h2>
      <div className="chest-roles">
        <div><h3>Anyone</h3><p>Send NEAR to the chest. Read every pot, every draw and every winner, live from the chain.</p></div>
        <div><h3>The founder</h3><p>Forwards the trading tax to the chest. Can add to the pots. <b>Cannot take anything out.</b></p></div>
        <div><h3>The draw bot</h3><p>Once a week, hands in the list of holders who stayed. <b>Cannot pick winners, cannot move coins,</b> cannot draw twice or off schedule.</p></div>
        <div><h3>The contract</h3><p>Rolls the dice with NEAR&apos;s own randomness, picks the winners (more tickets, more chances) and pays them in the same transaction.</p></div>
        <div><h3>The reserve</h3><p>The founder&apos;s wallet gets 20% of the guild share, used to top up the pots in quiet weeks.</p></div>
        <div><h3>If the bot dies</h3><p>After 5 weeks without a draw, anyone can push the pots to the reserve, so nothing is stuck forever.</p></div>
      </div>
    </section>
    <section className="raid-rules" aria-labelledby="split-title">
      <h2 id="split-title">Where every coin goes</h2>
      <ol className="raid-how">
        <li><b>20%</b> to the dev, for building the guild.</li>
        <li><b>80%</b> to the guild, split again by the contract: <b>30%</b> weekly pot (3 winners: 40/30/30), <b>50%</b> Grand Prize pot (60% paid every 4th Sunday to 5 winners: 50% + 4 × 12.5%, 40% rolls over), <b>20%</b> reserve.</li>
        <li>Few holders on the list? Only the drawn ones are paid; the rest stays for next time.</li>
        <li>The code is public and tested: <a href="https://github.com/HuRiKh4n/robinhoot-outlaw-guild/tree/main/contracts/guild-chest" target="_blank" rel="noreferrer">contracts/guild-chest</a>. <Link href="/draws">How the list is made →</Link></li>
      </ol>
    </section>
    <footer><b>🦊 ROBINHOOT</b><p>A TALE FROM THE KINGDOM OF NEAR</p><p>No promises of profit, only a fair split.</p></footer>
  </main>;
}
