import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import DrawList from '@/components/draws/DrawList';

export const metadata: Metadata = { title: 'The Draws | RobinHoot', description: 'Every Hold & Win draw, its NEAR seed block and its winners. Anyone can check it.' };

export default function DrawsPage() {
  return <main className="raid-page page-dark"><SiteHeader />
    <section className="raid-hero">
      <Link className="raid-back" href="/loot">← BACK TO THE LOOT</Link>
      <p className="raid-kicker">Drawn in the open</p>
      <h1>The Draws</h1>
      <div className="ts-rule" aria-hidden="true"><i /></div>
      <p className="raid-lead">Every Sunday, and on the 1st of every month, the guild draws its winners from the holders who stayed. The dice is the first NEAR block after 20:00 UTC: nobody can know it in advance, and anyone can check it.</p>
    </section>
    <DrawList />
    <section className="raid-rules" aria-labelledby="verify-title">
      <h2 id="verify-title">How to check a draw</h2>
      <ol className="raid-how">
        <li><b>The seed.</b> Look up the seed block on a NEAR explorer: its hash is the dice.</li>
        <li><b>Who could win.</b> Every holder whose balance never dropped below the minimum at the listed checkpoint blocks, every 6 hours over 72 hours (120 for the Grand Prize), plus 6 extra moments derived from the seed.</li>
        <li><b>Who won.</b> The eligible accounts in alphabetical order; winner number i is at position SHA-256(seed hash : kind : i) modulo the accounts still in the pot.</li>
        <li><b>Run it yourself.</b> The draw program is public: <code>node scripts/draw.mjs weekly YYYY-MM-DD</code> gives the same winners.</li>
      </ol>
    </section>
    <footer><b>🦊 ROBINHOOT</b><p>A TALE FROM THE KINGDOM OF NEAR</p><p>No promises of profit, only a fair split.</p></footer>
  </main>;
}
