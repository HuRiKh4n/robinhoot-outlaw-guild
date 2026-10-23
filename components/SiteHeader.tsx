import Link from 'next/link';
import WalletControl from '@/components/wallet/WalletControl';

export default function SiteHeader() {
  return <nav aria-label="Main navigation">
    <Link className="brand" href="/#legend">🦊 ROBINHOOT <span>$RHOOT</span></Link>
    <div className="nav-links">
      <Link href="/#legend">The Legend</Link><Link href="/#guild">The Guild</Link>
      <Link href="/#roadmap">Roadmap</Link><Link href="/my-outlaw">My Outlaw</Link>
    </div>
    <WalletControl />
  </nav>;
}
