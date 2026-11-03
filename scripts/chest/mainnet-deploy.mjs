// Mainnet deploy of the Guild Chest. Run once, by GitHub Actions.
// 1. creates drawer.<chest> (the draw bot, key derived from DRAWER_SEED) and funds it for gas
// 2. deploys the contract and calls new(dev, reserve, drawer, first Sunday)
// 3. deletes every access key of the chest: no owner, no upgrade, no withdraw, forever
// 4. writes public/chest.json for the site and the draw bot
// Env: CHEST_ACCOUNT, CHEST_PRIVATE_KEY, DRAWER_SEED, DEV_WALLET, RESERVE_WALLET, FIRST_DRAW (YYYY-MM-DD, a Sunday), DRY_RUN
// Usage: node mainnet-deploy.mjs <guild_chest.wasm> <out.json>
import { connect, keyStores, KeyPair, utils } from "near-api-js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const [wasm, outFile] = process.argv.slice(2);
const env = k => { const v = (process.env[k] || "").trim(); if (!v) throw new Error(`Missing ${k}`); return v; };
const CHEST = env("CHEST_ACCOUNT"), DEV = env("DEV_WALLET"), RESERVE = env("RESERVE_WALLET");
const FIRST = env("FIRST_DRAW"), DRY = process.env.DRY_RUN === "true";
const TGAS = 10n ** 12n;
const near = n => BigInt(utils.format.parseNearAmount(String(n)));

const start = Date.parse(`${FIRST}T20:00:00Z`);
if (!Number.isFinite(start) || new Date(start).getUTCDay() !== 0) throw new Error(`FIRST_DRAW ${FIRST} is not a Sunday`);
if (start < Date.now()) throw new Error("FIRST_DRAW is in the past");

const ownerKey = KeyPair.fromString(env("CHEST_PRIVATE_KEY"));
const seedKp = nacl.sign.keyPair.fromSeed(createHash("sha256").update("robinhoot-drawer:" + env("DRAWER_SEED")).digest());
const drawerKey = KeyPair.fromString("ed25519:" + bs58.encode(Buffer.from(seedKp.secretKey)));
const DRAWER = `drawer.${CHEST}`;

const keyStore = new keyStores.InMemoryKeyStore();
await keyStore.setKey("mainnet", CHEST, ownerKey);
await keyStore.setKey("mainnet", DRAWER, drawerKey);
const conn = await connect({ networkId: "mainnet", nodeUrl: process.env.RPC || "https://rpc.mainnet.fastnear.com", keyStore });
const chest = await conn.account(CHEST);

for (const id of [DEV, RESERVE]) {
  const ok = await conn.connection.provider.query({ request_type: "view_account", finality: "final", account_id: id }).then(() => true, () => false);
  if (!ok) throw new Error(`Wallet ${id} does not exist on mainnet`);
}
const bal = await chest.getAccountBalance();
console.log(`${CHEST}: ${utils.format.formatNearAmount(bal.available, 3)} NEAR available`);
const keys = await chest.getAccessKeys();
if (!keys.some(k => k.public_key === ownerKey.getPublicKey().toString())) throw new Error("CHEST_PRIVATE_KEY is not a key of " + CHEST);
console.log(`plan: drawer ${DRAWER} (key ${drawerKey.getPublicKey()}), dev ${DEV}, reserve ${RESERVE}, first draw ${new Date(start).toISOString()}`);
if (DRY) { console.log("DRY RUN: all checks passed, nothing sent."); process.exit(0); }

const exists = await conn.connection.provider.query({ request_type: "view_account", finality: "final", account_id: DRAWER }).then(() => true, () => false);
if (!exists) { await chest.createAccount(DRAWER, drawerKey.getPublicKey(), near(0.3)); console.log("drawer created with 0.3 NEAR for gas"); }

await chest.deployContract(await readFile(wasm));
console.log("contract deployed");
await chest.functionCall({ contractId: CHEST, methodName: "new", args: { dev_wallet: DEV, reserve_wallet: RESERVE, drawer: DRAWER, cycle_start_ms: start }, gas: 50n * TGAS });
console.log("chest", JSON.stringify(await chest.viewFunction({ contractId: CHEST, methodName: "get_chest" })));

for (const k of await chest.getAccessKeys()) {
  if (k.public_key !== ownerKey.getPublicKey().toString()) await chest.deleteKey(k.public_key);
}
await chest.deleteKey(ownerKey.getPublicKey());
console.log("All chest keys deleted:", JSON.stringify(await (await conn.account(CHEST)).getAccessKeys()));

await writeFile(outFile, JSON.stringify({ network: "mainnet", contract: CHEST, drawer: DRAWER, dev: DEV, reserve: RESERVE, cycleStart: new Date(start).toISOString(), deployedAt: new Date().toISOString() }, null, 2) + "\n");
console.log("Wrote", outFile);
