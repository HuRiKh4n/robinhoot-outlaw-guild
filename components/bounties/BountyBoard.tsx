'use client';

import { ContractSymbol, ArrowMark } from './GuildArt';
import { useState } from 'react';
import Link from 'next/link';
import { bounties, categories, categoryNotes, type BountyCategory } from '@/lib/bounties/catalogue';

export default function BountyBoard() {
  const [category, setCategory] = useState<BountyCategory | 'All'>('All');
  const visible = bounties.filter(bounty => category === 'All' || bounty.category === category);
  return <section className="bounty-contracts" aria-labelledby="contracts-title">
    <div className="bounty-section-heading"><div><p className="eyebrow">FROM THE GUILD ARCHIVES</p><h2 id="contracts-title">The contracts.</h2></div><span className="bounty-count" role="status">{visible.length} {category === 'All' ? '' : `${category.toLowerCase()} `}mission previews</span></div>
    <div className="bounty-filters" role="group" aria-label="Filter missions by category">
      {(['All', ...categories] as const).map(value => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}>{value === 'All' ? 'All contracts' : `${value} Bounties`}</button>)}
    </div>
    <p className="bounty-filter-description">{category === 'All' ? 'Six jobs, no takers yet. Which one has your name on it?' : categoryNotes[category]}</p>
    <div className="bounty-grid">
      {visible.map(bounty => <article key={bounty.id} className={`bounty-contract contract-${bounty.category.toLowerCase()}`} aria-labelledby={`title-${bounty.id}`}>
        <div className="contract-topline"><span>{bounty.id} / {bounty.category.toUpperCase()}</span><span className="contract-seal"><ContractSymbol id={bounty.id}/></span></div>
        <div className="contract-watermark"><ContractSymbol id={bounty.id}/></div>
        <p className="contract-status">PREVIEW / COMING SOON</p>
        <h3 id={`title-${bounty.id}`}>{bounty.title}</h3>
        <p className="contract-description">{bounty.description}</p>
        <dl className="contract-meta"><div><dt>Category</dt><dd>{bounty.category} Bounties</dd></div><div><dt>Difficulty</dt><dd>{bounty.difficulty}</dd></div></dl>
        <Link className="contract-link" href={`/bounties/${bounty.slug}`} aria-label={`Read mission: ${bounty.title}`}>READ THE CONTRACT <ArrowMark /></Link>
      </article>)}
    </div>
  </section>;
}
