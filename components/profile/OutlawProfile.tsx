'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CharacterCard from './CharacterCard';
import CharacterDownload from './CharacterDownload';
import CharacterPreview from '@/components/character/CharacterPreview';
import { portraits, resolveAppearance } from '@/lib/character/appearance';
import { useWalletState } from '@/hooks/useWalletState';
import ChoiceDeck from '@/components/character/ChoiceDeck';
import { classDraft, defaultDraft, draftKey, parseDraft, type OutlawDraft } from '@/lib/profile/draft';

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
    const next = field === 'class' ? classDraft(draft, value as OutlawDraft['class']) : { ...draft, [field]: value };
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

  const appearance = resolveAppearance(draft);

  return <>
    <section id="guild" className={dedicated ? "guild my-outlaw" : "guild"}>
      <p className="eyebrow">THE OUTLAW CHRONICLES · CHARACTER STUDIO</p>
      {dedicated ? <><Link className="profile-inline-link" href="/">← BACK TO THE LEGEND</Link><h1>MY OUTLAW</h1>
        <p className="identity-mode">{accountId ? 'CONNECTED · ACCOUNT-ONLY' : 'DISCONNECTED · UNCONNECTED DRAFT'}</p>
        {loaded && !hasDraft && <p className="identity-empty"><strong>Your outlaw story is unwritten.</strong> Shape the sample below into your own outlaw.</p>}
      </> : <h2>CREATE YOUR OUTLAW</h2>}
      <nav className="studio-nav" aria-label="Creator sections"><a href="#customize">CUSTOMIZE</a><a href="#wanted-poster">WANTED POSTER</a><a href={dedicated ? "#passport-title" : "#profile"}>{dedicated ? "PASSPORT" : "PROFILE"}</a></nav>
      <details className="art-collection-info"><summary>About the artwork collection</summary><p className="character-art-note">Cinematic collection · {portraits.some(asset => asset.status === 'ready') ? 'select portraits available' : 'artwork pending'}. Wolf Ranger uses the supplied cinematic portrait. Registered variants appear only when their original files are available. Missing combinations display no substitute illustration.</p></details>
      <div className="builder-stage cinematic-builder">
        <div className="portrait-pane">
          <p className="eyebrow">YOUR LEGEND, IN THE MAKING</p>
          <CharacterPreview draft={draft} large />
          <p className="portrait-identity">{draft.name || 'UNKNOWN OUTLAW'}</p>
          <p className="portrait-story">{draft.outfit} / {draft.personality}</p>
          <div className="art-availability" role="status"><strong>{appearance.kind === 'cinematic' ? 'PORTRAIT EQUIPPED' : 'CINEMATIC PORTRAIT PENDING'}</strong><p>{appearance.note}</p></div>
        </div>
        <div id="customize" className="controls" aria-busy={!loaded}>
          <div className="studio-heading"><p className="eyebrow">MAKE IT YOURS</p><h2>SHAPE YOUR LEGEND.</h2></div>
          <label>YOUR OUTLAW NAME<input ref={input} maxLength={32} value={draft.name} disabled={!loaded} onChange={event => update('name', event.target.value)} /></label>
          <ChoiceDeck draft={draft} disabled={!loaded} onChange={update} />
          <button type="button" className="button save-draft" disabled={!loaded} onClick={() => persist(draft, true)}>SAVE DRAFT</button>
          <p className="note" role="status">{saved}</p>
          <p className="note">Character preview only: no registration, authentication or minting. Wallet connection is optional.</p>
        </div>
      </div>
      <div id="wanted-poster" className="creator cinematic-keepsakes">
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
