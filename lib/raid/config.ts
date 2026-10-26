import "server-only";

/** Weekly Raid settings. Everything is optional until $RHOOT launches. */
export function raidConfig() {
  const token = process.env.RHOOT_TOKEN_CONTRACT?.trim() || null;
  const minUsd = Number(process.env.RAID_MIN_USD ?? 50);
  const manualTokens = process.env.RAID_HOLD_TOKENS?.trim() || null; // whole tokens, overrides the USD rule
  const rpc = process.env.NEAR_ARCHIVAL_RPC_URL?.trim() || "https://archival-rpc.mainnet.fastnear.com";
  const excluded = new Set((process.env.RAID_EXCLUDED_ACCOUNTS ?? "").split(",").map(item => item.trim()).filter(Boolean));
  if (token) excluded.add(token);
  return {
    token,
    minUsd: Number.isFinite(minUsd) && minUsd > 0 ? minUsd : 50,
    manualTokens: manualTokens && /^\d+$/.test(manualTokens) ? manualTokens : null,
    rpc,
    excluded,
    fixedEveryHours: 6,
    randomChecks: 6,
  };
}

export const ACCOUNT_ID = /^(?=.{2,64}$)(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
