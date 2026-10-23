import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import OutlawProfile from '@/components/profile/OutlawProfile';

export const metadata: Metadata = {
  title: 'My Outlaw | RobinHoot',
  description: 'Create a local Outlaw identity and preview your RobinHoot Guild Passport. Not minted or registered.',
};
export default function MyOutlaw() {
  return <main><SiteHeader /><OutlawProfile dedicated /><footer><b>🦊 ROBINHOOT</b><p>YOUR STORY. YOUR LOCAL DRAFT.</p><Link className="profile-inline-link" href="/">BACK TO THE LEGEND ↗</Link></footer></main>;
}
