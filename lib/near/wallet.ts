import type { InjectedWallet, WalletSelector, WalletSelectorState } from '@near-wallet-selector/core';

/** Only connection operations leave this module; signing APIs are never exposed. */
export interface WalletConnection {
  getState(): WalletSelectorState;
  subscribe(listener: (state: WalletSelectorState) => void): () => void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  switchAccount(accountId: string): void;
}

let connection: Promise<WalletConnection> | undefined;

export function getWalletConnection(): Promise<WalletConnection> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Wallets are only available in the browser.'));
  }
  // Share initialization across React Strict Mode remounts. Failed imports can retry.
  connection ??= initialize().catch(error => {
    connection = undefined;
    throw error;
  });
  return connection;
}

async function initialize(): Promise<WalletConnection> {
  const [{ setupWalletSelector }, { setupMyNearWallet }] = await Promise.all([
    import('@near-wallet-selector/core'),
    import('@near-wallet-selector/my-near-wallet'),
  ]);
  const selector: WalletSelector = await setupWalletSelector({
    network: 'mainnet',
    modules: [setupMyNearWallet()],
    debug: false,
    // Deliberately omit createAccessKeyFor: this site needs no contract permissions.
  });
  // Initialize before a user click, keeping wallet popup creation within activation.
  const wallet = await selector.wallet<InjectedWallet>('my-near-wallet');
  return {
    getState: () => selector.store.getState(),
    subscribe(listener) {
      const subscription = selector.store.observable.subscribe(listener);
      return () => subscription.unsubscribe();
    },
    async connect() {
      // No contractId, methodNames, public key, signing or transaction request.
      await wallet.signIn({});
    },
    async disconnect() {
      await wallet.signOut();
    },
    switchAccount: accountId => selector.setActiveAccount(accountId),
  };
}
