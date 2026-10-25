import Link from 'next/link';
import { portraits, webDerivatives } from '@/lib/character/appearance';

/** Two endlessly scrolling rows of guild portraits for the home hero.
 *  Pure CSS animation (no JS timers); pauses on hover/focus and stops for reduced-motion users. */
const ready = portraits.filter(asset => asset.status === 'ready' && !asset.fallback && asset.outfit);

// Interleave species (each list rotated by a different offset) so neighbouring cards differ in both species and class.
const bySpecies = new Map<string, typeof ready>();
for (const asset of ready) bySpecies.set(asset.species, [...(bySpecies.get(asset.species) ?? []), asset]);
const lists = [...bySpecies.values()].map((list, k) => [...list.slice((k * 5) % list.length), ...list.slice(0, (k * 5) % list.length)]);
const mixed: typeof ready = [];
for (let i = 0; mixed.length < ready.length; i++) for (const list of lists) if (list[i]) mixed.push(list[i]);

const rows = [mixed.filter((_, i) => i % 2 === 0).slice(0, 22), mixed.filter((_, i) => i % 2 === 1).slice(0, 22)];

export default function HeroMarquee() {
  return <div className="hero-marquee" aria-label="Some of the guild's outlaws">
    {rows.map((row, r) => <div key={r} className={`marquee-row${r ? ' marquee-reverse' : ''}`}>
      {/* The list is rendered twice so the loop is seamless; the copy is hidden from assistive tech. */}
      {[0, 1].map(copy => <ul key={copy} className="marquee-track" aria-hidden={copy === 1 || undefined}>
        {row.map(asset => <li key={asset.id}>
          <Link href="/my-outlaw" tabIndex={copy ? -1 : undefined} className="marquee-card">
            <img src={webDerivatives(asset.src).thumb} width={240} height={360} alt={copy ? '' : `${asset.species} ${asset.class}, ${asset.outfit}`} decoding="async" />
            <span>{asset.species} · {asset.class}</span>
          </Link>
        </li>)}
      </ul>)}
    </div>)}
  </div>;
}
