'use client';

import { useSound } from './SoundProvider';

/** Lute button in the header: tavern music and sound effects on/off. */
export default function SoundToggle() {
  const { on, toggle } = useSound();
  return <button type="button" className={`sound-toggle${on ? ' is-on' : ''}`} onClick={toggle}
    aria-pressed={on} aria-label={on ? 'Turn tavern music off' : 'Turn tavern music on'} title={on ? 'Music on' : 'Music off'}>
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M21.5 3.5l3 3-2 2-1-.2-4.6 4.6a7 7 0 0 1-1.2 9.3c-2.9 2.9-7.4 3.2-9.8.8s-2.1-6.9.8-9.8a7 7 0 0 1 9.3-1.2l4.6-4.6-.2-1z" fill="currentColor" opacity=".9" />
      <circle cx="11.5" cy="20.5" r="2.4" fill="#151712" />
      <path d="M8 24l9-9" stroke="#151712" strokeWidth="1.2" />
    </svg>
    <span className="sound-waves" aria-hidden="true"><i /><i /><i /></span>
  </button>;
}
