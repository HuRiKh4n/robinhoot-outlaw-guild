import type { OutlawDraft } from '../profile/draft';
import catalogue from './portraits.json';

export interface PortraitAsset {
  id: string; species: string; class: string; outfit: string | null;
  status: 'ready' | 'awaiting-artwork'; src: string;
  width: number; height: number; credit: string; fallback?: boolean;
}
export const portraits = catalogue as PortraitAsset[];

/** Exact species/class/outfit only. An explicit same-outfit legacy fallback never implies a new variant. */
export function resolveAppearance(draft: OutlawDraft, assets: readonly PortraitAsset[] = portraits) {
  const matches = assets.filter(asset => asset.status === 'ready' && asset.species === draft.species && asset.class === draft.class && asset.outfit === draft.outfit);
  const portrait = matches.find(asset => !asset.fallback) ?? matches.find(asset => asset.fallback);
  if (portrait) return {
    kind: 'cinematic' as const, src: portrait.src, width: portrait.width, height: portrait.height,
    alt: `${draft.species} ${draft.class} wearing ${draft.outfit}. Cinematic character artwork.`,
    label: portrait.fallback ? 'Cinematic artwork · original portrait fallback' : 'Cinematic character artwork',
    note: `${portrait.fallback ? 'Showing the original Patched Cloak portrait; the newly registered variant file is unavailable.' : 'Selected portrait artwork.'} Personality is a saved story detail; it does not change this portrait.`,
    exportLabel: portrait.fallback ? 'ORIGINAL PORTRAIT FALLBACK · LOCAL DRAFT' : 'CINEMATIC PORTRAIT · LOCAL DRAFT',
  };
  return {
    kind: 'unavailable' as const, src: undefined, width: 480, height: 620,
    alt: `${draft.species} ${draft.class}, ${draft.outfit}. Cinematic artwork unavailable.`,
    label: 'Cinematic artwork not yet available',
    note: `No cinematic artwork is available for ${draft.species} / ${draft.class} / ${draft.outfit}. Your choices remain editable; no other character or outfit is substituted. PNG exports contain identity details and an explicit artwork-unavailable notice.`,
    exportLabel: 'ARTWORK UNAVAILABLE · IDENTITY DETAILS ONLY',
  };
}
