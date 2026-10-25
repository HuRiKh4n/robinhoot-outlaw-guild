'use client';

import { useRef, useState } from 'react';
import { useWalletState } from '@/hooks/useWalletState';

export default function WalletControl() {
  const { connection, state, account, error: setupError, retry } = useWalletState();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const accountLabel = account && (account.accountId.length > 16
    ? `${account.accountId.slice(0, 5)}…${account.accountId.slice(-4)}`
    : account.accountId);
  const message = error || setupError;

  async function run(action: 'connect' | 'disconnect' | 'reconnect') {
    if (!connection || running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    // The SDK mounts its own accessible popup outside this native dialog.
    if (action !== 'disconnect') dialog.current?.close();
    try {
      if (action !== 'connect') await connection.disconnect();
      if (action !== 'disconnect') await connection.connect();
      dialog.current?.close();
    } catch {
      // Do not render wallet payloads or log callback/account data.
      setError(action === 'disconnect'
        ? 'Wallet disconnection failed. Please try again.'
        : 'The wallet didn’t answer. Allow popups (or open Meteor Mobile), come back here and try again.');
      if (!dialog.current?.open) dialog.current?.showModal();
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="wallet-control">
      <button ref={trigger} type="button" className="connect wallet-trigger"
        disabled={busy || (!connection && !setupError)} aria-haspopup="dialog" aria-busy={busy}
        aria-label={account ? `Wallet connected: ${account.accountId}. Manage wallet` : connection || setupError ? 'CONNECT WALLET' : 'LOADING WALLET'}
        title={account?.accountId}
        onClick={() => dialog.current?.showModal()}>
        <span className="wallet-label">{busy ? 'PLEASE WAIT…' : accountLabel || (connection || setupError ? 'CONNECT WALLET' : 'LOADING WALLET…')}</span>
      </button>
      <dialog ref={dialog} className="wallet-dialog" aria-labelledby="wallet-title" aria-describedby="wallet-description"
        onClose={() => trigger.current?.focus()}>
        <div className="wallet-heading">
          <h2 id="wallet-title">{account ? 'YOUR WALLET' : 'CONNECT WALLET'}</h2>
          <button type="button" className="wallet-close" aria-label="Close wallet dialog" onClick={() => dialog.current?.close()}>×</button>
        </div>
        <p className="eyebrow">NEAR · METEOR WALLET</p>
        <p id="wallet-description">Tell the guild your name. We only read your account: nothing to sign, nothing to approve, no coins move.</p>
        {account ? <>
          <p className="wallet-account">{account.accountId}</p>
          <p>Connected with Meteor Wallet</p>
          {(state?.accounts.length ?? 0) > 1 && <label className="wallet-account-select">Active account
            <select value={account.accountId} disabled={busy} onChange={event => {
              try { connection?.switchAccount(event.target.value); }
              catch { setError('Could not switch accounts. Please reconnect your wallet.'); }
            }}>
              {state?.accounts.map(item => <option key={item.accountId} value={item.accountId}>{item.accountId}</option>)}
            </select>
          </label>}
          <button type="button" className="button" disabled={busy} onClick={() => void run('reconnect')}>SWITCH ACCOUNT</button>
          <p className="note">Switching disconnects the current session, then opens Meteor to choose an account.</p>
          <button type="button" className="button wallet-disconnect" disabled={busy} onClick={() => void run('disconnect')}>DISCONNECT WALLET</button>
        </> : <>
          <button type="button" className="button" disabled={!connection || busy} onClick={() => void run('connect')}>CONTINUE WITH METEOR WALLET ↗</button>
          <p className="note">On a computer, use Meteor Web or the extension. On Android, use Meteor Web or tap Open in Meteor Mobile, then come back here.</p>
        </>}
        {!connection && setupError && <button type="button" className="button" onClick={retry}>RETRY WALLET SETUP</button>}
        <p className="note">Never share your seed phrase. Not with us, not with anyone.</p>
        <p role="status" aria-live="polite">{busy ? 'Waiting for wallet…' : ''}</p>
        {message && <p role="alert" className="wallet-error">{message}</p>}
      </dialog>
    </div>
  );
}
