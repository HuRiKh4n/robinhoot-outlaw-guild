'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getWalletConnection, type WalletConnection, type WalletState } from '@/lib/near/wallet';

interface WalletContextValue {
  connection?: WalletConnection;
  state?: WalletState;
  account?: WalletState['accounts'][number];
  ready: boolean;
  error: string;
  retry(): void;
}
const WalletContext = createContext<WalletContextValue | null>(null);

/** One account state for the header and creator, with Strict Mode cleanup. */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<WalletConnection>();
  const [state, setState] = useState<WalletState>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    setError('');
    getWalletConnection().then(client => {
      if (!mounted) return;
      unsubscribe = client.subscribe(setState);
      setConnection(client);
    }).catch(() => {
      if (mounted) setError('Wallet setup failed. Allow browser storage and try again.');
    });
    return () => { mounted = false; unsubscribe?.(); };
  }, [attempt]);
  const account = state?.accounts.find(item => item.active) ?? state?.accounts[0];
  return <WalletContext.Provider value={{ connection, state, account, ready: Boolean(connection || error), error, retry: () => setAttempt(value => value + 1) }}>{children}</WalletContext.Provider>;
}

export function useWalletState() {
  const value = useContext(WalletContext);
  if (!value) throw new Error('WalletProvider is required.');
  return value;
}
