'use client';

import { useState } from 'react';
import Link from 'next/link';
import { bounties, categories, categoryNotes, type BountyCategory } from '@/lib/bounties/catalogue';

export default function BountyBoard() {
  const [category, setCategory] = useState<BountyCategory | 'All'>('All');
  const visible = bounties.filter(bounty => category === 'All' || bounty.category === category);
  return <section className="bounty-contracts" aria-labelledby="contracts-title">
    <div className="bounty-section-heading"><div><p className="eyebrow">PINNED AT THE CROSSROADS</p><h2 id="contracts-title">Choose your kind of trouble.</h2></div><span className="bounty-count" role="status">{visible.length} {category === 'All' ? '' : `${category.toLowerCase()} `}mission previews</span></div>
    <div className="bounty-filters" role="group" aria-label="Filter missions by category">
      {(['All', ...categories] as const).map(value => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}>{value === 'All' ? 'All contracts' : `${value} Bounties`}</button>)}
    </div>
    <p className="bounty-filter-description">{category === 'All' ? 'Three paths into the legend. Every contract is a preview; none is accepting submissions.' : categoryNotes[category]}</p>
    <div className="bounty-grid">
      {visible.map(bounty => <article key={bounty.id} className="bounty-contract" aria-labelledby={`title-${bounty.id}`}>
        <div className="contract-topline"><span>{bounty.id} / {bounty.category.toUpperCase()}</span><span className="contract-seal" aria-hidden="true">RH</span></div>
        <p className="contract-status">PREVIEW / COMING SOON</p>
        <h3 id={`title-${bounty.id}`}>{bounty.title}</h3>
        <p className="contract-description">{bounty.description}</p>
        <dl className="contract-meta"><div><dt>Category</dt><dd>{bounty.category} Bounties</dd></div><div><dt>Difficulty</dt><dd>{bounty.difficulty}</dd></div></dl>
        <Link className="contract-link" href={`/bounties/${bounty.slug}`} aria-label={`Read mission: ${bounty.title}`}>READ THE CONTRACT <span aria-hidden="true">↗</span></Link>
      </article>)}
    </div>
  </section>;
}
