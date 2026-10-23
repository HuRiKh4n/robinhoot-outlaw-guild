import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import BountyBoard from '@/components/bounties/BountyBoard';

export const metadata: Metadata = { title: 'Bounty Board | RobinHoot', description: 'Explore creative, social and guild mission previews. Submissions, reputation and rewards are not live.' };
export default function Bounties() {
  return <main className="bounty-page"><SiteHeader />
    <section className="bounty-hero" aria-labelledby="bounty-title">
      <Link className="bounty-back" href="/">← BACK TO THE LEGEND</Link>
      <p className="eyebrow">CHAPTER III · THE BOUNTY HUNT</p>
      <p className="bounty-kicker">THE GUILD HAS STORIES TO TELL.</p>
      <h1 id="bounty-title">THE BOUNTY<br /><em>BOARD.</em></h1>
      <p className="bounty-lead">For the artists in worn cloaks. The storytellers by the fire. The outlaws who build something worth belonging to.</p>
      <div className="bounty-preview-notice"><strong>PREVIEW / COMING SOON</strong><p>Explore the contracts. Submissions and verification are not available yet. No mission can be completed here, and no points, badges or rewards are being issued.</p></div>
      <div className="bounty-hero-links"><a href="#contracts-title">EXPLORE CONTRACTS ↓</a><a href="#guild-reputation">REPUTATION & REWARDS ↓</a></div>
    </section>
    <div className="bounty-content"><BountyBoard />
      <section id="guild-reputation" className="bounty-future" aria-labelledby="reputation-title">
        <div className="future-intro"><p className="eyebrow">EARN A STORY. NOT A NUMBER.</p><h2 id="reputation-title">Guild Reputation</h2><span className="future-label">CONCEPT PREVIEW · NOT LIVE</span><p>A future reputation system could recognise thoughtful, verified contributions over time. Connecting a wallet or creating a character does not grant reputation or guild membership.</p></div>
        <div className="future-notes"><h3>What recognition could look like</h3><ul><li><strong>Craft:</strong> original creative work with clear attribution.</li><li><strong>Story:</strong> useful storytelling that welcomes others.</li><li><strong>Service:</strong> constructive community contributions.</li></ul><p>Future badges may describe contribution history. Names, criteria, verification, moderation and appeals still need to be defined. No badge is currently earned, assigned or shown as owned.</p></div>
      </section>
      <section className="bounty-rewards" aria-labelledby="rewards-title"><p className="eyebrow">THE LOOT CHEST STAYS CLOSED</p><h2 id="rewards-title">Rewards, responsibly imagined.</h2><span className="future-label">PLANNED · NOTHING TO CLAIM</span><p>Future recognition might include community spotlights or commemorative badges, subject to published rules and a working review process. No rewards are currently available.</p><p>There is no guaranteed token distribution, payment, financial return or entitlement. Reward formats, eligibility and any funding have not been established. No wallet transaction or paid action is needed to browse this board.</p><Link className="bounty-text-link" href="/#roadmap">SEE THE ACTUAL ROADMAP →</Link></section>
      <aside className="bounty-next"><h2>Every outlaw starts with a character.</h2><p>Your creator, local draft and Guild Passport remain yours to explore. They are character previews, not registered identities.</p><Link className="button" href="/my-outlaw">OPEN MY OUTLAW →</Link></aside>
    </div>
    <footer><b>ROBINHOOT · OUTLAW GUILD</b><p>CONTRACT PREVIEWS. NO SUBMISSIONS. NO PROMISED REWARDS.</p></footer>
  </main>;
}
