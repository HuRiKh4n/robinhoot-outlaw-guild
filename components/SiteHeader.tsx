import Link from 'next/link';
import WalletControl from '@/components/wallet/WalletControl';

export default function SiteHeader() {
  return <nav className="site-header" aria-label="Main navigation">
    <Link className="brand" href="/#legend">🦊 ROBINHOOT <span>$RHOOT</span></Link>
    <div className="nav-links">
      <Link href="/#legend">The Legend</Link><Link href="/#guild">The Guild</Link>
      <Link href="/#roadmap">Roadmap</Link><Link href="/my-outlaw">My Outlaw</Link>
      <Link href="/bounties">Bounty Board</Link>
    </div>
    <WalletControl />
    <Link className="nav-bounties-mobile" href="/bounties">BOUNTY BOARD <span>PREVIEW / COMING SOON →</span></Link>
  </nav>;
}
