/** Interactive objects in the hideout illustration.
 *  Boxes are fractions of the image: [x, y, width, height]. `wide` is the 16:9 desktop art,
 *  `tall` the 9:16 phone art. Calibrated on the dark painted hideout (public/hideout/hideout-{wide,tall}-*.webp). */
export type Box = readonly [number, number, number, number];
export interface Hotspot {
  id: 'wanted' | 'book' | 'window' | 'chest' | 'bard' | 'board';
  label: string;
  hint: string;
  href?: string;       // page link or #overlay
  action?: 'music';    // handled in the scene
  wide: Box;
  tall: Box;
}

export const hotspots: readonly Hotspot[] = [
  { id: 'wanted', label: 'Forge your outlaw', hint: 'Pin your own WANTED poster', href: '/my-outlaw', wide: [0.0, 0.05, 0.3, 0.55], tall: [0.0, 0.04, 0.42, 0.3] },
  { id: 'book', label: 'The tale', hint: 'How the guild was born', href: '#tale', wide: [0.14, 0.64, 0.22, 0.15], tall: [0.06, 0.7, 0.38, 0.11] },
  { id: 'window', label: 'The Sheriff', hint: 'Who sits in the golden castle', href: '#sheriff', wide: [0.51, 0.02, 0.17, 0.29], tall: [0.42, 0.02, 0.32, 0.24] },
  { id: 'chest', label: 'The loot', hint: 'Where every coin goes', href: '/loot', wide: [0.5, 0.69, 0.19, 0.2], tall: [0.43, 0.65, 0.4, 0.16] },
  { id: 'bard', label: 'Tavern music', hint: 'Ask the bard to play', action: 'music', wide: [0.69, 0.39, 0.14, 0.36], tall: [0.68, 0.4, 0.31, 0.24] },
  { id: 'board', label: 'Bounty board', hint: 'Jobs for brave outlaws', href: '/bounties', wide: [0.86, 0.2, 0.14, 0.36], tall: [0.84, 0.15, 0.16, 0.27] },
];

/** Living details drawn over the art. */
export const fire = { wide: [0.48, 0.46, 0.13, 0.2] as Box, tall: [0.14, 0.47, 0.3, 0.14] as Box };
export const castleGlow = { wide: [0.55, 0.08, 0.11, 0.16] as Box, tall: [0.47, 0.12, 0.24, 0.12] as Box };
export const chestGlow = { wide: [0.51, 0.79, 0.18, 0.04] as Box, tall: [0.44, 0.73, 0.38, 0.04] as Box };
export const coinSparkle = { wide: [0.36, 0.73, 0.03, 0.03] as Box, tall: [0.55, 0.82, 0.03, 0.02] as Box };
