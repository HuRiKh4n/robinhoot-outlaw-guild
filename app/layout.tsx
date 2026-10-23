import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'RobinHoot | The Outlaw of NEAR', description: 'Join the Outlaw Guild. Create your outlaw, build reputation, and help write the legend.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html> }
