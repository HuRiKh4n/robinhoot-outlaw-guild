import Link from 'next/link';
import WalletControl from '@/components/wallet/WalletControl';
import SoundToggle from '@/components/sound/SoundToggle';
import MobileBar from '@/components/hideout/MobileBar';
import { TICKER, launched } from '@/lib/token';

export default function SiteHeader() {
  const live = launched();
  return <nav className={`site-header${live ? ' is-live' : ''}`} aria-label="Main navigation">
    <Link className="brand" href="/#legend">🦊 ROBINHOOT {TICKER && <span>${TICKER}</span>}</Link>
    <div className="nav-links">
      <Link href="/#tale">The Tale</Link>
      <Link href="/my-outlaw">Your Outlaw</Link>
      <Link href="/bounties">Bounties</Link>
      <Link href="/loot">The Loot</Link>
      {live && <Link href="/draws">The Draws</Link>}
      {live && <Link href="/council">Council</Link>}
    </div>
    <WalletControl />
    <SoundToggle />
    <MobileBar />
  </nav>;
}
