'use client';

import Link from 'next/link';
import { castleGlow, chestGlow, coinSparkle, fire, hotspots, type Box, type Hotspot } from '@/lib/hideout';
import { useSound } from '@/components/sound/SoundProvider';
import Particles from '@/components/motion/Particles';

const place = (wide: Box, tall: Box) => ({
  '--x': wide[0], '--y': wide[1], '--w': wide[2], '--h': wide[3],
  '--tx': tall[0], '--ty': tall[1], '--tw': tall[2], '--th': tall[3],
}) as React.CSSProperties;

/** The homepage: the outlaws' hideout. Every lit object is a door (real links/buttons over the art). */
export default function HideoutScene() {
  const { on, toggle, play } = useSound();

  const content = (spot: Hotspot) => <>
    <span className="hs-spark" aria-hidden="true" />
    <span className="hs-label"><strong>{spot.label}</strong><small>{spot.action === 'music' ? (on ? 'Playing · tap to stop' : 'Silent · tap to play') : spot.hint}</small></span>
  </>;

  return <section className="hideout" aria-labelledby="hideout-title">
    <h2 id="hideout-title" className="visually-hidden">The outlaws&rsquo; hideout</h2>
    <div className="hideout-stage">
      <picture className="hideout-art">
        <source media="(max-width: 700px)" type="image/webp" sizes="100vw" srcSet="/hideout/hideout-tall-828.webp 828w, /hideout/hideout-tall-1200.webp 1200w" />
        <img src="/hideout/hideout-wide-1600.webp" srcSet="/hideout/hideout-wide-1100.webp 1100w, /hideout/hideout-wide-1600.webp 1600w, /hideout/hideout-wide-2400.webp 2400w" sizes="100vw" width={2400} height={1340}
          alt="A cosy, messy hideout under the trenches: a fox pins WANTED posters to the wall, an open storybook lies on the table, a window shows the whale's golden castle, a chained chest glows by the fire, a raccoon bard plays the lute and a bounty board hangs on the right." fetchPriority="high" />
      </picture>

      <div className="hideout-fx" aria-hidden="true">
        <span className="fx fx-fire" style={place(fire.wide, fire.tall)}><Particles kind="ember" count={10} seed={31} /></span>
        <span className="fx fx-castle" style={place(castleGlow.wide, castleGlow.tall)} />
        <span className="fx fx-chest" style={place(chestGlow.wide, chestGlow.tall)} />
        <span className="fx fx-coin" style={place(coinSparkle.wide, coinSparkle.tall)} />
      </div>

      <ul className="hotspots">
        {hotspots.map(spot => <li key={spot.id} className={`hs hs-${spot.id}`} style={place(spot.wide, spot.tall)}>
          {spot.action === 'music'
            ? <button type="button" className="hs-target" aria-pressed={on} onClick={toggle} aria-label={`${spot.label}: ${on ? 'on' : 'off'}`}>{content(spot)}</button>
            : spot.href?.startsWith('#')
              ? <a className="hs-target" href={spot.href}>{content(spot)}</a>
              : <Link className="hs-target" href={spot.href!} onClick={() => play(spot.id === 'wanted' ? 'hit' : 'coin')}>{content(spot)}</Link>}
        </li>)}
      </ul>
    </div>
  </section>;
}
