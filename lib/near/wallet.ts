/** Normal connection is account-only. Identity proof is a separate explicit NEP-413 action. */
export interface IdentityChallenge { accountId:string; message:string; nonce:string; recipient:string }
export interface WalletState {
  accounts: Array<{ accountId: string; active: boolean }>;
  /** Name of the connected wallet app (HOT, Meteor, Intear…). */
  walletName?: string;
}
export interface WalletConnection {
  getState(): WalletState;
  subscribe(listener: (state: WalletState) => void): () => void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  switchAccount(accountId: string): void;
  signIdentityChallenge(challenge:IdentityChallenge):Promise<{accountId:string;publicKey:string;signature:string}>;
}

const network = 'mainnet';
const activeKey = 'robinhoot:wallet:active';
// Not offered: wallets for other chains, developer tools and hardware/bridge flows we cannot support well.
const excludedWallets = ['ethereum-wallets', 'near-cli', 'wallet-connect', 'unity-wallet'];

/** The parts of @hot-labs/near-connect we use (kept local so the app never depends on wider wallet powers). */
interface ConnectedWallet {
  manifest: { id: string; name: string };
  getAccounts(data?: { network?: string }): Promise<Array<{ accountId: string }>>;
  signMessage(params: { message: string; recipient: string; nonce: Uint8Array; network?: string }): Promise<{ accountId: string; publicKey: string; signature: string }>;
}
interface Connector {
  connect(input?: Record<string, never>): Promise<ConnectedWallet>;
  disconnect(): Promise<void>;
  wallet(): Promise<ConnectedWallet>;
  on(event: 'wallet:signIn' | 'wallet:signOut', listener: () => void): void;
}

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
  const { NearConnector } = await import('@hot-labs/near-connect');
  // One selector for every NEAR wallet: HOT, Meteor, Intear, MyNearWallet, OKX, Nightly…
  // Sign-in never adds an access key: the guild only learns the account name.
  const connector = new NearConnector({
    network,
    excludedWallets,
    autoConnect: false,
    footerBranding: {
      icon: `${window.location.origin}/images/robinhoot-fox.png`,
      heading: 'RobinHoot · Outlaw Guild',
      link: 'https://wallet.near.org',
      linkText: 'No NEAR wallet yet?',
    },
  }) as unknown as Connector;

  let state: WalletState = { accounts: [] };
  const listeners = new Set<(state: WalletState) => void>();
  const emit = () => { for (const listener of listeners) listener(state); };

  async function current(): Promise<ConnectedWallet | undefined> {
    try { return await connector.wallet(); } catch { return undefined; }
  }
  async function refresh() {
    const wallet = await current();
    const ids = wallet ? [...new Set((await wallet.getAccounts({ network }).catch(() => [])).map(account => account.accountId))] : [];
    const saved = localStorage.getItem(activeKey);
    const activeId = ids.includes(saved ?? '') ? saved : ids[0];
    state = { accounts: ids.map(accountId => ({ accountId, active: accountId === activeId })), walletName: ids.length ? wallet?.manifest.name : undefined };
    emit();
  }
  connector.on('wallet:signIn', () => void refresh().catch(() => {}));
  connector.on('wallet:signOut', () => { state = { accounts: [] }; emit(); });
  await refresh().catch(() => {});

  return {
    getState: () => state,
    async signIdentityChallenge(challenge) {
      const active = () => state.accounts.find(account => account.active)?.accountId;
      if (active() !== challenge.accountId) throw new Error('Selected account changed.');
      const nonce = Uint8Array.from(atob(challenge.nonce), character => character.charCodeAt(0));
      if (nonce.length !== 32 || challenge.recipient !== window.location.host) {
        throw new Error('Invalid identity challenge.');
      }
      const wallet = await current();
      if (!wallet) throw new Error('No wallet connected.');
      // NEP-413 off-chain message only: no transaction, no access key, no gas.
      const proof = await wallet.signMessage({ message: challenge.message, recipient: challenge.recipient, nonce, network });
      if (active() !== challenge.accountId || proof.accountId !== challenge.accountId) {
        throw new Error('Selected account changed.');
      }
      return { accountId: proof.accountId, publicKey: proof.publicKey, signature: proof.signature };
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => { listeners.delete(listener); };
    },
    async connect() {
      // No addFunctionCallKey, no signMessageParams: account name only.
      const wallet = await connector.connect({});
      const [first] = await wallet.getAccounts({ network });
      if (!first) throw new Error('No account shared.');
      localStorage.setItem(activeKey, first.accountId);
      await refresh();
    },
    async disconnect() {
      if (await current()) await connector.disconnect().catch(() => {});
      localStorage.removeItem(activeKey);
      state = { accounts: [] };
      emit();
    },
    switchAccount(accountId) {
      if (!state.accounts.some(account => account.accountId === accountId)) throw new Error('Unknown account.');
      localStorage.setItem(activeKey, accountId);
      state = { ...state, accounts: state.accounts.map(account => ({ ...account, active: account.accountId === accountId })) };
      emit();
    },
  };
}
