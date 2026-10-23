'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CharacterCard from './CharacterCard';
import CharacterDownload from './CharacterDownload';
import CharacterPreview from '@/components/character/CharacterPreview';
import { useWalletState } from '@/hooks/useWalletState';
import { classes, defaultDraft, draftKey, outfits, parseDraft, personalities, species, type OutlawDraft } from '@/lib/profile/draft';

export default function OutlawProfile({ dedicated = false }: { dedicated?: boolean }) {
  const { account, ready } = useWalletState();
  if (!ready) return <section className="guild" id="guild" aria-busy="true"><h2>{dedicated ? "MY OUTLAW" : "CREATE YOUR OUTLAW"}</h2><p role="status">Loading your local draft…</p></section>;
  // A fresh editor for every identity prevents a previous wallet's state being saved to the next.
  return <DraftEditor key={account?.accountId ?? 'unconnected'} accountId={account?.accountId} dedicated={dedicated} />;
}

function DraftEditor({ accountId, dedicated }: { accountId?: string; dedicated: boolean }) {
  const [draft, setDraft] = useState<OutlawDraft>({ ...defaultDraft });
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      const storage = accountId ? localStorage : sessionStorage;
      const raw = storage.getItem(draftKey(accountId));
      setDraft(parseDraft(raw));
      setHasDraft(raw !== null);
      setSaved(accountId ? 'Wallet draft stays on this browser.' : 'Unconnected draft stays in this tab.');
    } catch { setSaved('Storage unavailable. Edits work for this visit only.'); }
    setLoaded(true);
  }, [accountId]);

  function update<K extends keyof OutlawDraft>(field: K, value: OutlawDraft[K]) {
    if (!loaded) return;
    const next = { ...draft, [field]: value };
    setDraft(next);
    setHasDraft(true);
    persist(next, false);
  }

  function persist(value: OutlawDraft, explicit: boolean) {
    try {
      (accountId ? localStorage : sessionStorage).setItem(draftKey(accountId), JSON.stringify(value));
      setHasDraft(true);
      setSaved(accountId
        ? `${explicit ? 'Saved locally' : 'Draft auto-saved'} on this browser for this account only. Not uploaded, registered or authenticated.`
        : `${explicit ? 'Saved locally' : 'Draft auto-saved'} in this browser tab only. No wallet, upload or on-chain registration.`);
    } catch { setSaved('Could not save locally: browser storage is unavailable or full. Edits remain for this visit only.'); }
  }

  return <>
    <section id="guild" className={dedicated ? "guild my-outlaw" : "guild"}>
      <p className="eyebrow">CHAPTER II · ASSEMBLE THE GUILD</p>
      {dedicated ? <><Link className="profile-inline-link" href="/">← BACK TO THE LEGEND</Link><h1>MY OUTLAW</h1>
        <p className="identity-mode">{accountId ? 'CONNECTED · ACCOUNT-ONLY' : 'DISCONNECTED · UNCONNECTED DRAFT'}</p>
        {loaded && !hasDraft && <div className="identity-empty"><strong>Your outlaw story is unwritten.</strong><p>No saved draft {accountId ? 'for this account on this browser' : 'in this tab'} yet. Start with the sample below and make it yours.</p></div>}
      </> : <h2>CREATE YOUR OUTLAW</h2>}
      <p>{dedicated ? "Edit your local identity and carry a Guild Passport preview. No wallet is required; connection only selects a separate local draft." : "Choose your identity and preview your WANTED poster. Wallet connection is optional. Character artwork is assembled locally; guild registration is not active."}</p>
      <a href={dedicated ? "#passport-title" : "#profile"} className="profile-inline-link">{dedicated ? "PREVIEW GUILD PASSPORT ↓" : "VIEW YOUR OUTLAW PROFILE ↓"}</a>
      <p className="character-art-note">Illustrated character system: original local vector prototypes. Final painted, cinematic character artwork is still pending; this is not an AI image-generation service.</p>
      <div className="builder-stage"><CharacterPreview draft={draft} large /><div className="builder-stage-copy"><p className="eyebrow">CHARACTER CREATOR 2.0</p><h2>BUILD YOUR LEGEND.</h2><p>Choose a species, equip a class and layer your worn outfit. Every selection updates the illustration and passport.</p><p className="note">Your original drafts and options are preserved. Nothing is minted or registered.</p></div></div>
      <div className="creator">
        <div className="controls" aria-busy={!loaded}>
          <label>YOUR OUTLAW NAME<input ref={input} maxLength={32} value={draft.name} disabled={!loaded} onChange={event => update('name', event.target.value)} /></label>
          <label>YOUR CLASS<select value={draft.class} disabled={!loaded} onChange={event => update('class', event.target.value as OutlawDraft['class'])}>{classes.map(value => <option key={value}>{value}</option>)}</select></label>
          <label>YOUR SPECIES<select value={draft.species} disabled={!loaded} onChange={event => update('species', event.target.value as OutlawDraft['species'])}>{species.map(value => <option key={value}>{value}</option>)}</select></label>
          <label>YOUR OUTFIT<select value={draft.outfit} disabled={!loaded} onChange={event => update('outfit', event.target.value as OutlawDraft['outfit'])}>{outfits.map(value => <option key={value}>{value}</option>)}</select></label>
          <label>YOUR PERSONALITY<select value={draft.personality} disabled={!loaded} onChange={event => update('personality', event.target.value as OutlawDraft['personality'])}>{personalities.map(value => <option key={value}>{value}</option>)}</select></label>
          <button type="button" className="button save-draft" disabled={!loaded} onClick={() => persist(draft, true)}>SAVE DRAFT</button>
          <p className="note" role="status">{saved}</p>
          <p className="note">Character preview only: no registration, authentication or minting. Wallet connection is optional.</p>
        </div>
        {dedicated ? <><div className="poster-group"><div className="poster"><div className="wanted">WANTED</div><CharacterPreview draft={draft} /><h3>{draft.name || 'UNKNOWN OUTLAW'}</h3><p>{draft.class} · {draft.species} · {draft.outfit}</p><p>{draft.personality} · LOCAL PREVIEW / NOT REGISTERED</p></div><CharacterDownload draft={draft} /></div><CharacterCard draft={draft} accountId={accountId} /></> : <div className="poster-group"><div className="poster">
          <div className="wanted">WANTED</div>
          <CharacterPreview draft={draft} />
          <h3>{draft.name || 'UNKNOWN OUTLAW'}</h3>
          <p>{draft.class.toUpperCase()} · {draft.species.toUpperCase()} · {draft.outfit.toUpperCase()}</p>
          <p>KNOWN FOR: {draft.personality.toUpperCase()} MISCHIEF</p>
          <strong>REWARD: 100 LOOT</strong>
          <small>OUTLAW ID: PREVIEW-001 · DEMO ONLY</small>
          <small>ROBINHOOT · OUTLAW GUILD · NEAR</small>
        </div><CharacterDownload draft={draft} /></div>}
      </div>
    </section>
    <section id="profile" className="outlaw-profile" aria-labelledby="profile-title">
      {dedicated ? <h2 id="profile-title" className="identity-disclaimer-title">YOUR LOCAL DRAFT</h2> : <><div className="profile-heading">
        <div><p className="eyebrow">YOUR STORY STARTS HERE</p><h2 id="profile-title">OUTLAW PROFILE</h2></div>
        <span className="prototype-badge">LOCAL PROTOTYPE</span>
      </div>
      <div className="profile-card">
        <div className="profile-emblem"><CharacterPreview draft={draft} /></div>
        <div className="profile-details">
          <p className="eyebrow">{accountId ? 'ACCOUNT DRAFT · MAINNET' : 'UNCONNECTED DRAFT MODE'}</p>
          <h3>{draft.name || 'UNKNOWN OUTLAW'}</h3>
          <p className="profile-account">{accountId ?? 'No wallet connected — keep creating.'}</p>
          <dl><div><dt>CLASS</dt><dd>{draft.class}</dd></div><div><dt>SPECIES</dt><dd>{draft.species}</dd></div><div><dt>OUTFIT</dt><dd>{draft.outfit}</dd></div><div><dt>PERSONALITY</dt><dd>{draft.personality}</dd></div></dl>
          {!dedicated && <Link className="profile-inline-link" href="/my-outlaw">OPEN MY OUTLAW / PASSPORT →</Link>}
          <button type="button" className="button profile-edit" onClick={() => { input.current?.focus(); input.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }}>EDIT PROFILE ↑</button>
        </div>
      </div>
      </>}
      <div className="prototype-notice">
        <strong>A draft, not a guild registration.</strong>
        <p>A connected wallet is NOT authenticated ownership. Profiles are NOT registered on-chain or server-verified. These editable local drafts do not establish reputation or membership.</p>
        <p>{accountId ? 'Saved only on this browser, separately for each wallet account. Switching accounts loads that account’s own draft.' : 'Your unconnected draft is separate from wallet drafts and lasts for this browser tab. Connecting a wallet does not copy it into an account profile.'}</p>
      </div>
    </section>
  </>;
}
