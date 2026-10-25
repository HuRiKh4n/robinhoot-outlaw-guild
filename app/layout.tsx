import type { Metadata } from 'next';
import './globals.css';
import { identityConfig } from '@/lib/identity/server';
import SessionBoundary from '@/components/identity/SessionBoundary';
import { WalletProvider } from '@/hooks/useWalletState';
import SoundProvider from '@/components/sound/SoundProvider';
const description = 'A tale from the kingdom of NEAR. The whales have the gold; the outlaws take it back to the trenches. Make your outlaw and print your WANTED poster.';
const shareImage = { url: '/og/robinhoot-og.jpg', width: 1200, height: 630, alt: 'RobinHoot, the outlaw of NEAR: a fox outlaw carrying a sack of gold out of the dark forest.' };
export const metadata: Metadata = {
  metadataBase: new URL('https://robinhoot-outlaw-guild.vercel.app'),
  title: 'RobinHoot | The Outlaw of NEAR',
  description,
  openGraph: { type: 'website', siteName: 'RobinHoot', title: 'RobinHoot | The Outlaw of NEAR', description, url: '/', images: [shareImage] },
  twitter: { card: 'summary_large_image', title: 'RobinHoot | The Outlaw of NEAR', description, images: [shareImage.url] },
};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:wght@400;600&family=Oswald:wght@500;700&display=swap" /></head><body><WalletProvider><SoundProvider>{identityConfig()&&<SessionBoundary/>}{children}</SoundProvider></WalletProvider></body></html> }
