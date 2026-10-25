'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CharacterCard from './CharacterCard';
import CharacterDownload from './CharacterDownload';
import CharacterPreview from '@/components/character/CharacterPreview';
import { resolveAppearance } from '@/lib/character/appearance';
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
  const [guestAvailable, setGuestAvailable] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      const storage = accountId ? localStorage : sessionStorage;
      const raw = storage.getItem(draftKey(accountId));
      setDraft(parseDraft(raw));
      setHasDraft(raw !== null);
      setSaved(accountId ? 'Wallet draft stays on this browser.' : 'Unconnected draft stays in this tab.');
      if (accountId && raw === null) setGuestAvailable(sessionStorage.getItem(draftKey()) !== null);
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
      return true;
    } catch { setSaved('Could not save locally: browser storage is unavailable or full. Edits remain for this visit only.'); return false; }
  }

  function copyGuestDraft() {
    if (!accountId || hasDraft) return;
    try {
      // Recheck storage on click: avoid overwriting an account draft saved by another tab.
      if (localStorage.getItem(draftKey(accountId)) !== null) {
        setGuestAvailable(false);
        setSaved('This account already has a saved draft. Reload to load it; nothing was overwritten.');
        return;
      }
      const raw = sessionStorage.getItem(draftKey());
      if (raw === null) { setGuestAvailable(false); setSaved('No guest draft is available in this tab.'); return; }
      const next = parseDraft(raw);
      if (persist(next, true)) {
        setDraft(next);
        setGuestAvailable(false);
      }
    } catch { setSaved('Could not copy the guest draft: browser storage is unavailable. Nothing was overwritten.'); }
  }

  const appearance = resolveAppearance(draft);

  return <>
    <section id="guild" className={dedicated ? "guild my-outlaw" : "guild"}>
      <p className="eyebrow">THE GUILD WORKSHOP</p>
      {dedicated ? <><Link className="profile-inline-link" href="/">← BACK TO THE TALE</Link><h1>YOUR OUTLAW</h1>
        <p className="identity-mode">{accountId ? 'WALLET LINKED · SAVED ON THIS DEVICE' : 'NO WALLET · GUEST OUTLAW'}</p>
        {loaded && !hasDraft && <p className="identity-empty"><strong>Every outlaw starts as a stranger.</strong> Give this one a name, a creature and a calling.</p>}
      </> : <h2>CREATE YOUR OUTLAW</h2>}
      <nav className="studio-nav" aria-label="Creator sections"><a href="#customize">CUSTOMIZE</a><a href="#wanted-poster">WANTED POSTER</a><a href={dedicated ? "#passport-title" : "#profile"}>{dedicated ? "PASSPORT" : "PROFILE"}</a></nav>
      <div className="builder-stage cinematic-builder">
        <div className="portrait-pane">
          <p className="eyebrow">THE PORTRAIT</p>
          <CharacterPreview draft={draft} large />
          <p className="portrait-identity">{draft.name || 'UNKNOWN OUTLAW'}</p>
          <p className="portrait-story">{draft.outfit} / {draft.personality}</p>
          <div className="art-availability" role="status"><strong>{appearance.kind === 'cinematic' ? 'PAINTED BY THE GUILD' : 'NOT PAINTED YET'}</strong><p>{appearance.note}</p></div>
        </div>
        <div id="customize" className="controls" aria-busy={!loaded}>
          <div className="studio-heading"><p className="eyebrow">MAKE IT YOURS</p><h2>WHO ARE YOU, STRANGER?</h2></div>
          <label>YOUR OUTLAW NAME<input ref={input} maxLength={32} value={draft.name} disabled={!loaded} onChange={event => update('name', event.target.value)} /></label>
          <ChoiceDeck draft={draft} disabled={!loaded} onChange={update} />
          {accountId && guestAvailable && !hasDraft && <div className="guest-draft-copy">
            <p className="note">You made an outlaw before linking your wallet. Want to bring them along? The guest copy stays where it is.</p>
            <button type="button" className="button" disabled={!loaded} onClick={copyGuestDraft}>BRING MY GUEST OUTLAW</button>
          </div>}
          <button type="button" className="button save-draft" disabled={!loaded} onClick={() => persist(draft, true)}>SAVE DRAFT</button>
          <p className="note" role="status">{saved}</p>
        </div>
      </div>
      <div id="wanted-poster" className="creator cinematic-keepsakes">
        {dedicated ? <><div className="poster-group"><div className="poster"><div className="wanted">WANTED</div><CharacterPreview draft={draft} /><h3>{draft.name || 'UNKNOWN OUTLAW'}</h3><p>{draft.class} · {draft.species} · {draft.outfit}</p><p>{draft.personality} · A SKETCH · NOT YET IN THE LEDGER</p></div><CharacterDownload draft={draft} /></div><CharacterCard draft={draft} accountId={accountId} /></> : <div className="poster-group"><div className="poster">
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
      {dedicated ? <h2 id="profile-title" className="identity-disclaimer-title">WHERE YOUR OUTLAW LIVES</h2> : <><div className="profile-heading">
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
        <strong>Kept in your satchel, not in the royal ledger.</strong>
        {dedicated && }
        <p>Your outlaw is saved only in this browser. Linking a wallet just tells us your name: it doesn&rsquo;t prove anything, register anything or earn anything yet.</p>
        <p>{accountId ? 'Each wallet keeps its own outlaw on this device. Switch wallets and you will meet a different one.' : 'Without a wallet, your outlaw lives in this tab until you close it.'}</p>
      </div>
    </section>
  </>;
}
