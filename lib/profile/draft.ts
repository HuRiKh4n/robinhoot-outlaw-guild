import catalogue from '../character/portraits.json';
import { cleanDetails, type DetailId } from '../character/details';

export const species = ['Raccoon', 'Wolf', 'Rabbit', 'Fox', 'Badger', 'Owl', 'Bear'] as const;
/** Species shown in the creator: only those with at least one ready portrait.
 *  Owl and Bear stay valid for stored drafts and reappear automatically once their art is registered. */
export const offeredSpecies: readonly typeof species[number][] = species.filter(name =>
  catalogue.some(asset => asset.species === name && asset.status === 'ready'));
/** Classes offered in the creator: only those with a registered cinematic wardrobe. */
export const classes = ['Scout', 'Ranger', 'Trickster', 'Rogue', 'Warrior', 'Mage'] as const;
/** Retired classes (no artwork yet) map to the closest active class when an old draft is read. */
export const legacyClasses: Record<string, typeof classes[number]> = { Guardian: 'Warrior' };
export const outfits = ['Patched Cloak', 'Ragged Hood', 'Worn Leather Vest'] as const;
export const personalities = ['Cunning', 'Fearless', 'Chaotic', 'Loyal'] as const;
export interface OutlawDraft {
  name: string;
  species: typeof species[number];
  class: typeof classes[number];
  outfit: string;
  personality: typeof personalities[number];
  /** Personal marks painted on the portrait (max 3). */
  details: DetailId[];
}
export const defaultDraft: OutlawDraft = {
  name: 'The Broke Bandit', species: 'Wolf', class: 'Ranger', outfit: 'Patched Cloak', personality: 'Cunning', details: [],
};

/** Registry entries define class outfit choices even while their artwork is missing. */
/** Outfits painted for a class; with a species, only the ones painted for that animal. */
export function outfitsFor(characterClass: string, animal?: string): readonly string[] {
  const pick = (withSpecies: boolean) => catalogue
    .filter(asset => asset.class === characterClass && asset.status === 'ready' && (!withSpecies || asset.species === animal))
    .map(asset => asset.outfit).filter((value): value is string => typeof value === 'string');
  const registered = animal ? pick(true) : [];
  const fallback = pick(false);
  return registered.length ? [...new Set(registered)] : fallback.length ? [...new Set(fallback)] : outfits;
}
export function classDraft(draft: OutlawDraft, characterClass: OutlawDraft['class']): OutlawDraft {
  const choices = outfitsFor(characterClass, draft.species);
  return { ...draft, class: characterClass, outfit: choices.includes(draft.outfit) ? draft.outfit : choices[0] };
}
/** Changing animal keeps the class and outfit when that animal has them, otherwise picks one it has. */
export function speciesDraft(draft: OutlawDraft, animal: OutlawDraft['species']): OutlawDraft {
  const choices = outfitsFor(draft.class, animal);
  return { ...draft, species: animal, outfit: choices.includes(draft.outfit) ? draft.outfit : choices[0] };
}

/** Local data is untrusted. Accept only the creator's fields and allowed values. */
export function parseDraft(raw: string | null): OutlawDraft {
  if (!raw) return { ...defaultDraft, details: [] };
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ...defaultDraft, details: [] };
    const value = data as Record<string, unknown>;
    function choice<T extends string>(options: readonly T[], input: unknown, fallback: T): T {
      return typeof input === 'string' && options.includes(input as T) ? input as T : fallback;
    }
    const storedClass = typeof value.class === 'string' ? legacyClasses[value.class] ?? value.class : value.class;
    const characterClass = choice(classes, storedClass, defaultDraft.class);
    const aliases: Record<string, string> = { 'Worn Leather Vest': 'Leather Vest', 'Ragged Hood': 'Forest Hood' };
    const oldOutfit = typeof value.outfit === 'string' ? value.outfit : '';
    const normalized = characterClass === 'Ranger' ? aliases[oldOutfit] ?? oldOutfit : oldOutfit;
    const animal = choice(species, value.species ?? value.animal, defaultDraft.species);
    const wardrobe = outfitsFor(characterClass, animal);
    return {
      name: typeof value.name === 'string' ? value.name.slice(0, 32) : defaultDraft.name,
      species: animal,
      class: characterClass,
      outfit: choice(wardrobe, normalized, wardrobe[0]),
      personality: choice(personalities, value.personality ?? value.trait, defaultDraft.personality),
      details: cleanDetails(value.details),
    };
  } catch { return { ...defaultDraft, details: [] }; }
}

export function draftKey(accountId?: string) {
  return accountId ? `robinhoot:profile:v1:mainnet:${encodeURIComponent(accountId)}` : 'robinhoot:outlaw-draft';
}
