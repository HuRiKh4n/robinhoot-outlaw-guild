import SiteHeader from "@/components/SiteHeader";
import Link from "next/link";
import HeroMarquee from "@/components/HeroMarquee";
import Particles from "@/components/motion/Particles";
import HeroScenery from "@/components/motion/HeroScenery";
import Reveal from "@/components/motion/Reveal";
import { portraits, webDerivatives } from "@/lib/character/appearance";

const pick = (id: string) => portraits.find(asset => asset.id === id);
const steps = [
  { n: "1", title: "Pick a creature", line: "Fox, wolf, raccoon, rabbit or badger. Each one carries its own kind of trouble.", art: pick("fox-ranger-patched-cloak") ?? pick("wolf-patched-cloak") },
  { n: "2", title: "Choose a calling", line: "Archer, mage, thief, fighter, wanderer or trickster. What will they whisper about you in the taverns?", art: pick("raccoon-mage-dark-sorcerer") ?? pick("wolf-dark-sorcerer") },
  { n: "3", title: "Dress for the job", line: "Sixteen outfits per creature. Then print your WANTED poster and hang it where the Sheriff can see it.", art: pick("badger-warrior-royal-guard") ?? pick("wolf-royal-guard") },
];

const road: { n: string; title: string; line: string; done: boolean; treasure?: boolean }[] = [
  { n: "I", title: "The Broke Fox", line: "The tale is told and the tavern doors are open.", done: true },
  { n: "II", title: "Assemble the Guild", line: "Eighty outlaws painted so far. Make yours and print your poster.", done: true },
  { n: "III", title: "The Bounty Hunt", line: "The board is pinned to the tavern wall. Taking on jobs comes next.", done: false },
  { n: "IV", title: "Loot for the Trenches", line: "The chest is still locked. We open it together, once the rules are fair and written down.", done: false, treasure: true },
  { n: "V", title: "Kingdom Without Kings", line: "One day the guild will write its own chapters.", done: false },
];

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero" id="legend">
        <HeroScenery />
        <Particles kind="ember" count={22} seed={11} />
        <p className="eyebrow">A TALE FROM THE KINGDOM OF NEAR</p>
        <div className="herofox">
          <picture><source srcSet="/images/robinhoot-fox.webp" type="image/webp" /><img src="/images/robinhoot-fox.png" alt="RobinHoot, the broke fox of NEAR" width={1024} height={1536} /></picture>
        </div>
        <h1>THE CASTLES ARE FULL.<br /><em>THE TRENCHES ARE RISING.</em></h1>
        <p>They built the castles. They hoarded the gold. Then a broke fox showed up with a torn cloak, a rusty cup, and a plan.</p>
        <div className="actions">
          <Link className="button" href="/my-outlaw">MAKE YOUR OUTLAW →</Link>
          <a className="secondary" href="#tale">or hear the tale first ↓</a>
        </div>
        <HeroMarquee />
        <small>STEAL FROM THE WHALES. GIVE TO THE TRENCHES.</small>
      </section>

      <section id="tale" className="tale" aria-labelledby="tale-title">
        <p className="eyebrow">CHAPTER ONE</p>
        <Reveal className="tale-head"><h2 id="tale-title" className="ink-title">Once upon a time, in the kingdom of NEAR…</h2></Reveal>
        <Particles kind="firefly" count={14} seed={23} />
        <Reveal className="tale-text">
          <p><span className="dropcap">A</span> whale grew so fat on gold that he bought the castles, the coins and even the candles. He called himself the Sheriff, and he made one rule: the gold stays up here, the mud stays down there.</p>
          <p>Down in the trenches lived everybody else. Foxes with torn cloaks. Raccoons with quick paws. Badgers who never back down, rabbits who hear everything, wolves who forget nothing.</p>
          <p>One rainy night a broke fox climbed out of the mud with a bow he had carved himself. He looked up at the castle, counted the windows, and grinned.</p>
          <p className="tale-end">That was the night the guild was born.</p>
        </Reveal>
      </section>

      <section className="villain" aria-labelledby="villain-title">
        <Particles kind="coin" count={12} seed={5} />
        <figure className="villain-portrait">
          <picture>
            <source srcSet="/villain/sheriff-of-whaleingham.webp" type="image/webp" />
            <img src="/villain/sheriff-of-whaleingham.png" width={1027} height={1531} alt="The Sheriff of Whaleingham, a giant crowned whale in golden armor and an ermine cape, hugging a chest of gold coins" loading="lazy" decoding="async" />
          </picture>
        </figure>
        <div className="villain-copy">
          <p className="eyebrow">THE VILLAIN OF OUR TALE</p>
          <h2 id="villain-title">THE SHERIFF OF<br /><em>WHALEINGHAM.</em></h2>
          <p>He owns the castles, the coins and the candles. He buys the dip before you see it and sells the top before you feel it. Every chest in the kingdom ends up under his flipper.</p>
          <blockquote className="decree">
            <span>BY ROYAL DECREE</span>
            &ldquo;The gold belongs in the castle. The trenches may keep the mud.&rdquo;
            <cite>— H.M. the Sheriff of Whaleingham</cite>
          </blockquote>
          <p className="villain-target">The whales have the gold.<br />The outlaws take it back to the trenches.</p>
          <Link className="button" href="/my-outlaw">STEAL FROM THE WHALES →</Link>
        </div>
      </section>

      <section id="join" className="join" aria-labelledby="join-title">
        <p className="eyebrow">JOIN THE GUILD</p>
        <h2 id="join-title">Your outlaw, in three moves.</h2>
        <ol className="join-steps">
          {steps.map(step => <li key={step.n}>
            {step.art && <img src={webDerivatives(step.art.src).thumb} width={240} height={360} alt="" loading="lazy" decoding="async" />}
            <b>{step.n}</b>
            <h3>{step.title}</h3>
            <p>{step.line}</p>
          </li>)}
        </ol>
        <Link className="button" href="/my-outlaw">MAKE YOUR OUTLAW →</Link>
      </section>

      <section className="bounty-home-callout" aria-labelledby="home-bounty-title">
        <div>
          <p className="eyebrow">PINNED TO THE TAVERN WALL</p>
          <h2 id="home-bounty-title">THE BOUNTY BOARD</h2>
          <p>Six jobs for brave outlaws: tall tales, wanted posters, songs for the trenches. The board is up. The payouts aren&rsquo;t, yet.</p>
        </div>
        <Link className="button" href="/bounties">READ THE BOARD →</Link>
      </section>

      <section id="roadmap" className="roadmap" aria-labelledby="roadmap-title">
        <p className="eyebrow">THE ROAD AHEAD</p>
        <h2 id="roadmap-title">FROM ONE BROKE FOX<br />TO AN ARMY OF OUTLAWS.</h2>
        <ol className="treasure-map">
          {road.map(stop => <li key={stop.n} className={stop.done ? "is-done" : stop.treasure ? "is-treasure" : undefined}>
            <span className="map-pin" aria-hidden="true">{stop.done ? "✓" : stop.treasure ? "✕" : ""}</span>
            <b>CHAPTER {stop.n}</b>
            <h3>{stop.title}</h3>
            <p>{stop.line}</p>
          </li>)}
        </ol>
      </section>

      <footer>
        <b>🦊 ROBINHOOT</b>
        <p>A TALE FROM THE KINGDOM OF NEAR · $RHOOT</p>
        <p>A meme, a story and a guild. No treasure is promised, only the adventure.</p>
      </footer>
    </main>
  );
}
