/** Interactive objects in the hideout illustration.
 *  Boxes are fractions of the image: [x, y, width, height]. `wide` is the 16:9 desktop art,
 *  `tall` the 9:16 phone art. Calibrated on public/hideout/hideout-{wide,tall}-*.webp. */
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
  { id: 'wanted', label: 'Forge your outlaw', hint: 'Pin your own WANTED poster', href: '/my-outlaw', wide: [0.01, 0.12, 0.27, 0.55], tall: [0.0, 0.06, 0.38, 0.25] },
  { id: 'book', label: 'The tale', hint: 'How the guild was born', href: '#tale', wide: [0.27, 0.62, 0.24, 0.17], tall: [0.03, 0.635, 0.5, 0.09] },
  { id: 'window', label: 'The Sheriff', hint: 'Who sits in the golden castle', href: '#sheriff', wide: [0.4, 0.15, 0.14, 0.26], tall: [0.44, 0.05, 0.23, 0.15] },
  { id: 'chest', label: 'The road ahead', hint: 'A chest we open together', href: '#road', wide: [0.56, 0.75, 0.14, 0.18], tall: [0.5, 0.76, 0.3, 0.14] },
  { id: 'bard', label: 'Tavern music', hint: 'Ask the bard to play', action: 'music', wide: [0.715, 0.46, 0.15, 0.38], tall: [0.75, 0.5, 0.23, 0.25] },
  { id: 'board', label: 'Bounty board', hint: 'Jobs for brave outlaws', href: '/bounties', wide: [0.865, 0.29, 0.135, 0.36], tall: [0.78, 0.15, 0.22, 0.2] },
];

/** Living details drawn over the art. */
export const fire = { wide: [0.58, 0.53, 0.12, 0.2] as Box, tall: [0.19, 0.53, 0.18, 0.13] as Box };
export const castleGlow = { wide: [0.42, 0.19, 0.1, 0.17] as Box, tall: [0.48, 0.08, 0.15, 0.1] as Box };
export const chestGlow = { wide: [0.565, 0.82, 0.13, 0.05] as Box, tall: [0.51, 0.81, 0.28, 0.04] as Box };
export const coinSparkle = { wide: [0.655, 0.03, 0.025, 0.04] as Box, tall: [0.48, 0.67, 0.03, 0.02] as Box };
