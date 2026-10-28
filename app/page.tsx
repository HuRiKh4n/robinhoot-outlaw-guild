import Link from 'next/link';
import SiteHeader from "@/components/SiteHeader";
import HideoutScene from "@/components/hideout/HideoutScene";
import TitleScreen from "@/components/hideout/TitleScreen";
import StoryDialogs from "@/components/hideout/StoryDialogs";
import SfxLink from "@/components/sound/SfxLink";

export default function Home() {
  return (
    <main className="home-hideout">
      <SiteHeader />

      <TitleScreen />

      <header className="hideout-intro hideout-intro-below">
        <p className="eyebrow">BELOW THE TRENCHES</p>
        <h2>Enter the hideout. <em>Touch anything that glows.</em></h2>
      </header>

      <HideoutScene />

      <section className="hideout-strip" aria-label="Everything in the hideout">
        <a className="strip-item" href="#tale"><b>The tale</b><span>How a broke fox started a guild</span></a>
        <a className="strip-item" href="#sheriff"><b>The Sheriff</b><span>The whale who owns the castles</span></a>
        <a className="strip-item" href="#road"><b>The road ahead</b><span>Five chapters, one locked chest</span></a>
        <SfxLink className="button strip-forge" href="/my-outlaw">FORGE YOUR OUTLAW →</SfxLink>
      </section>

      <StoryDialogs />

      <footer>
        <b>🦊 ROBINHOOT</b>
        <p>A TALE FROM THE KINGDOM OF NEAR · $RHOOT</p>
        <p>A meme, a story and a guild. No treasure is promised, only the adventure.</p>
        <p><Link className="profile-inline-link" href="/near">BUILT ON NEAR · NEAR AI →</Link></p>
      </footer>
    </main>
  );
}
