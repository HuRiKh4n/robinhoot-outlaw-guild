'use client';

import { useEffect, useRef, useState } from 'react';
import { useWalletState } from '@/hooks/useWalletState';
import { classes, defaultDraft, draftKey, outfits, parseDraft, personalities, species, type OutlawDraft } from '@/lib/profile/draft';

const portraits = { Raccoon: '🦝', Wolf: '🐺', Rabbit: '🐰', Fox: '🦊', Badger: '🦡', Owl: '🦉' };

export default function OutlawProfile() {
  const { account, ready } = useWalletState();
  if (!ready) return <section className="guild" id="guild" aria-busy="true"><h2>CREATE YOUR OUTLAW</h2><p role="status">Loading your local draft…</p></section>;
  // A fresh editor for every identity prevents a previous wallet's state being saved to the next.
  return <DraftEditor key={account?.accountId ?? 'unconnected'} accountId={account?.accountId} />;
}

function DraftEditor({ accountId }: { accountId?: string }) {
  const [draft, setDraft] = useState<OutlawDraft>({ ...defaultDraft });
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      const storage = accountId ? localStorage : sessionStorage;
      setDraft(parseDraft(storage.getItem(draftKey(accountId))));
      setSaved(accountId ? 'Wallet draft stays on this browser.' : 'Unconnected draft stays in this tab.');
    } catch { setSaved('Storage unavailable. Edits work for this visit only.'); }
    setLoaded(true);
  }, [accountId]);

  function update<K extends keyof OutlawDraft>(field: K, value: OutlawDraft[K]) {
    if (!loaded) return;
    const next = { ...draft, [field]: value };
    setDraft(next);
    try {
      (accountId ? localStorage : sessionStorage).setItem(draftKey(accountId), JSON.stringify(next));
      setSaved(accountId ? 'Draft saved on this browser for this account.' : 'Unconnected draft saved in this tab.');
    } catch { setSaved('Storage unavailable. Edits work for this visit only.'); }
  }

  return <>
    <section id="guild" className="guild">
      <p className="eyebrow">CHAPTER II · ASSEMBLE THE GUILD</p>
      <h2>CREATE YOUR OUTLAW</h2>
      <p>Choose your identity and preview your WANTED poster. Wallet connection is optional. AI image generation and guild registration are coming in a later release.</p>
      <a href="#profile" className="profile-inline-link">VIEW YOUR OUTLAW PROFILE ↓</a>
      <div className="creator">
        <div className="controls" aria-busy={!loaded}>
          <label>YOUR OUTLAW NAME<input ref={input} maxLength={32} value={draft.name} disabled={!loaded} onChange={event => update('name', event.target.value)} /></label>
          <label>YOUR CLASS<select value={draft.class} disabled={!loaded} onChange={event => update('class', event.target.value as OutlawDraft['class'])}>{classes.map(value => <option key={value}>{value}</option>)}</select></label>
          <label>YOUR SPECIES<select value={draft.species} disabled={!loaded} onChange={event => update('species', event.target.value as OutlawDraft['species'])}>{species.map(value => <option key={value}>{value}</option>)}</select></label>
          <label>YOUR OUTFIT<select value={draft.outfit} disabled={!loaded} onChange={event => update('outfit', event.target.value as OutlawDraft['outfit'])}>{outfits.map(value => <option key={value}>{value}</option>)}</select></label>
          <label>YOUR PERSONALITY<select value={draft.personality} disabled={!loaded} onChange={event => update('personality', event.target.value as OutlawDraft['personality'])}>{personalities.map(value => <option key={value}>{value}</option>)}</select></label>
          <p className="note" role="status">{saved}</p>
          <p className="note">⚒ Character preview only: AI generation and registration are not active yet. Wallet connection is optional.</p>
        </div>
        <div className="poster">
          <div className="wanted">WANTED</div>
          <div className="portrait" role="img" aria-label={draft.species}>{portraits[draft.species]}</div>
          <h3>{draft.name || 'UNKNOWN OUTLAW'}</h3>
          <p>{draft.class.toUpperCase()} · {draft.species.toUpperCase()} · {draft.outfit.toUpperCase()}</p>
          <p>KNOWN FOR: {draft.personality.toUpperCase()} MISCHIEF</p>
          <strong>REWARD: 100 LOOT</strong>
          <small>OUTLAW ID: PREVIEW-001 · DEMO ONLY</small>
          <small>ROBINHOOT · OUTLAW GUILD · NEAR</small>
        </div>
      </div>
    </section>
    <section id="profile" className="outlaw-profile" aria-labelledby="profile-title">
      <div className="profile-heading">
        <div><p className="eyebrow">YOUR STORY STARTS HERE</p><h2 id="profile-title">OUTLAW PROFILE</h2></div>
        <span className="prototype-badge">LOCAL PROTOTYPE</span>
      </div>
      <div className="profile-card">
        <div className="profile-emblem" role="img" aria-label={`${draft.species} character`}>{portraits[draft.species]}</div>
        <div className="profile-details">
          <p className="eyebrow">{accountId ? 'ACCOUNT DRAFT · MAINNET' : 'UNCONNECTED DRAFT MODE'}</p>
          <h3>{draft.name || 'UNKNOWN OUTLAW'}</h3>
          <p className="profile-account">{accountId ?? 'No wallet connected — keep creating.'}</p>
          <dl><div><dt>CLASS</dt><dd>{draft.class}</dd></div><div><dt>SPECIES</dt><dd>{draft.species}</dd></div><div><dt>OUTFIT</dt><dd>{draft.outfit}</dd></div><div><dt>PERSONALITY</dt><dd>{draft.personality}</dd></div></dl>
          <button type="button" className="button profile-edit" onClick={() => { input.current?.focus(); input.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }}>EDIT PROFILE ↑</button>
        </div>
      </div>
      <div className="prototype-notice">
        <strong>A draft, not a guild registration.</strong>
        <p>A connected wallet is NOT authenticated ownership. Profiles are NOT registered on-chain or server-verified. These editable local drafts do not establish reputation or membership.</p>
        <p>{accountId ? 'Saved only on this browser, separately for each wallet account. Switching accounts loads that account’s own draft.' : 'Your unconnected draft is separate from wallet drafts and lasts for this browser tab. Connecting a wallet does not copy it into an account profile.'}</p>
      </div>
    </section>
  </>;
}
