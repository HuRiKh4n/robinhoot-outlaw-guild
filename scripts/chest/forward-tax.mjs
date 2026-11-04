// Every hour: send the trading tax that reached the tax wallet (the JustHoot creator, robinh00d.near) to the Guild Chest.
// The chest splits it on arrival: 20% dev, then 30% weekly / 50% Grand Prize / 20% reserve.
// The tax wallet must NOT be the dev wallet, or the dev's 20% would be forwarded again every hour.
// Env: TAX_WALLET, TAX_WALLET_KEY (ed25519:… full-access key), MIN_FORWARD (whole coins, default 1),
//      KEEP (whole coins left in the wallet, default 0), KEEP_NEAR (NEAR left for gas, default 1)
import { connect, keyStores, KeyPair, utils } from "near-api-js";
import { readFile } from "node:fs/promises";

const cfg = await readFile(process.argv[2] || "public/chest.json", "utf8").then(JSON.parse).catch(() => null);
const WALLET = (process.env.TAX_WALLET || "").trim(), KEY = (process.env.TAX_WALLET_KEY || "").trim();
if (!cfg?.contract || cfg.network !== "mainnet") { console.log("No mainnet chest yet: nothing to do."); process.exit(0); }
if (!WALLET || !KEY) { console.log("TAX_WALLET / TAX_WALLET_KEY not set: nothing to do."); process.exit(0); }
if (WALLET === cfg.dev) throw new Error("The tax wallet is the dev wallet: forwarding would loop the dev share. Use another dev wallet.");

const keyStore = new keyStores.InMemoryKeyStore();
await keyStore.setKey("mainnet", WALLET, KeyPair.fromString(KEY));
const near = await connect({ networkId: "mainnet", nodeUrl: process.env.RPC || "https://rpc.mainnet.fastnear.com", keyStore });
const account = await near.account(WALLET);
const TGAS = 10n ** 12n;
const whole = (n, dec) => BigInt(Math.round(Number(n) * 1e6)) * 10n ** BigInt(dec) / 1_000_000n;

if (cfg.token) {
  const dec = cfg.decimals ?? 24;
  const bal = BigInt(await account.viewFunction({ contractId: cfg.token, methodName: "ft_balance_of", args: { account_id: WALLET } }));
  const send = bal - whole(process.env.KEEP || 0, dec);
  console.log(`${WALLET} holds ${bal} raw ${cfg.symbol}; forwarding ${send > 0n ? send : 0n}`);
  if (send < whole(process.env.MIN_FORWARD || 1, dec)) { console.log("Below the minimum: wait for the next hour."); process.exit(0); }
  const out = await account.functionCall({ contractId: cfg.token, methodName: "ft_transfer_call", args: { receiver_id: cfg.contract, amount: send.toString(), msg: "tax" }, gas: 100n * TGAS, attachedDeposit: 1n });
  console.log("Forwarded to the chest, tx", out.transaction.hash);
} else {
  const { available } = await account.getAccountBalance();
  const send = BigInt(available) - BigInt(utils.format.parseNearAmount(process.env.KEEP_NEAR || "1"));
  console.log(`${WALLET} has ${utils.format.formatNearAmount(available, 3)} NEAR available`);
  if (send < BigInt(utils.format.parseNearAmount(process.env.MIN_FORWARD || "1"))) { console.log("Below the minimum: wait for the next hour."); process.exit(0); }
  const out = await account.functionCall({ contractId: cfg.contract, methodName: "deposit_tax", args: {}, gas: 50n * TGAS, attachedDeposit: send });
  console.log("Forwarded to the chest, tx", out.transaction.hash);
}
