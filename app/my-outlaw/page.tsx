import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import OutlawProfile from '@/components/profile/OutlawProfile';

export const metadata: Metadata = {
  title: 'Your Outlaw | RobinHoot',
  description: 'Make your outlaw: pick a creature, a calling and an outfit, then print your WANTED poster.',
};
export default function MyOutlaw() {
  return <main className="page-dark"><SiteHeader /><OutlawProfile dedicated /><footer><b>🦊 ROBINHOOT</b><p>A meme, a story and a guild. No treasure is promised, only the adventure.</p><Link className="profile-inline-link" href="/">BACK TO THE TALE ↗</Link></footer></main>;
}
