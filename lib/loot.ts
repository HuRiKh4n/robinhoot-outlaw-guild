import "server-only";

/** The guild's public wallets. Filled in on Vercel at launch (env), shown on /loot. */
export const lootWallets = [
  { key: 'LOOT_WALLET_GUILD', name: 'The Guild Chest', use: '80% of the Sheriff’s tax. Pays the Bounty of the Week and the monthly Assault on the Castle.' },
  { key: 'LOOT_WALLET_DEV', name: 'The Hideout', use: '20% of the Sheriff’s tax. Pays for the site, the art, the videos and the tools.' },
  { key: 'LOOT_WALLET_MARKETING', name: 'The Herald', use: '3% of the supply. Prizes, airdrops to early outlaws and partnerships.' },
  { key: 'LOOT_WALLET_TEAM', name: 'The Founder', use: '2% of the supply. No sales for 3 months, then small amounts, always announced first.' },
] as const;

export function walletAddress(key: string) {
  const value = process.env[key]?.trim();
  return value && /^[a-z0-9._-]{2,64}$/.test(value) ? value : null;
}
