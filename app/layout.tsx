import type { Metadata } from 'next';
import './globals.css';
import { identityConfig } from '@/lib/identity/server';
import SessionBoundary from '@/components/identity/SessionBoundary';
import { WalletProvider } from '@/hooks/useWalletState';
export const metadata: Metadata = { title: 'RobinHoot | The Outlaw of NEAR', description: 'Create your local outlaw character and explore Bounty Board previews. Reputation, submissions and on-chain registration are not live.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><WalletProvider>{identityConfig()&&<SessionBoundary/>}{children}</WalletProvider></body></html> }
