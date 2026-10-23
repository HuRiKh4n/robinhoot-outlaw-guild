import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
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
    <article className="bounty-detail" aria-labelledby="mission-title">
      <div className="contract-topline"><span>{bounty.id} / {bounty.category.toUpperCase()}</span><span className="contract-seal" aria-hidden="true">RH</span></div>
      <p className="contract-status">PREVIEW / COMING SOON</p><h1 id="mission-title">{bounty.title}</h1><p className="detail-lead">{bounty.description}</p>
      <dl className="contract-meta"><div><dt>Category</dt><dd>{bounty.category} Bounties</dd></div><div><dt>Difficulty</dt><dd>{bounty.difficulty}</dd></div><div><dt>Availability</dt><dd>Preview only · submissions closed</dd></div></dl>
      <section aria-labelledby="requirements-title"><h2 id="requirements-title">The proposed brief</h2><p>These are draft requirements, not an open call. Final rules may change before launch.</p><ul>{bounty.requirements.map(item => <li key={item}>{item}</li>)}</ul></section>
      <section aria-labelledby="evidence-title"><h2 id="evidence-title">Evidence a future submission could include</h2><ul>{bounty.futureEvidence.map(item => <li key={item}>{item}</li>)}</ul><p>Do not send private keys, seed phrases or sensitive personal data. There is no upload or submission endpoint on this page.</p></section>
      <section className="contract-closed" aria-labelledby="closed-title"><h2 id="closed-title">This contract is not accepting submissions.</h2><p>A real submission and verification backend, published review criteria and moderation are required before missions can open. There is no completion action, points balance or reward to claim.</p><p>Wallet authentication for submissions is a future feature. Connecting a wallet now does not submit evidence, authenticate ownership or register you on-chain.</p></section>
    </article>
    <div className="bounty-detail-footer"><Link className="button" href="/bounties">EXPLORE OTHER CONTRACTS →</Link><Link className="bounty-text-link" href="/bounties#guild-reputation">REPUTATION & REWARDS PREVIEW →</Link></div>
  </div></main>;
}
