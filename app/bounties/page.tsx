import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import BountyBoard from '@/components/bounties/BountyBoard';
import { GuildInsignia, RecognitionEmblem, TreasuryChest, ArrowMark } from '@/components/bounties/GuildArt';
import PreviewNotice from '@/components/bounties/PreviewNotice';

export const metadata: Metadata = { title: 'Bounty Board | RobinHoot', description: 'Enter the Outlaw Guild hall. Explore six mission contracts; submissions, reputation and rewards are not live.' };
const paths = [
  {id:'craft', title:'CRAFT', description:'Creative contributions', motto:'Leave your mark.'},
  {id:'story', title:'STORY', description:'Stories & community', motto:'Carry the legend.'},
  {id:'service', title:'SERVICE', description:'Constructive guild work', motto:'Strengthen the guild.'},
] as const;
export default function Bounties() {
  return <main className="bounty-page"><SiteHeader />
    <section className="bounty-hero" aria-labelledby="bounty-title">
      <Link className="bounty-back" href="/">← BACK TO THE LEGEND</Link>
      <div className="guild-hall-entry"><div className="hall-insignia"><GuildInsignia /><span>THE OUTLAW GUILD</span></div>
        <div className="hall-title"><p className="eyebrow">THE HALL OF CONTRACTS</p><h1 id="bounty-title">THE BOUNTY<br /><em>BOARD.</em></h1><p className="bounty-lead">Choose your path. Write the next legend.</p>
          <div className="bounty-hero-links"><a className="hall-enter" href="#contracts-title">ENTER THE HUNT <ArrowMark down /></a><a href="#guild-reputation">THE GUILD’S LEGACY <ArrowMark /></a></div>
        </div>
      </div>
    </section>
    <div className="bounty-content"><PreviewNotice /><BountyBoard />
      <section id="guild-reputation" className="bounty-future" aria-labelledby="reputation-title">
        <div className="bounty-section-heading"><div><p className="eyebrow">THREE PATHS. ONE GUILD.</p><h2 id="reputation-title">A legacy worth leaving.</h2></div><span className="future-label">GUILD REPUTATION · CONCEPT</span></div>
        <div className="recognition-paths">{paths.map(path=><article key={path.id} className={`recognition-card path-${path.id}`} aria-labelledby={`path-${path.id}`}><RecognitionEmblem path={path.id}/><h3 id={`path-${path.id}`}>{path.title}</h3><p>{path.description}</p><span className="badge-concept">CONCEPT /<br />NOT YET EARNABLE</span><small>{path.motto}</small></article>)}</div>
        <details className="guild-fine-print"><summary>How recognition could work</summary><p>Future badges may recognise verified contributions, not wallet balances or a connected account. Criteria, review, moderation and appeals still need to be defined. These emblems are concepts, not owned or earned badges, reputation scores or guild membership.</p></details>
      </section>
      <section className="bounty-rewards" aria-labelledby="rewards-title"><div className="treasury-scene"><span className="treasury-arch" aria-hidden="true"/><TreasuryChest /><span className="treasury-seal">GUILD TREASURY · SEALED</span></div><div className="treasury-copy"><p className="eyebrow">BEYOND THE IRON DOOR</p><h2 id="rewards-title">The Guild Treasury</h2><span className="future-label">PLANNED · NOT CLAIMABLE</span><p>The chest stays locked. No $RHOOT rewards are currently available. Reputation Points (RP) are a separate planned off-chain recognition system.</p><details className="guild-fine-print"><summary>Future rewards & availability</summary><p>Formats, eligibility and funding are undefined. There is no guaranteed token distribution, payment, allocation, reward amount or financial return. Nothing can be claimed or purchased here.</p></details><Link className="bounty-text-link" href="/#roadmap">FOLLOW THE ROADMAP →</Link></div></section>
      <aside className="bounty-next"><div><p className="eyebrow">YOUR STORY STARTS HERE</p><h2>Bring your outlaw to the hall.</h2></div><Link className="button" href="/my-outlaw">OPEN MY OUTLAW →</Link></aside>
    </div>
    <footer><b>ROBINHOOT · OUTLAW GUILD</b><p>THE LEGEND IS STILL BEING WRITTEN.</p></footer>
  </main>;
}
