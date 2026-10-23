'use client';

import { useEffect, useRef, useState } from 'react';
import type { OutlawDraft } from '@/lib/profile/draft';
import { resolveAppearance } from '@/lib/character/appearance';
import DownloadPngButton from './DownloadPngButton';

const shortAccount = (value: string) => value.length > 24 ? `${value.slice(0, 10)}…${value.slice(-9)}` : value;

/** The preview and PNG share this canvas, with no external font or rendering library. */
export default function CharacterCard({ draft, accountId }: { draft: OutlawDraft; accountId?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const manualCopy = useRef<HTMLTextAreaElement>(null);
  const [includeAccount, setIncludeAccount] = useState(false);
  const [asset, setAsset] = useState<{ fingerprint: string; url: string }>();
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState('');
  const [manual, setManual] = useState(false);
  const displayedAccount = includeAccount && accountId ? shortAccount(accountId) : undefined;
  const appearance = resolveAppearance(draft);
  const fingerprint = JSON.stringify([draft, displayedAccount]);
  const currentAsset = asset?.fingerprint === fingerprint ? asset : undefined;
  const shareText = `ROBINHOOT · GUILD PASSPORT\n${draft.name || 'UNKNOWN OUTLAW'}\n${draft.class} · ${draft.species}\n${draft.outfit} · ${draft.personality}${displayedAccount ? `\nNEAR: ${displayedAccount}` : ''}\n${appearance.label}\n${appearance.note}\nPREVIEW / NOT MINTED / NOT REGISTERED\nLocal draft only. Wallet connection is not proof of ownership or authentication. No on-chain or server verification.`;

  useEffect(() => {
    let active = true;
    let url: string | undefined;
    setFailed(false);
    setStatus('');
    setManual(false);
    const image = new Image();
    async function render(character?: HTMLImageElement) {
      if (!active || !canvas.current) return;
      const ctx = canvas.current.getContext('2d');
      if (!ctx) { setFailed(true); return; }
      drawPassport(ctx, draft, displayedAccount, character);
      try {
        const blob = await new Promise<Blob | null>(resolve => canvas.current?.toBlob(resolve, 'image/png'));
        if (!active) return;
        if (!blob) { setFailed(true); return; }
        url = URL.createObjectURL(blob);
        setAsset({ fingerprint, url });
      } catch { if (active) setFailed(true); }
    }
    image.onload = () => { void render(image); };
    image.onerror = () => { if (active) setFailed(true); };
    // Clear the old portrait immediately; a failed replacement must not show stale artwork.
    const context = canvas.current?.getContext('2d');
    context?.clearRect(0, 0, 840, 1120);
    const source = resolveAppearance(draft).src;
    if (source) image.src = source; else void render();
    return () => { active = false; image.onload = null; image.onerror = null; if (url) URL.revokeObjectURL(url); };
  // The fingerprint represents every value painted onto the image.
  }, [fingerprint]);

  useEffect(() => { if (manual) { manualCopy.current?.focus(); manualCopy.current?.select(); } }, [manual]);

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: 'RobinHoot Passport Preview', text: shareText }); setStatus('Passport details shared.'); return; }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') { setStatus('Sharing cancelled.'); return; } }
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(shareText);
      setStatus('Passport details copied.');
    } catch { setManual(true); setStatus('Select and copy the passport details below.'); }
  }

  return <section className="passport" aria-labelledby="passport-title">
    <div className="profile-heading"><div><p className="eyebrow">CARRY THE LEGEND</p><h2 id="passport-title">GUILD PASSPORT</h2></div><span className="prototype-badge">CHARACTER CARD PREVIEW</span></div>
    <div className="passport-layout">
      <div className="passport-art">
        <canvas ref={canvas} width={840} height={1120} role="img" aria-label={`Guild Passport preview for ${draft.name || 'UNKNOWN OUTLAW'}, ${draft.class}, ${draft.species}, ${draft.outfit}, ${draft.personality}${displayedAccount ? `, NEAR ${displayedAccount}` : ''}. ${appearance.label}. Preview, not minted, not registered.`}>Your passport identity is listed alongside this image.</canvas>
        <DownloadPngButton url={currentAsset?.url} filename="robinhoot-passport-preview.png" label="DOWNLOAD GUILD PASSPORT" failed={failed} />
      </div>
      <div className="passport-tools">
        <h3>YOUR OUTLAW, ON A CARD.</h3>
        <p className="passport-flags">Preview / Not minted / Not registered</p>
        <dl><div><dt>NAME</dt><dd>{draft.name || 'UNKNOWN OUTLAW'}</dd></div><div><dt>IDENTITY</dt><dd>{draft.class} · {draft.species}</dd></div><div><dt>OUTFIT</dt><dd>{draft.outfit}</dd></div><div><dt>PERSONALITY</dt><dd>{draft.personality}</dd></div></dl>
        {accountId && <label className="passport-account-option"><input type="checkbox" checked={includeAccount} onChange={event => setIncludeAccount(event.target.checked)} />Include shortened NEAR account on the card and shared text</label>}
        <p>{appearance.label}. {appearance.note} Available artwork is shared by every preview and PNG. Unavailable selections export identity details only.</p>
        {failed && <p className="note">Image download is unavailable. Share or copy your details instead.</p>}
        <button type="button" className="button passport-share" onClick={() => void share()}>SHARE / COPY DETAILS ↗</button>
        <p className="note" role="status">{status}</p>
        {manual && <label className="passport-copy-label">Passport text to copy<textarea ref={manualCopy} readOnly value={shareText} rows={8} /></label>}
        <p className="note">Local draft only. A wallet connection is not proof of ownership or authentication. This card is not on-chain or server-verified and grants no membership.</p>
      </div>
    </div>
  </section>;
}

export function drawPassport(ctx: CanvasRenderingContext2D, draft: OutlawDraft, account: string | undefined, character: HTMLImageElement | undefined, title: 'GUILD PASSPORT' | 'WANTED' = 'GUILD PASSPORT') {
  ctx.fillStyle = '#dec28d'; ctx.fillRect(0, 0, 840, 1120);
  if (title === 'WANTED') {
    const parchment = ctx.createRadialGradient(420, 500, 100, 420, 500, 760);
    parchment.addColorStop(0, '#e2cfaa'); parchment.addColorStop(1, '#ac8556');
    ctx.fillStyle = parchment; ctx.fillRect(0, 0, 840, 1120);
    ctx.strokeStyle = '#66462718'; ctx.lineWidth = 1;
    for (let y = 20; y < 1120; y += 19) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(820, y + 8); ctx.stroke(); }
  }
  ctx.strokeStyle = '#a77c4b'; ctx.lineWidth = 14; ctx.strokeRect(14, 14, 812, 1092);
  ctx.strokeStyle = '#8e6b43'; ctx.lineWidth = 2; ctx.strokeRect(32, 32, 776, 1056);
  ctx.textAlign = 'center'; ctx.fillStyle = '#402619'; ctx.font = 'bold 24px sans-serif'; ctx.fillText('ROBINHOOT · OUTLAW GUILD', 420, 79);
  ctx.font = title === 'WANTED' ? 'bold 65px Georgia, serif' : 'bold 51px serif'; ctx.fillText(title, 420, 143);
  ctx.fillStyle = '#17201b'; ctx.fillRect(65, 173, 710, 345);
  if (character) {
    const scale = Math.min(710 / character.naturalWidth, 345 / character.naturalHeight);
    const width = character.naturalWidth * scale; const height = character.naturalHeight * scale;
    ctx.drawImage(character, 65 + (710 - width) / 2, 173 + (345 - height) / 2, width, height);
  } else {
    ctx.fillStyle = '#d6c19a'; ctx.font = 'bold 24px serif';
    ctx.fillText('CINEMATIC ARTWORK NOT YET AVAILABLE', 420, 325, 650);
    ctx.font = '18px sans-serif'; ctx.fillText('Identity details only · no substitute illustration', 420, 365, 650);
  }
  ctx.fillStyle = '#a93624'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(resolveAppearance(draft).exportLabel, 420, 560, 710);
  ctx.fillStyle = '#402619';
  const name = draft.name || 'UNKNOWN OUTLAW';
  let fontSize = 49;
  do { ctx.font = `bold ${fontSize}px sans-serif`; fontSize--; } while (ctx.measureText(name).width > 690 && fontSize > 23);
  ctx.fillText(name, 420, 628, 690);
  const rows = [['CLASS', draft.class], ['SPECIES', draft.species], ['OUTFIT', draft.outfit], ['PERSONALITY', draft.personality]];
  ctx.textAlign = 'left';
  rows.forEach(([label, value], index) => {
    const x = index % 2 === 0 ? 80 : 440; const y = index < 2 ? 696 : 802;
    ctx.fillStyle = '#8e271c'; ctx.font = 'bold 17px sans-serif'; ctx.fillText(label, x, y);
    ctx.fillStyle = '#402619'; ctx.font = '25px sans-serif'; ctx.fillText(value, x, y + 36, 325);
  });
  ctx.textAlign = 'center'; ctx.font = '19px monospace'; ctx.fillStyle = '#402619';
  ctx.fillText(account ? `NEAR · ${account}` : 'ACCOUNT HIDDEN · LOCAL PREVIEW', 420, 906, 680);
  ctx.fillStyle = '#8e271c'; ctx.font = 'bold 23px sans-serif'; ctx.fillText('PREVIEW / NOT MINTED / NOT REGISTERED', 420, 973, 700);
  ctx.fillStyle = '#402619'; ctx.font = '17px sans-serif';
  ctx.fillText('Wallet connection is not proof of ownership or authentication.', 420, 1015, 700);
  ctx.fillText('No on-chain registration, server verification or membership.', 420, 1045, 700);
}
