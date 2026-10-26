'use client';

import { useState } from 'react';
import { useWalletState } from '@/hooks/useWalletState';

interface Verdict { account: string; eligible: boolean; reason: string; balanceNow?: string; heldHours?: number }

async function check(accounts: string[], prize: 'weekly' | 'monthly'): Promise<Verdict[]> {
  const response = await fetch('/api/raid/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accounts, prize }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? 'The ledger could not be read. Try again.');
  return data.results as Verdict[];
}

/** "Am I eligible?" for the connected wallet, plus a list check for the guild's payout day. */
export default function RaidChecker({ open }: { open: boolean }) {
  const { account } = useWalletState();
  const [mine, setMine] = useState<Verdict | null>(null);
  const [list, setList] = useState('');
  const [results, setResults] = useState<Verdict[]>([]);
  const [busy, setBusy] = useState<'mine' | 'list' | null>(null);
  const [error, setError] = useState('');
  const [prize, setPrize] = useState<'weekly' | 'monthly'>('weekly');

  async function checkMine() {
    if (!account) return;
    setBusy('mine'); setError(''); setMine(null);
    try { setMine((await check([account.accountId], prize))[0]); } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }
  async function checkList() {
    const accounts = [...new Set(list.split(/[\s,;]+/).map(item => item.trim().toLowerCase()).filter(Boolean))];
    if (!accounts.length) return;
    setBusy('list'); setError(''); setResults([]);
    try {
      for (let i = 0; i < accounts.length; i += 10) {
        const batch = await check(accounts.slice(i, i + 10), prize);
        setResults(previous => [...previous, ...batch]);
      }
    } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }

  return <section className="raid-check" aria-labelledby="check-title">
    <h2 id="check-title">Are you ready to ride?</h2>
    <div className="raid-prize-toggle" role="group" aria-label="Which prize">
      <button type="button" aria-pressed={prize === 'weekly'} onClick={() => { setPrize('weekly'); setMine(null); setResults([]); }}>Weekly prize · 72 h</button>
      <button type="button" aria-pressed={prize === 'monthly'} onClick={() => { setPrize('monthly'); setMine(null); setResults([]); }}>Grand Prize · 120 h</button>
    </div>
    <div className="raid-card">
      {account
        ? <><p>Connected as <b>{account.accountId}</b></p><button type="button" className="button" disabled={!open || busy !== null} onClick={() => void checkMine()}>{busy === 'mine' ? 'READING THE LEDGER…' : 'CHECK MY WALLET'}</button></>
        : <p>Connect your wallet at the top of the page, then come back here to check it.</p>}
      {mine && <p className={`raid-verdict ${mine.eligible ? 'is-yes' : 'is-no'}`} role="status">
        <strong>{mine.eligible ? 'You ride with the guild this week.' : 'Not yet, outlaw.'}</strong>
        <span>{mine.reason}</span>
        {mine.balanceNow !== undefined && <small>Balance now: {Number(mine.balanceNow).toLocaleString('en-US')} · held above the line for about {mine.heldHours} h</small>}
      </p>}
    </div>
    <details className="raid-card raid-list">
      <summary>Check a list of outlaws (payout day)</summary>
      <p className="note">Paste NEAR accounts, one per line. The chain is public: anyone can check anyone.</p>
      <textarea value={list} onChange={event => setList(event.target.value)} rows={6} placeholder={'outlaw-one.near\noutlaw-two.near'} />
      <button type="button" className="button" disabled={!open || busy !== null} onClick={() => void checkList()}>{busy === 'list' ? `CHECKING… ${results.length} DONE` : 'CHECK THE LIST'}</button>
      {results.length > 0 && <table className="raid-table"><thead><tr><th>Account</th><th>Ready?</th><th>Why</th></tr></thead><tbody>
        {results.map(item => <tr key={item.account}><td>{item.account}</td><td>{item.eligible ? '✓ yes' : '✗ no'}</td><td>{item.reason}</td></tr>)}
      </tbody></table>}
    </details>
    {error && <p role="alert" className="wallet-error">{error}</p>}
  </section>;
}
