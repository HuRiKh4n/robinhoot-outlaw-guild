'use client';

import { useEffect, useState } from 'react';
import type { OutlawDraft } from '@/lib/profile/draft';
import { resolveAppearance } from '@/lib/character/appearance';
import { drawPassport } from './CharacterCard';
import DownloadPngButton from './DownloadPngButton';

export default function CharacterDownload({ draft, source: painted }: { draft: OutlawDraft; source?: string }) {
  const fingerprint = JSON.stringify([draft, painted]);
  const [asset, setAsset] = useState<{ fingerprint: string; url: string }>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let url: string | undefined;
    setFailed(false);
    const image = new Image();
    function render(character?: HTMLImageElement) {
      if (!active) return;
      const canvas = document.createElement('canvas'); canvas.width = 840; canvas.height = 1120;
      const context = canvas.getContext('2d');
      if (!context) { setFailed(true); return; }
      drawPassport(context, draft, undefined, character, 'WANTED');
      try {
        canvas.toBlob(blob => {
          if (!active) return;
          if (!blob) { setFailed(true); return; }
          url = URL.createObjectURL(blob); setAsset({ fingerprint, url });
        }, 'image/png');
      } catch { setFailed(true); }
    }
    image.onload = () => render(image);
    image.onerror = () => { if (active) setFailed(true); };
    const source = painted ?? resolveAppearance(draft).src;
    if (source) image.src = source; else render();
    return () => { active = false; image.onload = null; image.onerror = null; if (url) URL.revokeObjectURL(url); };
  }, [fingerprint]);
  return <DownloadPngButton url={asset?.fingerprint === fingerprint ? asset.url : undefined} filename="robinhoot-character.png" label="DOWNLOAD CHARACTER" failed={failed} />;
}
