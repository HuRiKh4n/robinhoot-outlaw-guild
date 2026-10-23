"use client";

import SiteHeader from "@/components/SiteHeader";
import Link from "next/link";
import OutlawProfile from "@/components/profile/OutlawProfile";

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero" id="legend">
        <p className="eyebrow">THE OUTLAW OF NEAR · CHAPTER I</p>
        <div className="herofox">
          <img
            src="/images/file_000000001d188246a150a12121d3ed34.png"
            alt="RobinHoot — The Outlaw of NEAR"
            style={{ width: "100%", maxWidth: "340px", height: "auto", objectFit: "contain" }}
          />
        </div>
        <h1>THE CASTLES ARE FULL.<br /><em>THE TRENCHES ARE RISING.</em></h1>
        <p>They built the castles. They hoarded the gold. Then a broke fox showed up with a torn cloak, a rusty cup, and a plan.</p>
        <div className="actions">
          <a className="button" href="#guild">BECOME AN OUTLAW →</a>
          <a className="secondary" href="#roadmap">READ THE ROADMAP ↓</a>
          <Link className="secondary" href="/my-outlaw">MY OUTLAW / PASSPORT →</Link>
        </div>
        <small>STEAL THE HYPE. GIVE IT TO THE TRENCHES.</small>
      </section>

      <section className="manifesto">
        <div className="stamp">WANTED<br />DEAD BROKE</div>
        <div>
          <p className="eyebrow">THE MANIFESTO</p>
          <h2>NOT ANOTHER CASTLE.<br />AN OUTLAW GUILD.</h2>
          <p>Every wallet deserves a character. Every outlaw deserves a mission. Join a community where memes become missions and creativity builds reputation.</p>
        </div>
      </section>

      <OutlawProfile />

      <section id="roadmap" className="roadmap">
        <p className="eyebrow">THE OUTLAW ROADMAP</p>
        <h2>FROM ONE BROKE FOX<br />TO AN ARMY OF OUTLAWS.</h2>
        <div className="chapters">
          {[
            ["I", "THE BROKE FOX", "Launch the legend and community."],
            ["II", "ASSEMBLE THE GUILD", "Wallet profiles, AI outlaws and WANTED posters."],
            ["III", "THE BOUNTY HUNT", "Community missions and reputation."],
            ["IV", "LOOT FOR THE TRENCHES", "Transparent, rule-based treasury rewards."],
            ["V", "KINGDOM WITHOUT KINGS", "Expand stories, characters and community proposals."]
          ].map(([n, t, d]) => (
            <article key={n}>
              <b>CHAPTER {n}</b>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
        <p className="note">Roadmap features are development plans, not live functionality or guaranteed rewards.</p>
      </section>

      <footer>
        <b>🦊 ROBINHOOT</b>
        <p>THE OUTLAW OF NEAR · $RHOOT</p>
        <p>Built for the trenches. No promises of returns.</p>
      </footer>
    </main>
  );
}
