import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/hooks/useWalletState';
export const metadata: Metadata = { title: 'RobinHoot | The Outlaw of NEAR', description: 'Create your local outlaw character and explore Bounty Board previews. Reputation, submissions and on-chain registration are not live.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><WalletProvider>{children}</WalletProvider></body></html> }
