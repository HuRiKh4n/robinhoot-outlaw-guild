'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSound } from '@/components/sound/SoundProvider';

const items = [
  { label: 'Forge your outlaw', note: 'new legend', href: '/my-outlaw' },
  { label: 'Hear the tale', note: 'chapter one', href: '#tale' },
  { label: 'The bounty board', note: 'six jobs', href: '/bounties' },
  { label: 'The road ahead', note: 'a locked chest', href: '#road' },
] as const;

/** Video-game style main menu over the hideout. Mouse, touch and keyboard (↑ ↓ / ← → and Enter). */
export default function GameMenu() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const { play } = useSound();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0;
      if (step) {
        event.preventDefault();
        setActive(current => {
          const next = (current + step + items.length) % items.length;
          refs.current[next]?.focus({ preventScroll: true });
          return next;
        });
        play('coin');
      } else if (event.key === 'Enter' && !(target && target.closest('a,button'))) {
        refs.current[active]?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, play]);

  return <nav className="game-menu" aria-label="Main menu">
    <ul>
      {items.map((item, index) => {
        const props = {
          ref: (element: HTMLAnchorElement | null) => { refs.current[index] = element; },
          className: `game-item${index === active ? ' is-active' : ''}`,
          onMouseEnter: () => setActive(index),
          onFocus: () => setActive(index),
          onClick: () => play(index === 0 ? 'hit' : 'coin'),
        };
        const inner = <><span className="game-gem" aria-hidden="true" /><span className="game-label">{item.label}</span><em>{item.note}</em></>;
        return <li key={item.label}>{item.href.startsWith('#')
          ? <a href={item.href} {...props}>{inner}</a>
          : <Link href={item.href} {...props}>{inner}</Link>}</li>;
      })}
    </ul>
  </nav>;
}
