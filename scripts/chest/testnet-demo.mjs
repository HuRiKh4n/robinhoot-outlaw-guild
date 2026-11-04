// Testnet demo of the Guild Chest: deploy, pay a tax, run this Sunday's draw, lock the contract.
// Every account is fresh (testnet faucet) and every key is thrown away at the end.
// Usage: node scripts/chest/testnet-demo.mjs <guild_chest.wasm> <out.json>
// TOKEN=<testnet NEP-141 with faucet()> runs the chest in that token instead of NEAR (the PEARL setup).
import { connect, keyStores, KeyPair, utils } from "near-api-js";
import { readFile, writeFile } from "node:fs/promises";

const [wasm, outFile] = process.argv.slice(2);
const RPC = "https://test.rpc.fastnear.com";
const TGAS = 10n ** 12n;
const near = n => BigInt(utils.format.parseNearAmount(String(n)));
const wait = ms => new Promise(r => setTimeout(r, ms));
const stamp = Date.now().toString(36);
const TOKEN = (process.env.TOKEN || "").trim() || null;
const key = KeyPair.fromRandom("ed25519");
const keyStore = new keyStores.InMemoryKeyStore();
const ids = { chest: `guild-chest-${stamp}.testnet`, bot: `drawbot-${stamp}.testnet` };
for (const id of Object.values(ids)) await keyStore.setKey("testnet", id, key);
const conn = await connect({ networkId: "testnet", nodeUrl: RPC, keyStore });

async function faucet(accountId) {
  const r = await fetch("https://helper.nearprotocol.com/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newAccountId: accountId, newAccountPublicKey: key.getPublicKey().toString() }) });
  console.log("faucet", accountId, r.status);
  if (!r.ok) throw new Error("faucet failed");
  await wait(3000);
}
await faucet(ids.chest);
await faucet(ids.bot);
const bot = await conn.account(ids.bot);
const chest = await conn.account(ids.chest);

// Dev, reserve and 8 holders: sub-accounts of the bot (cheap, no faucet needed).
const sub = n => `${n}.${ids.bot}`;
const holders = ["robin", "marian", "littlejohn", "tuck", "will", "much", "alan", "wat"].map(sub);
for (const id of [sub("dev"), sub("reserve"), ...holders]) await bot.createAccount(id, key.getPublicKey(), near(0.05));

// The first draw of the cycle: the most recent Sunday 20:00 UTC (today's if it already passed).
const now = new Date();
let start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay(), 20);
if (start > Date.now()) start -= 7 * 864e5;

await chest.deployContract(await readFile(wasm));
await chest.functionCall({ contractId: ids.chest, methodName: "new", args: { dev_wallet: sub("dev"), reserve_wallet: sub("reserve"), drawer: ids.bot, cycle_start_ms: start, token: TOKEN }, gas: 50n * TGAS });

let tax, meta = null;
const tokBal = async id => BigInt(await bot.viewFunction({ contractId: TOKEN, methodName: "ft_balance_of", args: { account_id: id } }));
if (TOKEN) {
  meta = await bot.viewFunction({ contractId: TOKEN, methodName: "ft_metadata" });
  await bot.functionCall({ contractId: TOKEN, methodName: "storage_deposit", args: { account_id: ids.chest, registration_only: true }, gas: 30n * TGAS, attachedDeposit: near(0.0125) });
  await bot.functionCall({ contractId: TOKEN, methodName: "faucet", args: {}, gas: 30n * TGAS });
  const amount = (await tokBal(ids.bot)) / 2n;
  console.log(`A week of trading tax arrives: ${amount} raw ${meta.symbol}`);
  tax = await bot.functionCall({ contractId: TOKEN, methodName: "ft_transfer_call", args: { receiver_id: ids.chest, amount: amount.toString(), msg: "tax" }, gas: 100n * TGAS, attachedDeposit: 1n });
  console.log("tax tx", tax.transaction.hash, "chest balance", (await tokBal(ids.chest)).toString());
} else {
  console.log("A week of trading tax arrives: 5 NEAR");
  tax = await bot.functionCall({ contractId: ids.chest, methodName: "deposit_tax", args: {}, gas: 50n * TGAS, attachedDeposit: near(5) });
}
console.log("chest", JSON.stringify(await bot.viewFunction({ contractId: ids.chest, methodName: "get_chest" })));

console.log("Sunday: the bot submits the eligible holders, the contract rolls and pays");
const entries = holders.map((account, i) => ({ account, tickets: [10, 1, 3, 1, 6, 2, 1, 15][i] }));
const out = await bot.functionCall({ contractId: ids.chest, methodName: "draw", args: { index: 0, entries }, gas: 300n * TGAS });
const draw = JSON.parse(Buffer.from(out.status.SuccessValue, "base64").toString());
console.log("draw", JSON.stringify(draw));
await wait(3000);
for (const w of draw.winners) {
  if (TOKEN) { console.log(`  ${w.account} won ${w.amount} → token balance ${await tokBal(w.account)}`); if (await tokBal(w.account) !== BigInt(w.amount)) throw new Error("winner not paid"); continue; }
  const b = await (await conn.account(w.account)).getAccountBalance();
  console.log(`  ${w.account} won ${utils.format.formatNearAmount(w.amount, 3)} NEAR → balance ${utils.format.formatNearAmount(b.total, 3)}`);
}
if (TOKEN) {
  console.log(`  dev ${await tokBal(sub("dev"))}, reserve ${await tokBal(sub("reserve"))}, chest ${await tokBal(ids.chest)}`);
  const v = await bot.viewFunction({ contractId: ids.chest, methodName: "get_chest" });
  console.log("chest after", JSON.stringify(v));
  if ((await tokBal(sub("dev"))) === 0n) throw new Error("dev not paid");
}

await chest.deleteKey(key.getPublicKey());
console.log("Chest key deleted: no owner, no withdraw, forever.");
await writeFile(outFile, JSON.stringify({ network: "testnet", contract: ids.chest, token: TOKEN, symbol: meta?.symbol ?? "NEAR", decimals: meta?.decimals ?? 24, drawer: ids.bot, dev: sub("dev"), reserve: sub("reserve"), cycleStart: new Date(start).toISOString(), taxTx: tax.transaction.hash, drawTx: out.transaction.hash, deployedAt: new Date().toISOString() }, null, 2) + "\n");
console.log("Wrote", outFile);
