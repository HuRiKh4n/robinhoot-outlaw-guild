'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const WEEK = 7 * 864e5;
const pad = (n: number) => String(n).padStart(2, '0');
const day = (t: number) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** The big countdown to the next Grand Prize (the 4th Sunday of each cycle), with the cycle's four Sundays. */
export default function GrandCountdown({ link = false }: { link?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  const [start, setStart] = useState<number | null>(null);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => {
    fetch('/api/raid').then(r => r.json()).then(r => { if (r.cycleStart) setStart(Date.parse(`${r.cycleStart}T20:00:00Z`)); }).catch(() => {});
  }, []);
  if (start === null) return null;

  // The current cycle: the one whose Grand Prize has not passed yet (6 hours of grace for the live reveal).
  const cycle = Math.max(0, Math.ceil((now - 6 * 3600_000 - (start + 3 * WEEK)) / (4 * WEEK)));
  const sundays = [0, 1, 2, 3].map(i => start + (cycle * 4 + i) * WEEK);
  const grand = sundays[3];
  const s = Math.max(0, Math.floor((grand - now) / 1000));
  const parts: Array<[string, number]> = [['days', Math.floor(s / 86400)], ['hours', Math.floor(s / 3600) % 24], ['min', Math.floor(s / 60) % 60], ['sec', s % 60]];

  return <section className="grand-countdown" aria-labelledby="grand-title">
    <p className="eyebrow">THE BIG HEIST</p>
    <h2 id="grand-title">The Grand Prize</h2>
    <div className="grand-clock" role="timer">{parts.map(([label, value]) => <div key={label}><strong>{pad(value)}</strong><span>{label}</span></div>)}</div>
    <p className="grand-when">{new Date(grand).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC · 5 outlaws rob the Sheriff&rsquo;s vault</p>
    <ol className="grand-road">{sundays.map((t, i) => {
      const done = now > t + 6 * 3600_000; const next = !done && sundays.slice(0, i).every(p => now > p + 6 * 3600_000);
      return <li key={t} className={`${i === 3 ? 'is-grand' : ''}${done ? ' is-done' : ''}${next ? ' is-next' : ''}`}>
        <b>{i === 3 ? '👑' : done ? '✓' : '🍀'}</b><span>{day(t)}</span><small>{i === 3 ? 'Grand Prize' : `Weekly draw ${i + 1}`}</small>
      </li>;
    })}</ol>
    {link && <Link className="profile-inline-link" href="/draws">SEE THE DRAWS →</Link>}
  </section>;
}
