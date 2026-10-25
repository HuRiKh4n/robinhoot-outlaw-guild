import type { OutlawDraft } from '../profile/draft';
import catalogue from './portraits.json';

export interface PortraitAsset {
  id: string; species: string; class: string; outfit: string | null;
  status: 'ready' | 'awaiting-artwork'; src: string;
  width: number; height: number; credit: string; fallback?: boolean;
}
export const portraits = catalogue as PortraitAsset[];

/** Lightweight WebP copies generated next to each original PNG (scripts/make-web-derivatives.py).
 *  The PNG original stays the source for downloads; these are only for on-screen display. */
export function webDerivatives(src: string) {
  return { display: src.replace(/\.png$/, '.webp'), thumb: src.replace(/\.png$/, '.thumb.webp') };
}

/** Exact species/class/outfit only. An explicit same-outfit legacy fallback never implies a new variant. */
export function resolveAppearance(draft: OutlawDraft, assets: readonly PortraitAsset[] = portraits) {
  const matches = assets.filter(asset => asset.status === 'ready' && asset.species === draft.species && asset.class === draft.class && asset.outfit === draft.outfit);
  const portrait = matches.find(asset => !asset.fallback) ?? matches.find(asset => asset.fallback);
  if (portrait) return {
    kind: 'cinematic' as const, src: portrait.src, ...webDerivatives(portrait.src), width: portrait.width, height: portrait.height,
    alt: `${draft.species} ${draft.class} wearing ${draft.outfit}. Cinematic character artwork.`,
    label: portrait.fallback ? 'Cinematic artwork · original portrait fallback' : 'Cinematic character artwork',
    note: `${portrait.fallback ? 'This is the first portrait the guild ever painted.' : 'Painted for your outlaw.'} Their spirit shapes the story, not the portrait.`,
    exportLabel: portrait.fallback ? 'ORIGINAL PORTRAIT FALLBACK · LOCAL DRAFT' : 'CINEMATIC PORTRAIT · LOCAL DRAFT',
  };
  return {
    kind: 'unavailable' as const, src: undefined, display: undefined, thumb: undefined, width: 480, height: 620,
    alt: `${draft.species} ${draft.class}, ${draft.outfit}. Cinematic artwork unavailable.`,
    label: 'Cinematic artwork not yet available',
    note: `The guild painters haven't reached the ${draft.species} ${draft.class} in ${draft.outfit} yet. Pick another outfit, or keep this one and check back soon.`,
    exportLabel: 'ARTWORK UNAVAILABLE · IDENTITY DETAILS ONLY',
  };
}
