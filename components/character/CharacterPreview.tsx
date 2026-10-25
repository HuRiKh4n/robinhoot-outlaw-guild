'use client';

import { useState } from 'react';
import type { OutlawDraft } from '@/lib/profile/draft';
import { resolveAppearance } from '@/lib/character/appearance';

export default function CharacterPreview({ draft, large = false }: { draft: OutlawDraft; large?: boolean }) {
  const art = resolveAppearance(draft);
  const [failedSource, setFailedSource] = useState<string>();
  return <figure className={large ? 'character-preview character-preview-large' : 'character-preview'}>
    <div className="portrait-frame" data-art-kind={art.kind}>
      {!art.src ? <div className="portrait-unavailable" role="status"><strong>CINEMATIC ARTWORK UNAVAILABLE</strong><p>{draft.species} · {draft.class}</p><p>{draft.outfit}</p><small>Your selections remain editable. No substitute artwork is shown.</small></div>
        : failedSource === art.src ? <div className="portrait-unavailable" role="status">Character artwork could not load. Your selections remain saved; image downloads are unavailable.</div>
        : <picture key={art.src}>
            <source srcSet={art.display} type="image/webp" />
            <img className="portrait-reveal" src={art.src} width={art.width} height={art.height} alt={art.alt} decoding="async" onError={() => setFailedSource(art.src)} />
          </picture>}
    </div>
    <figcaption>{large && <strong>{draft.species} · {draft.class}</strong>}<span>{art.label}</span></figcaption>
  </figure>;
}
