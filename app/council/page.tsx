import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import CouncilBoard from '@/components/council/CouncilBoard';

export const metadata: Metadata = {
  title: 'The Guild Council | RobinHoot',
  description: 'Holders steer Tobias, the Guild’s AI bard on NEAR AI Cloud: vote his weekly mission and changes to his SOUL.',
};

export default function CouncilPage() {
  return <main className="raid-page page-dark"><SiteHeader />
    <section className="raid-hero">
      <Link className="raid-back" href="/near">← BUILT ON NEAR</Link>
      <p className="raid-kicker">The holders hold the reins</p>
      <h1>The Guild Council</h1>
      <div className="ts-rule" aria-hidden="true"><i /></div>
      <p className="raid-lead">Tobias, the Guild&rsquo;s raccoon bard, answers the outlaws on Telegram and thinks on NEAR AI Cloud, inside secure hardware. The Guild steers him: every week the holders vote his mission, and Captains and Legends can put changes to his SOUL, his voice, to a vote. His fixed rules keep him safe: no money, no price talk, no promises.</p>
    </section>
    <CouncilBoard />
    <footer><b>🦊 ROBINHOOT</b><p>A TALE FROM THE KINGDOM OF NEAR</p><p><Link className="profile-inline-link" href="/near">HOW IT WORKS →</Link></p></footer>
  </main>;
}
