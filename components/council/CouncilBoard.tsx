'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useWalletState } from '@/hooks/useWalletState';

interface Proposal { id: string; kind: 'mission' | 'prompt'; title: string; body: string; author: string; closesAt: string; status: string; vetoReason: string | null; for: number; against: number; voters: number; closed: boolean; round?: string }
interface State {
  open: boolean; launched?: boolean; nextMissionClose?: string; promptPassShare?: number; promptMinWeight?: number;
  soul?: { version: number; text: string; sha256: string; approvedAt: string };
  soulHistory?: Array<{ version: number; sha256: string; approvedAt: string; proposalId: string | null }>;
  rulesSha256?: string; mission?: Proposal | null; voting?: Proposal[]; recent?: Proposal[];
  log?: Array<{ id: string; at: string; text: string; link: string | null }>;
}
interface Me { account: string; admin: boolean; votes: Array<{ proposalId: string; choice: string; weight: number }>; weight?: number; rank?: string; error?: string }

const when = (iso?: string) => iso ? new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC' : '';

export default function CouncilBoard() {
  const { account } = useWalletState();
  const id = account?.accountId;
  const [state, setState] = useState<State | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [meError, setMeError] = useState('');
  const [busy, setBusy] = useState('');
  const [status, setStatus] = useState('');
  const [kind, setKind] = useState<'mission' | 'prompt'>('mission');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [veto, setVeto] = useState<{ id: string; reason: string } | null>(null);

  const load = useCallback(async () => {
    try { setState(await fetch('/api/council', { cache: 'no-store' }).then(r => r.json())); } catch { setState({ open: false }); }
    if (!id) { setMe(null); return; }
    const response = await fetch('/api/council/me', { headers: { 'X-Guild-Account': id }, cache: 'no-store' }).catch(() => null);
    if (!response) return;
    const data = await response.json().catch(() => ({}));
    if (response.ok) { setMe(data); setMeError(''); } else { setMe(null); setMeError(data.error ?? ''); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  async function post(path: string, data: unknown) {
    if (!id) throw new Error('Connect your wallet first.');
    const response = await fetch(`/api/council/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Guild-Account': id }, body: JSON.stringify(data) });
    const value = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(value.error ?? 'Something went wrong.');
    return value;
  }
  async function act(label: string, run: () => Promise<string>) {
    if (busy) return;
    setBusy(label); setStatus('Reading the ledger…');
    try { setStatus(await run()); await load(); } catch (error) { setStatus(error instanceof Error ? error.message : 'Something went wrong.'); }
    finally { setBusy(''); }
  }
  const castVote = (p: Proposal, choice: 'for' | 'against') => act(p.id + choice, async () => {
    const { weight } = await post('vote', { proposalId: p.id, choice });
    return `Vote counted with weight ${weight}.`;
  });
  const submit = () => act('propose', async () => {
    await post('propose', { kind, title, body: text });
    setTitle(''); setText('');
    return kind === 'mission' ? 'Mission proposed. Tell the tavern to vote for it.' : 'SOUL change proposed. The vote runs for 7 days.';
  });
  const sendVeto = () => veto && act('veto', async () => { await post('veto', { proposalId: veto.id, reason: veto.reason }); setVeto(null); return 'Vetoed, with your public reason.'; });

  if (!state) return <p className="raid-closed" role="status">Opening the Council chamber…</p>;
  if (!state.open) return <p className="raid-closed">The Council opens with the Guild ledger. Come back soon.</p>;

  const myVote = (p: Proposal) => me?.votes.find(v => v.proposalId === p.id);
  const missions = (state.voting ?? []).filter(p => p.kind === 'mission');
  const prompts = (state.voting ?? []).filter(p => p.kind === 'prompt');
  const top = Math.max(1, ...missions.map(p => p.for));

  return <>
    <section className="raid-rules council-now" aria-labelledby="mission-title">
      <h2 id="mission-title">Tobias&rsquo;s mission this week</h2>
      {state.mission ? <div className="council-card is-mission">
        <h3>{state.mission.title}</h3><p>{state.mission.body}</p>
        <small>Voted by the Guild · weight {state.mission.for} · proposed by {state.mission.author}</small>
      </div> : <p>No mission voted yet. Tobias keeps the tavern warm until the first round closes on {when(state.nextMissionClose)}.</p>}
    </section>

    <section className="raid-rules" aria-labelledby="vote-title">
      <h2 id="vote-title">Vote now</h2>
      <div className="council-me" role="status">
        {!id ? <p>Connect your wallet (top of the page) to vote.</p>
          : me ? <p>Voting as <b>{me.account}</b>{me.weight ? <> · your vote weighs <b>{me.weight}</b>{me.rank ? ` (${me.rank})` : ''}</> : null}{me.error ? <> · {me.error}</> : null}</p>
          : <p>{meError || 'Sign in first:'} <Link href="/my-outlaw">join the Guild on Your Outlaw →</Link></p>}
        <p className="note">{state.launched ? 'Your vote weighs as many tickets as you would have in the Sunday draw (max 15).' : 'Before the coin launches, every Guild member’s vote weighs 1.'}</p>
      </div>
      <h3 className="council-sub">Next mission · round closes {when(state.nextMissionClose)}</h3>
      {missions.length ? <ul className="council-list">{missions.map(p => <li key={p.id} className={`council-card${myVote(p) ? ' is-mine' : ''}${p.status === 'vetoed' ? ' is-vetoed' : ''}`}>
        <div className="council-head"><h4>{p.title}</h4><b>{p.for}</b></div>
        <div className="council-bar" aria-hidden="true"><i style={{ width: `${(p.for / top) * 100}%` }} /></div>
        <p>{p.body}</p>
        <small>by {p.author} · {p.voters} {p.voters === 1 ? 'voter' : 'voters'}</small>
        {p.status === 'vetoed' ? <p className="council-veto">Vetoed: {p.vetoReason}</p>
          : <button type="button" className="button" disabled={!me || Boolean(busy)} onClick={() => void castVote(p, 'for')}>{myVote(p) ? 'YOUR PICK ✓' : busy === p.id + 'for' ? 'VOTING…' : 'VOTE FOR THIS'}</button>}
        {me?.admin && p.status !== 'vetoed' && <button type="button" className="council-link" onClick={() => setVeto({ id: p.id, reason: '' })}>veto</button>}
      </li>)}</ul> : <p>No missions proposed for this round yet. Be the first.</p>}

      <h3 className="council-sub">Changes to Tobias&rsquo;s SOUL · pass with {Math.round((state.promptPassShare ?? 0.6) * 100)}% and at least {state.promptMinWeight} votes</h3>
      {prompts.length ? <ul className="council-list">{prompts.map(p => <li key={p.id} className={`council-card${myVote(p) ? ' is-mine' : ''}${p.status === 'vetoed' ? ' is-vetoed' : ''}`}>
        <div className="council-head"><h4>{p.title}</h4><b>{p.for} for · {p.against} against</b></div>
        <details><summary>Read the proposed SOUL</summary><pre className="council-pre">{p.body}</pre></details>
        <small>by {p.author} · closes {when(p.closesAt)}</small>
        {p.status === 'vetoed' ? <p className="council-veto">Vetoed: {p.vetoReason}</p> : <div className="council-actions">
          <button type="button" className="button" disabled={!me || Boolean(busy)} onClick={() => void castVote(p, 'for')}>{myVote(p)?.choice === 'for' ? 'FOR ✓' : 'FOR'}</button>
          <button type="button" className="button" disabled={!me || Boolean(busy)} onClick={() => void castVote(p, 'against')}>{myVote(p)?.choice === 'against' ? 'AGAINST ✓' : 'AGAINST'}</button>
        </div>}
        {me?.admin && p.status !== 'vetoed' && <button type="button" className="council-link" onClick={() => setVeto({ id: p.id, reason: '' })}>veto</button>}
      </li>)}</ul> : <p>No SOUL changes on the table.</p>}

      {veto && <div className="council-card"><label>Public reason for the veto<input value={veto.reason} maxLength={300} onChange={e => setVeto({ ...veto, reason: e.target.value })} /></label>
        <div className="council-actions"><button type="button" className="button" disabled={Boolean(busy)} onClick={() => void sendVeto()}>CONFIRM VETO</button><button type="button" className="council-link" onClick={() => setVeto(null)}>cancel</button></div></div>}
      {status && <p className="join-status" role="status">{status}</p>}
    </section>

    <section className="raid-rules" aria-labelledby="propose-title">
      <h2 id="propose-title">Propose</h2>
      <div className="raid-prize-toggle" role="group" aria-label="What to propose">
        <button type="button" aria-pressed={kind === 'mission'} onClick={() => setKind('mission')}>A mission · this week</button>
        <button type="button" aria-pressed={kind === 'prompt'} onClick={() => { setKind('prompt'); if (!text && state.soul) setText(state.soul.text); }}>A change to the SOUL</button>
      </div>
      <div className="council-form">
        <label>Title<input value={title} maxLength={80} onChange={e => setTitle(e.target.value)} placeholder={kind === 'mission' ? 'A week of wolf tales' : 'Tobias also speaks Italian'} /></label>
        <label>{kind === 'mission' ? 'What should Tobias do this week?' : 'The whole new SOUL (edit the current one)'}<textarea value={text} rows={kind === 'mission' ? 4 : 14} maxLength={kind === 'mission' ? 500 : 3000} onChange={e => setText(e.target.value)} /></label>
        <button type="button" className="button" disabled={!me || Boolean(busy) || !title.trim() || text.trim().length < 10} onClick={() => void submit()}>{busy === 'propose' ? 'SENDING…' : 'PROPOSE'}</button>
        <p className="note">{kind === 'mission' ? 'One mission proposal per week each. The most voted wins on Wednesday 20:00 UTC.' : state.launched ? 'Captains and Legends can propose one SOUL change a month. The fixed rules can never be voted away.' : 'One SOUL change a month each. The fixed rules can never be voted away.'}</p>
      </div>
    </section>

    <section className="raid-rules" aria-labelledby="soul-title">
      <h2 id="soul-title">Tobias&rsquo;s SOUL in force</h2>
      {state.soul && <><p>Version <b>{state.soul.version}</b> · approved {when(state.soul.approvedAt)} · fingerprint <code className="council-hash">{state.soul.sha256}</code></p>
        <details><summary>Read the SOUL</summary><pre className="council-pre">{state.soul.text}</pre></details></>}
      <p>The fixed rules (never voted) · fingerprint <code className="council-hash">{state.rulesSha256}</code> · <a href="/api/council/rules" target="_blank" rel="noopener">read them ↗</a> · <a href="/api/council/brief" target="_blank" rel="noopener">what Tobias reads every run ↗</a></p>
      {Boolean(state.soulHistory?.length) && <details><summary>Earlier versions</summary><ul>{state.soulHistory!.map(v => <li key={v.version}>v{v.version} · {when(v.approvedAt)} · <code className="council-hash">{v.sha256.slice(0, 16)}…</code></li>)}</ul></details>}
    </section>

    <section className="raid-rules" aria-labelledby="log-title">
      <h2 id="log-title">What Tobias did</h2>
      {state.log?.length ? <ul className="council-log">{state.log.map(l => <li key={l.id}><time>{when(l.at)}</time> {l.text} {l.link && <a href={l.link} target="_blank" rel="noopener noreferrer">↗</a>}</li>)}</ul> : <p>Nothing yet: Tobias writes here after each mission task.</p>}
    </section>
  </>;
}
