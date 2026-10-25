/** The three stories told inside the hideout (opened from the book, the window and the chest). */

export function TaleStory() {
  return <>
    <p className="eyebrow">CHAPTER ONE</p>
    <h2 id="tale-title">Once upon a time, in the kingdom of NEAR…</h2>
    <div className="tale-text">
      <p><span className="dropcap">A</span> whale grew so fat on gold that he bought the castles, the coins and even the candles. He called himself the Sheriff, and he made one rule: the gold stays up here, the mud stays down there.</p>
      <p>Down in the trenches lived everybody else. Foxes with torn cloaks. Raccoons with quick paws. Badgers who never back down, rabbits who hear everything, wolves who forget nothing.</p>
      <p>One rainy night a broke fox climbed out of the mud with a bow he had carved himself. He looked up at the castle, counted the windows, and grinned.</p>
      <p className="tale-end">That was the night the guild was born.</p>
    </div>
  </>;
}

export function SheriffStory() {
  return <div className="sheriff-story">
    <picture>
      <source srcSet="/villain/sheriff-of-whaleingham.webp" type="image/webp" />
      <img src="/villain/sheriff-of-whaleingham.png" width={1027} height={1531} alt="The Sheriff of Whaleingham, a giant crowned whale in golden armor and an ermine cape, hugging a chest of gold coins" loading="lazy" decoding="async" />
    </picture>
    <div>
      <p className="eyebrow">THE VILLAIN OF OUR TALE</p>
      <h2 id="sheriff-title">The Sheriff of Whaleingham</h2>
      <p>He owns the castles, the coins and the candles. He buys the dip before you see it and sells the top before you feel it. Every chest in the kingdom ends up under his flipper.</p>
      <blockquote className="decree">
        <span>BY ROYAL DECREE</span>
        &ldquo;The gold belongs in the castle. The trenches may keep the mud.&rdquo;
        <cite>— H.M. the Sheriff of Whaleingham</cite>
      </blockquote>
      <p className="villain-target">The whales have the gold. The outlaws take it back to the trenches.</p>
    </div>
  </div>;
}

const road: { n: string; title: string; line: string; done: boolean; treasure?: boolean; href?: string }[] = [
  { n: 'I', title: 'The Broke Fox', line: 'The tale is told and the tavern doors are open.', done: true },
  { n: 'II', title: 'Assemble the Guild', line: 'Eighty outlaws painted so far. Make yours and print your poster.', done: true },
  { n: 'III', title: 'The Bounty Hunt', line: 'The board is pinned to the tavern wall. Taking on jobs comes next.', done: false },
  { n: 'IV', title: 'Loot for the Trenches', line: 'The rules are written down and nailed to the tavern door. The chest opens at launch.', done: false, treasure: true, href: '/loot' },
  { n: 'V', title: 'Kingdom Without Kings', line: 'One day the guild will write its own chapters.', done: false },
];

export function RoadStory() {
  return <>
    <p className="eyebrow">THE ROAD AHEAD</p>
    <h2 id="road-title">From one broke fox to an army of outlaws</h2>
    <ol className="treasure-map">
      {road.map(stop => <li key={stop.n} className={stop.done ? 'is-done' : stop.treasure ? 'is-treasure' : undefined}>
        <span className="map-pin" aria-hidden="true">{stop.done ? '✓' : stop.treasure ? '✕' : ''}</span>
        <b>CHAPTER {stop.n}</b>
        <h3>{stop.title}</h3>
        <p>{stop.line}{stop.href && <> <a href={stop.href}>Read The Loot →</a></>}</p>
      </li>)}
    </ol>
  </>;
}
