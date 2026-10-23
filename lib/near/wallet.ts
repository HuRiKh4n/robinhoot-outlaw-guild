/** Only account connection operations leave this module; no signing APIs. */
export interface WalletState {
  accounts: Array<{ accountId: string; active: boolean }>;
}
export interface WalletConnection {
  getState(): WalletState;
  subscribe(listener: (state: WalletState) => void): () => void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  switchAccount(accountId: string): void;
}

const storagePrefix = 'robinhoot:meteor:';
const activeKey = `${storagePrefix}active`;
const target = { blockchain: 'near', network: 'mainnet' } as const;
let connection: Promise<WalletConnection> | undefined;

export function getWalletConnection(): Promise<WalletConnection> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Wallets are only available in the browser.'));
  }
  connection ??= initialize().catch(error => {
    connection = undefined;
    throw error;
  });
  return connection;
}

async function initialize(): Promise<WalletConnection> {
  const [{ MeteorConnect }, { KeyStore }] = await Promise.all([
    import('@meteorwallet/sdk'), import('@near-js/keystores'),
  ]);
  // Defense in depth: no NEAR signing key can be saved or retrieved by this app.
  class ConnectionOnlyKeyStore extends KeyStore {
    async setKey(): Promise<never> { throw new Error('NEAR key authorization is disabled.'); }
    async getKey(): Promise<never> { throw new Error('NEAR signing keys are unavailable.'); }
    async removeKey() {}
    async clear() {}
    async getNetworks() { return []; }
    async getAccounts() { return []; }
  }
  const keyStore = new ConnectionOnlyKeyStore();
  const meteor = new MeteorConnect();
  meteor.setLoggingLevel('none');
  await meteor.initialize({
    storage: {
      async getItem(key) { return localStorage.getItem(`${storagePrefix}${key}`); },
      async setItem(key, value) { localStorage.setItem(`${storagePrefix}${key}`, value); },
      async removeItem(key) { localStorage.removeItem(`${storagePrefix}${key}`); },
    },
    nearKeyStoreProvider: { getKeyStore: () => keyStore },
    mobileBridge: {
      enabled: true,
      partnerMetadata: {
        name: 'RobinHoot — Outlaw Guild',
        description: 'Share your NEAR account only. No keys, signatures or transactions.',
        iconUrl: `${window.location.origin}/images/file_000000001d188246a150a12121d3ed34.png`,
        originUrl: window.location.origin,
      },
    },
  });
  let state: WalletState = { accounts: [] };
  const listeners = new Set<(state: WalletState) => void>();
  async function refresh() {
    const accounts = await meteor.getAllAccounts(target);
    const active = localStorage.getItem(activeKey);
    // Only restore account-only connections. Never inherit signing permissions.
    const ids = [...new Set(accounts.filter(account => account.publicKeys.length === 0)
      .map(account => account.identifier.accountId))];
    const activeId = ids.includes(active ?? '') ? active : ids[0];
    state = { accounts: ids.map(accountId => ({ accountId, active: accountId === activeId })) };
    for (const listener of listeners) listener(state);
  }
  await refresh();
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(storagePrefix)) {
      void refresh().catch(() => {
        state = { accounts: [] };
        for (const listener of listeners) listener(state);
      });
    }
  };
  return {
    getState: () => state,
    subscribe(listener) {
      if (listeners.size === 0) window.addEventListener('storage', onStorage);
      listeners.add(listener);
      listener(state);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener('storage', onStorage);
      };
    },
    async connect() {
      const action = await meteor.createAction({ id: 'near::sign_in', input: { target } });
      // Omit addFunctionCallKey AND legacy contract. Never use sign_in_and_sign_message.
      const account = await action.promptForExecution();
      if (account.publicKeys.length !== 0) {
        await meteor.removeSignedInAccount(account.identifier);
        throw new Error('Unexpected wallet permissions; connection rejected.');
      }
      localStorage.setItem(activeKey, account.identifier.accountId);
      await refresh();
    },
    async disconnect() {
      // All RobinHoot connections are account-only; SDK sign-out is local cleanup.
      for (const account of await meteor.getAllAccounts(target)) {
        if (account.publicKeys.length !== 0) {
          await meteor.removeSignedInAccount(account.identifier);
          continue;
        }
        const action = await meteor.createAction({ id: 'near::sign_out', input: { target: account.identifier } });
        await action.promptForExecution();
      }
      localStorage.removeItem(activeKey);
      await refresh();
    },
    switchAccount(accountId) {
      if (!state.accounts.some(account => account.accountId === accountId)) throw new Error('Unknown account.');
      localStorage.setItem(activeKey, accountId);
      state = { accounts: state.accounts.map(account => ({ ...account, active: account.accountId === accountId })) };
      for (const listener of listeners) listener(state);
    },
  };
}
