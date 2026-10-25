'use client';

import Link from 'next/link';
import { useSound } from '@/components/sound/SoundProvider';

/** Phones: a fixed bottom bar so nothing depends on exploring the picture. */
export default function MobileBar() {
  const { on, toggle, play } = useSound();
  return <nav className="mobile-bar" aria-label="Quick navigation">
    <Link href="/#tale">📖<span>Tale</span></Link>
    <Link href="/bounties">📜<span>Bounties</span></Link>
    <Link href="/my-outlaw" className="mobile-forge" onClick={() => play('hit')}>🏹<span>Forge your outlaw</span></Link>
    <Link href="/#road">🗝️<span>Road</span></Link>
    <button type="button" onClick={toggle} aria-pressed={on} aria-label={on ? 'Turn tavern music off' : 'Turn tavern music on'}>{on ? '🎶' : '🔇'}<span>Music</span></button>
  </nav>;
}
