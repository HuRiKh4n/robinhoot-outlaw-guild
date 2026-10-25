import SiteHeader from "@/components/SiteHeader";
import HideoutScene from "@/components/hideout/HideoutScene";
import StoryDialogs from "@/components/hideout/StoryDialogs";
import SfxLink from "@/components/sound/SfxLink";

export default function Home() {
  return (
    <main className="home-hideout">
      <SiteHeader />

      <header className="hideout-intro" id="legend">
        <h1>The castles have the gold. <em>The outlaws have a plan.</em></h1>
        <p>Welcome to the hideout. Touch anything that glows.</p>
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
      </footer>
    </main>
  );
}
