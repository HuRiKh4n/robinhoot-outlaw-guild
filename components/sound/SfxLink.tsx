'use client';

import Link from 'next/link';
import { useSound } from './SoundProvider';

/** A Link that plays a sound effect (only if the visitor turned sound on). */
export default function SfxLink({ effect = 'hit', ...props }: React.ComponentProps<typeof Link> & { effect?: 'hit' | 'coin' }) {
  const { play } = useSound();
  return <Link {...props} onClick={event => { play(effect); props.onClick?.(event); }} />;
}
