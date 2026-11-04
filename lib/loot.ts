import "server-only";

/** The guild's public wallets. Filled in on Vercel at launch (env), shown on /loot. */
export const lootWallets = [
  { key: 'LOOT_WALLET_TAX', name: 'The Tax Gate', use: 'The creator wallet on JustHoot. Holds the founder’s 5% bag. The 2% tax lands here and a bot sends it to the Guild Chest every hour, in public.' },
  { key: 'LOOT_WALLET_GUILD', name: 'The Guild Chest (contract)', use: 'Gets every coin of tax. A contract with no owner: it splits it, pays the weekly prizes and the Grand Prize by itself.' },
  { key: 'LOOT_WALLET_DEV', name: 'The Hideout', use: 'The founder’s wallet. Gets 20% of the tax (the site, the art, the tools) and the reserve, used to top up the prizes in lean weeks.' },
] as const;

export function walletAddress(key: string) {
  const value = process.env[key]?.trim();
  return value && /^[a-z0-9._-]{2,64}$/.test(value) ? value : null;
}
