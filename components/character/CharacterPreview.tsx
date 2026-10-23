'use client';

import { useState } from 'react';
import type { OutlawDraft } from '@/lib/profile/draft';
import { resolveAppearance } from '@/lib/character/appearance';

export default function CharacterPreview({ draft, large = false }: { draft: OutlawDraft; large?: boolean }) {
  const art = resolveAppearance(draft);
  const [failedSource, setFailedSource] = useState<string>();
  return <figure className={large ? 'character-preview character-preview-large' : 'character-preview'}>
    <div className="portrait-frame" data-art-kind={art.kind}>
      {failedSource === art.src ? <div className="portrait-unavailable" role="status">Character artwork could not load. Your selections remain saved; image downloads are unavailable.</div>
        : <img src={art.src} width={art.width} height={art.height} alt={art.alt} onError={() => setFailedSource(art.src)} />}
    </div>
    <figcaption>{large && <strong>{draft.species} · {draft.class}</strong>}<span>{art.label}</span></figcaption>
  </figure>;
}
