import type { Metadata } from 'next';
import './globals.css';
import { identityConfig } from '@/lib/identity/server';
import SessionBoundary from '@/components/identity/SessionBoundary';
import { WalletProvider } from '@/hooks/useWalletState';
import SoundProvider from '@/components/sound/SoundProvider';
export const metadata: Metadata = { title: 'RobinHoot | The Outlaw of NEAR', description: 'A tale from the kingdom of NEAR. The whales have the gold; the outlaws take it back to the trenches. Make your outlaw and print your WANTED poster.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:wght@400;600&family=Oswald:wght@500;700&display=swap" /></head><body><WalletProvider><SoundProvider>{identityConfig()&&<SessionBoundary/>}{children}</SoundProvider></WalletProvider></body></html> }
