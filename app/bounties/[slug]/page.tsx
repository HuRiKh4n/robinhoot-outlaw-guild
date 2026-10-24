import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { ContractSymbol } from '@/components/bounties/GuildArt';
import PreviewNotice from '@/components/bounties/PreviewNotice';
import BountySubmission from '@/components/bounties/BountySubmission';
import { bounties, bountyBySlug } from '@/lib/bounties/catalogue';

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return bounties.map(({slug}) => ({slug})); }
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const bounty = bountyBySlug((await params).slug);
  return { title: bounty ? `${bounty.title} | RobinHoot Bounty Preview` : 'Contract not found | RobinHoot' };
}
export default async function BountyDetail({params}: Props) {
  const bounty = bountyBySlug((await params).slug);
  if (!bounty) notFound();
  return <main className="bounty-page"><SiteHeader /><div className="bounty-detail-shell">
    <Link className="bounty-back" href="/bounties">← BACK TO THE BOUNTY BOARD</Link>
    <PreviewNotice />
    <article className={`bounty-detail contract-${bounty.category.toLowerCase()}`} aria-labelledby="mission-title">
      <div className="contract-topline"><span>{bounty.id} / {bounty.category.toUpperCase()}</span><span className="contract-seal"><ContractSymbol id={bounty.id}/></span></div>
      <p className="contract-status">PREVIEW / COMING SOON</p><h1 id="mission-title">{bounty.title}</h1><p className="detail-lead">{bounty.description}</p>
      <dl className="contract-meta"><div><dt>Category</dt><dd>{bounty.category} Bounties</dd></div><div><dt>Difficulty</dt><dd>{bounty.difficulty}</dd></div><div><dt>Availability</dt><dd>Preview testing · evidence submissions open</dd></div></dl>
      <section aria-labelledby="requirements-title"><h2 id="requirements-title">The proposed brief</h2><ul>{bounty.requirements.map(item => <li key={item}>{item}</li>)}</ul></section>
      <details className="contract-evidence"><summary>Evidence a future submission could include</summary><ul>{bounty.futureEvidence.map(item => <li key={item}>{item}</li>)}</ul></details>
      <BountySubmission bountyId={bounty.id} />
    </article>
    <div className="bounty-detail-footer"><Link className="button" href="/bounties">EXPLORE OTHER CONTRACTS →</Link><Link className="bounty-text-link" href="/bounties#guild-reputation">REPUTATION & REWARDS PREVIEW →</Link></div>
  </div></main>;
}
