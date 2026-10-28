/** Personal marks an outlaw can carry. The AI paints them on top of the guild's base portrait.
 *  A fixed list on purpose: these are the marks the image model paints well, and nobody can type anything else. */
export const DETAILS = [
  { id: 'scar', label: 'Battle scar', prompt: 'a pale old battle scar running across one eye' },
  { id: 'eyepatch', label: 'Eyepatch', prompt: 'a black leather eyepatch over one eye' },
  { id: 'coins', label: 'Coin necklace', prompt: 'a heavy necklace of gold coins around the neck' },
  { id: 'earring', label: 'Gold earring', prompt: 'a large gold hoop earring in one ear' },
  { id: 'warpaint', label: 'War paint', prompt: 'red war paint stripes across the face' },
  { id: 'feather', label: 'Red feather', prompt: 'a long bright red feather tucked into the headwear' },
  { id: 'bandana', label: 'Green armband', prompt: 'a torn green cloth band tied around one arm' },
  { id: 'chain', label: 'Broken chain', prompt: 'a broken iron shackle with a dangling chain on one wrist' },
] as const;
export type DetailId = typeof DETAILS[number]['id'];
export const MAX_DETAILS = 3;
export const detailIds: readonly string[] = DETAILS.map(detail => detail.id);
export const detailLabel = (id: string) => DETAILS.find(detail => detail.id === id)?.label ?? id;
export function cleanDetails(input: unknown): DetailId[] {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((value): value is DetailId => typeof value === 'string' && detailIds.includes(value)))].slice(0, MAX_DETAILS);
}
