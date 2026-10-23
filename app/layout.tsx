import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/hooks/useWalletState';
export const metadata: Metadata = { title: 'RobinHoot | The Outlaw of NEAR', description: 'Join the Outlaw Guild. Create your outlaw, build reputation, and help write the legend.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><WalletProvider>{children}</WalletProvider></body></html> }
