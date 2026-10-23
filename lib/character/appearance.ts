import type { OutlawDraft } from '../profile/draft';
import catalogue from './portraits.json';
import { characterSvg } from './render';

export interface PortraitAsset {
  id: string;
  species: string;
  class: string;
  outfit: string | null;
  status: 'ready' | 'awaiting-artwork';
  src: string;
  width: number;
  height: number;
  credit: string;
}

export const portraits = catalogue as PortraitAsset[];

/** Resolve exact artwork coverage. Never reuse a portrait for a different class/outfit. */
export function resolveAppearance(draft: OutlawDraft, assets: readonly PortraitAsset[] = portraits) {
  const portrait = assets.find(asset => asset.status === 'ready' && asset.species === draft.species
    && asset.class === draft.class && asset.outfit === draft.outfit);
  if (portrait) return {
    kind: 'cinematic' as const, src: portrait.src, width: portrait.width, height: portrait.height,
    alt: `${draft.species} ${draft.class} wearing ${draft.outfit}. Cinematic character artwork.`,
    label: 'Cinematic character artwork',
    note: 'Selected portrait artwork. Personality is a saved story detail; it does not change this portrait.',
    exportLabel: 'CINEMATIC PORTRAIT · LOCAL DRAFT',
  };
  return {
    kind: 'prototype' as const,
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(characterSvg(draft))}`,
    width: 480, height: 620,
    alt: `${draft.species} ${draft.class} wearing ${draft.outfit}, ${draft.personality} personality. Vector illustration prototype.`,
    label: 'Vector prototype · cinematic artwork unavailable',
    note: `No cinematic artwork is available for ${draft.species} / ${draft.class} / ${draft.outfit}. The existing vector preview shows your choices.`,
    exportLabel: 'VECTOR PROTOTYPE · CINEMATIC ART PENDING',
  };
}
