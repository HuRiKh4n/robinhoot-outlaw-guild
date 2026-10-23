'use client';

import { useEffect, useRef, useState } from 'react';
import type { WalletSelectorState } from '@near-wallet-selector/core';
import { getWalletConnection, type WalletConnection } from '@/lib/near/wallet';

export default function WalletControl() {
  const [connection, setConnection] = useState<WalletConnection>();
  const [state, setState] = useState<WalletSelectorState>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const running = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const account = state?.accounts.find(item => item.active) ?? state?.accounts[0];
  const accountLabel = account && (account.accountId.length > 22
    ? `${account.accountId.slice(0, 10)}…${account.accountId.slice(-9)}`
    : account.accountId);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    setError('');
    getWalletConnection().then(client => {
      if (!mounted) return;
      unsubscribe = client.subscribe(next => setState(next));
      setConnection(client);
    }).catch(() => {
      if (mounted) setError('Wallet setup failed. Allow browser storage and try again.');
    });
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [attempt]);

  async function run(action: 'connect' | 'disconnect' | 'reconnect') {
    if (!connection || running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      if (action !== 'connect') await connection.disconnect();
      if (action !== 'disconnect') await connection.connect();
      dialog.current?.close();
    } catch {
      // Do not render wallet payloads or log callback/account data.
      setError(action === 'disconnect'
        ? 'Wallet disconnection failed. Please try again.'
        : 'Wallet connection was not completed. Allow popups for this site, return to this tab, and try again.');
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="wallet-control">
      <button ref={trigger} type="button" className="connect wallet-trigger"
        disabled={!connection && !error} aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}>
        {accountLabel ? accountLabel : connection || error ? 'CONNECT WALLET' : 'LOADING WALLET…'}
      </button>
      <dialog ref={dialog} className="wallet-dialog" aria-labelledby="wallet-title" aria-describedby="wallet-description"
        onClose={() => trigger.current?.focus()}>
        <div className="wallet-heading">
          <h2 id="wallet-title">{account ? 'YOUR WALLET' : 'CONNECT WALLET'}</h2>
          <button type="button" className="wallet-close" aria-label="Close wallet dialog" onClick={() => dialog.current?.close()}>×</button>
        </div>
        <p className="eyebrow">NEAR MAINNET · CONNECTION ONLY</p>
        <p id="wallet-description">Share your account with RobinHoot. No transactions, token approvals, access keys, or signatures are requested.</p>
        {account ? <>
          <p className="wallet-account">{account.accountId}</p>
          <p>Connected with MyNearWallet</p>
          {(state?.accounts.length ?? 0) > 1 && <label className="wallet-account-select">Active account
            <select value={account.accountId} disabled={busy} onChange={event => {
              try { connection?.switchAccount(event.target.value); }
              catch { setError('Could not switch accounts. Please reconnect your wallet.'); }
            }}>
              {state?.accounts.map(item => <option key={item.accountId} value={item.accountId}>{item.accountId}</option>)}
            </select>
          </label>}
          <button type="button" className="button" disabled={busy} onClick={() => void run('reconnect')}>SWITCH ACCOUNT</button>
          <p className="note">MyNearWallet shares one account at a time. Switching disconnects this account, then opens the wallet to choose another.</p>
          <button type="button" className="button wallet-disconnect" disabled={busy} onClick={() => void run('disconnect')}>DISCONNECT WALLET</button>
        </> : <>
          <button type="button" className="button" disabled={!connection || busy} onClick={() => void run('connect')}>CONTINUE WITH MYNEARWALLET ↗</button>
          <p className="note">Opens the wallet in a popup or new browser tab, including on Android. Allow popups and return here after connecting.</p>
        </>}
        {!connection && error && <button type="button" className="button" onClick={() => setAttempt(value => value + 1)}>RETRY WALLET SETUP</button>}
        <p className="note">Connection does not verify ownership or register guild membership. Never share your seed phrase with this site.</p>
        <p role="status" aria-live="polite">{busy ? 'Waiting for wallet…' : ''}</p>
        {error && <p role="alert" className="wallet-error">{error}</p>}
      </dialog>
    </div>
  );
}
