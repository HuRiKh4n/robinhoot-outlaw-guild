/** Outlaw ranks: bonus tickets for Guild members, on top of the tickets from their balance.
 *  Only counted when the wallet already qualifies for the draw ($50 held for the 72 h / 120 h window).
 *  Rank = days held above the $50 line in a row, checked once a day at 20:00 UTC on-chain.
 *  Selling below the line resets the streak (back to Trench Rat). Keep in sync with scripts/draw.mjs. */
export const RANKS = [
  { id: 'trench-rat', icon: '🐀', name: 'Trench Rat', days: 0, bonus: 1, how: 'Join the Guild with your outlaw' },
  { id: 'outlaw', icon: '🏹', name: 'Outlaw', days: 14, bonus: 2, how: 'Hold 2 weeks in a row' },
  { id: 'captain', icon: '⚔️', name: 'Captain', days: 30, bonus: 3, how: 'Hold 1 month in a row' },
  { id: 'legend', icon: '👑', name: 'Legend', days: 90, bonus: 5, how: 'Hold 3 months in a row' },
] as const;
export type Rank = typeof RANKS[number];
export const rankFor = (streakDays: number): Rank => [...RANKS].reverse().find(rank => streakDays >= rank.days) ?? RANKS[0];
export const STREAK_MAX_DAYS = 90;
