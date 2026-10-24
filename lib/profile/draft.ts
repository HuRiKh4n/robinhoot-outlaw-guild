import catalogue from '../character/portraits.json';

export const species = ['Raccoon', 'Wolf', 'Rabbit', 'Fox', 'Badger', 'Owl', 'Bear'] as const;
export const classes = ['Scout', 'Ranger', 'Trickster', 'Guardian', 'Rogue', 'Warrior', 'Mage'] as const;
export const outfits = ['Patched Cloak', 'Ragged Hood', 'Worn Leather Vest'] as const;
export const personalities = ['Cunning', 'Fearless', 'Chaotic', 'Loyal'] as const;
export interface OutlawDraft {
  name: string;
  species: typeof species[number];
  class: typeof classes[number];
  outfit: string;
  personality: typeof personalities[number];
}
export const defaultDraft: OutlawDraft = {
  name: 'The Broke Bandit', species: 'Raccoon', class: 'Scout', outfit: 'Patched Cloak', personality: 'Cunning',
};

/** Registry entries define class outfit choices even while their artwork is missing. */
export function outfitsFor(characterClass: string): readonly string[] {
  const registered = catalogue.filter(asset => asset.class === characterClass).map(asset => asset.outfit).filter((value): value is string => typeof value === 'string');
  return registered.length ? [...new Set(registered)] : outfits;
}
export function classDraft(draft: OutlawDraft, characterClass: OutlawDraft['class']): OutlawDraft {
  return { ...draft, class: characterClass, outfit: outfitsFor(characterClass)[0] };
}

/** Local data is untrusted. Accept only the creator's fields and allowed values. */
export function parseDraft(raw: string | null): OutlawDraft {
  if (!raw) return { ...defaultDraft };
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ...defaultDraft };
    const value = data as Record<string, unknown>;
    function choice<T extends string>(options: readonly T[], input: unknown, fallback: T): T {
      return typeof input === 'string' && options.includes(input as T) ? input as T : fallback;
    }
    const characterClass = choice(classes, value.class, defaultDraft.class);
    const aliases: Record<string, string> = { 'Worn Leather Vest': 'Leather Vest', 'Ragged Hood': 'Forest Hood' };
    const oldOutfit = typeof value.outfit === 'string' ? value.outfit : '';
    const normalized = characterClass === 'Ranger' ? aliases[oldOutfit] ?? oldOutfit : oldOutfit;
    return {
      name: typeof value.name === 'string' ? value.name.slice(0, 32) : defaultDraft.name,
      species: choice(species, value.species ?? value.animal, defaultDraft.species),
      class: characterClass,
      outfit: choice(outfitsFor(characterClass), normalized, outfitsFor(characterClass)[0]),
      personality: choice(personalities, value.personality ?? value.trait, defaultDraft.personality),
    };
  } catch { return { ...defaultDraft }; }
}

export function draftKey(accountId?: string) {
  return accountId ? `robinhoot:profile:v1:mainnet:${encodeURIComponent(accountId)}` : 'robinhoot:outlaw-draft';
}
