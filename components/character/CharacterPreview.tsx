import type { OutlawDraft } from '@/lib/profile/draft';
import { characterImage } from '@/lib/character/render';

export default function CharacterPreview({ draft, large = false }: { draft: OutlawDraft; large?: boolean }) {
  return <figure className={large ? 'character-preview character-preview-large' : 'character-preview'}>
    <img src={characterImage(draft)} width={480} height={620} alt={`${draft.species} ${draft.class} wearing ${draft.outfit}, ${draft.personality} personality. Vector illustration prototype.`} />
    {large && <figcaption><strong>{draft.species} · {draft.class}</strong><span>Live layered illustration · vector prototype</span></figcaption>}
  </figure>;
}
