'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useWalletState } from '@/hooks/useWalletState';
import { revokeGuildSession, waitForGuildLogout } from '@/components/identity/logout';
import { detailLabel } from '@/lib/character/details';
import type { OutlawDraft } from '@/lib/profile/draft';
import { RANKS } from '@/lib/raid/ranks';

type Phase = 'loading' | 'closed' | 'no-wallet' | 'stranger' | 'member';
interface Saved { draft: OutlawDraft; revision: number }

/** Join the Guild in one step: a free wallet signature, then your outlaw is saved to your wallet (one per wallet).
 *  Members can have their unique portrait painted. */
export default function JoinGuild({ draft, onPortrait }: { draft: OutlawDraft; onPortrait(url?: string): void }) {
  const { account, connection } = useWalletState();
  const id = account?.accountId;
  const active = useRef(id);
  active.current = id;
  const [phase, setPhase] = useState<Phase>('loading');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [busy, setBusy] = useState('');
  const [status, setStatus] = useState('');
  const [portrait, setPortrait] = useState<string>();

  useEffect(() => {
    let current = true;
    setSaved(null); setStatus(''); setPortrait(undefined); onPortrait(undefined);
    if (!id) { setPhase('no-wallet'); return; }
    setPhase('loading');
    void fetch('/api/guild/character', { headers: { 'X-Guild-Account': id }, cache: 'no-store' }).then(async response => {
      if (!current) return;
      if (response.status === 503) { setPhase('closed'); return; }
      if (!response.ok) { setPhase('stranger'); return; }
      const data = await response.json();
      setSaved(data.character);
      setPhase('member');
      if (data.character) showPortrait(`/api/outlaws/portrait?account=${encodeURIComponent(id)}&v=${Date.now()}`);
    }).catch(() => { if (current) setPhase('closed'); });
    return () => { current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function showPortrait(url: string) {
    const image = new Image();
    image.onload = () => { setPortrait(url); onPortrait(url); };
    image.src = url;
  }

  async function call(path: string, method: string, data?: unknown) {
    if (!id) throw new Error('Connect your wallet first.');
    const response = await fetch(`/api/guild/${path}`, {
      method, headers: { 'Content-Type': 'application/json', 'X-Guild-Account': id },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    const value = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) setPhase('stranger');
      throw new Error(value.error ?? 'Something went wrong. Try again.');
    }
    if (active.current !== id) { await revokeGuildSession(); throw new Error('Wallet changed. Try again.'); }
    return value;
  }

  async function saveDraft(revision: number) {
    const result = await call('character', 'PUT', { draft, expectedRevision: revision, confirmed: true });
    setSaved({ draft, revision: result.revision });
  }

  async function join() {
    if (!connection || !account || busy) return;
    if (!draft.name.trim()) { setStatus('Give your outlaw a name first.'); return; }
    setBusy('join');
    setStatus('Your wallet will ask you to sign a message. It is free: no transaction, no fee.');
    try {
      await waitForGuildLogout();
      const challenge = await call('challenge', 'POST', { accountId: account.accountId });
      const proof = await connection.signIdentityChallenge(challenge);
      await call('verify', 'POST', { id: challenge.id, ...proof });
      const current = await call('character', 'GET');
      await saveDraft(current.character?.revision ?? 0);
      setPhase('member');
      setStatus('Welcome to the Guild, outlaw. You hold your first bonus ticket.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Joining did not finish. Try again.');
    } finally { setBusy(''); }
  }

  async function update() {
    if (busy || !saved) return;
    setBusy('update');
    try { await saveDraft(saved.revision); setStatus('Your outlaw is updated in the Guild ledger.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Update failed.'); }
    finally { setBusy(''); }
  }

  async function paint() {
    if (busy) return;
    setBusy('paint');
    setStatus('The guild painter is at work. This takes up to a minute…');
    try {
      if (saved && JSON.stringify(saved.draft) !== JSON.stringify(draft)) await saveDraft(saved.revision);
      const result = await call('portrait', 'POST', {});
      showPortrait(result.url);
      setStatus('Your portrait is painted. It is yours alone: it goes on your WANTED poster and on the draws if you win.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The painter could not finish. Try again.');
    } finally { setBusy(''); }
  }

  const changed = Boolean(saved && JSON.stringify(saved.draft) !== JSON.stringify(draft));
  const rank = RANKS[0];

  return <section className="join-guild" aria-labelledby="join-title">
    <p className="eyebrow">THE GUILD LEDGER</p>
    <h2 id="join-title">{phase === 'member' && saved ? `${saved.draft.name.trim().toUpperCase()} RIDES WITH THE GUILD` : 'JOIN THE GUILD'}</h2>
    {phase === 'loading' && <p role="status">Checking the ledger…</p>}
    {phase === 'closed' && <p>The Guild ledger opens with the launch. Your outlaw is safe in this browser until then.</p>}
    {phase === 'no-wallet' && <>
      <p>One outlaw per wallet. Connect your NEAR wallet (top of the page) to put yours in the Guild ledger.</p>
      <RankLadder />
    </>}
    {phase === 'stranger' && <>
      <p>Put <strong>{draft.name.trim() || 'your outlaw'}</strong> in the ledger, linked to <strong>{id}</strong>. One outlaw per wallet. You sign a free message: no transaction, no fee.</p>
      <button type="button" className="button" disabled={!connection || Boolean(busy)} onClick={() => void join()}>{busy === 'join' ? 'CHECK YOUR WALLET…' : 'JOIN THE GUILD · +1 TICKET'}</button>
      <RankLadder />
    </>}
    {phase === 'member' && saved && <>
      <div className="join-member">
        {portrait && <img className="join-portrait" src={portrait} alt={`${saved.draft.name} painted portrait`} width={208} height={312} />}
        <div>
          <p className="join-rank"><span>{rank.icon} {rank.name.toUpperCase()}</span> · +{rank.bonus} TICKET AT EVERY DRAW YOU ENTER</p>
          <p>{saved.draft.species} · {saved.draft.class} · {saved.draft.outfit}{saved.draft.details.length ? ` · ${saved.draft.details.map(detailLabel).join(', ')}` : ''}</p>
          <p className="note">Your rank grows while you hold: check it any time on <Link href="/raid">Am I in?</Link></p>
        </div>
      </div>
      {changed && <button type="button" className="button" disabled={Boolean(busy)} onClick={() => void update()}>{busy === 'update' ? 'SAVING…' : 'SAVE MY CHANGES TO THE LEDGER'}</button>}
      <button type="button" className="button prominent-download" disabled={Boolean(busy) || !draft.details.length} onClick={() => void paint()}>
        {busy === 'paint' ? 'PAINTING…' : portrait ? 'PAINT A NEW PORTRAIT' : 'PAINT MY UNIQUE PORTRAIT'}
      </button>
      {!draft.details.length && <p className="note">Pick at least one mark (the Marks tab above) so the painter knows what makes you different.</p>}
      <p className="note">Three paintings a day. Painted by NEAR AI: <Link href="/near">how it works →</Link></p>
      <RankLadder />
    </>}
    {status && <p role="status" className="join-status">{status}</p>}
  </section>;
}

function RankLadder() {
  return <div className="rank-ladder" aria-label="Outlaw ranks">
    {RANKS.map(rank => <div key={rank.id}><strong>{rank.icon} {rank.name}</strong><span>+{rank.bonus} {rank.bonus === 1 ? 'ticket' : 'tickets'}</span><small>{rank.how}</small></div>)}
  </div>;
}
