import Link from 'next/link';
import WalletControl from '@/components/wallet/WalletControl';
import SoundToggle from '@/components/sound/SoundToggle';
import MobileBar from '@/components/hideout/MobileBar';

export default function SiteHeader() {
  return <nav className="site-header" aria-label="Main navigation">
    <Link className="brand" href="/#legend">🦊 ROBINHOOT <span>$RHOOT</span></Link>
    <div className="nav-links">
      <Link href="/#tale">The Tale</Link>
      <Link href="/my-outlaw">Your Outlaw</Link>
      <Link href="/bounties">Bounties</Link>
    </div>
    <WalletControl />
    <SoundToggle />
    <MobileBar />
  </nav>;
}
