import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Built on NEAR | RobinHoot',
  description: 'How RobinHoot uses NEAR: wallets, on-chain draws and NEAR AI for the bard and the portrait painter.',
};

export default function BuiltOnNear() {
  return <main className="raid-page page-dark"><SiteHeader />
    <section className="raid-hero">
      <Link className="raid-back" href="/">← BACK TO THE TALE</Link>
      <p className="raid-kicker">Under the hood</p>
      <h1>Built on NEAR</h1>
      <div className="ts-rule" aria-hidden="true"><i /></div>
      <p className="raid-lead">RobinHoot is a meme with a story, and every piece of it runs on NEAR: the coin, the wallets, the dice of the draws and the AI that sings and paints for the Guild.</p>
    </section>
    <section className="raid-rules" aria-labelledby="near-parts">
      <h2 id="near-parts">Four pieces of NEAR</h2>
      <div className="draw-how">
        <div><b>🪙</b><h3>The coin</h3><p>Launched fair on JustHoot, the NEAR launchpad. No presale. Every trade pays a small toll that fills the Guild Chest. <Link href="/loot">The Loot →</Link></p></div>
        <div><b>👛</b><h3>Your wallet</h3><p>HOT, Meteor, Intear and other NEAR wallets. Joining the Guild is a free signed message: no transaction, no fee, and the site never touches your keys.</p></div>
        <div><b>🎲</b><h3>The draws</h3><p>The dice is the first NEAR block after Sunday 20:00 UTC. Who holds what, and for how long, is read straight from the chain. Anyone can re-run it. <Link href="/draws">The Draws →</Link></p></div>
        <div><b>🤖</b><h3>NEAR AI</h3><p>Tobias the bard (on Telegram) and the Guild painter run on NEAR AI Cloud, NEAR&rsquo;s private AI: models run inside secure hardware, and their answers can be signed and checked.</p></div>
      </div>
    </section>
    <section className="raid-rules" aria-labelledby="near-ai">
      <h2 id="near-ai">What NEAR AI does for the Guild</h2>
      <ol className="raid-how">
        <li><b>The bard.</b> Tobias Lutewhistle, the raccoon bard of the Telegram tavern, answers outlaws in character, tells tales and keeps the fire warm. His words come from a language model on NEAR AI Cloud.</li>
        <li><b>The painter.</b> When you join the Guild, your outlaw starts from a portrait painted by hand for the Guild. NEAR AI adds your marks (a scar, a coin necklace, war paint…) so your outlaw is yours alone, then it goes on your WANTED poster. <Link href="/my-outlaw">Make your outlaw →</Link></li>
        <li><b>Private by design.</b> NEAR AI Cloud runs models inside trusted execution environments (TEE): the hardware keeps prompts and answers sealed, and each answer can carry a signature that proves which model wrote it.</li>
        <li><b>The Guild Council.</b> Holders steer the bard: they vote his weekly mission and changes to his SOUL, his voice. The SOUL in force is public, with its fingerprint. <Link href="/council">The Council →</Link></li>
        <li><b>Coming next.</b> In &ldquo;Rob the Sheriff&rdquo; your outlaw faces the Sheriff, an AI guard whose verdicts are signed and checked on NEAR.</li>
      </ol>
    </section>
    <footer><b>🦊 ROBINHOOT</b><p>A TALE FROM THE KINGDOM OF NEAR</p></footer>
  </main>;
}
