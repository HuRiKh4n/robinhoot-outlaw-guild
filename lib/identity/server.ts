import "server-only";
import { Pool } from "pg";
import { mainnetKeyAuthorizer } from "./rpc";
import { GuildIdentity, IdentityError, type Database, type Sql } from "./core";

export function identityConfig() {
  // On as soon as a database is connected (Vercel > Storage), unless explicitly switched off.
  if (process.env.GUILD_IDENTITY_ENABLED === "false") return null;
  const origin = process.env.GUILD_AUTH_ORIGIN ?? "https://www.robinhoot.fun",
    database = process.env.DATABASE_URL ?? process.env.POSTGRES_URL,
    rpc = process.env.NEAR_MAINNET_RPC_URL ?? "https://rpc.mainnet.fastnear.com";
  if (!origin || !database || !rpc) return null;
  try {
    const site = new URL(origin),
      endpoint = new URL(rpc),
      db = new URL(database);
    if (
      site.protocol !== "https:" ||
      site.origin !== origin ||
      site.username ||
      site.password ||
      endpoint.protocol !== "https:" ||
      endpoint.username ||
      endpoint.password ||
      !["postgres:", "postgresql:"].includes(db.protocol)
    )
      return null;
  } catch {
    return null;
  }
  return { origin, database, rpc };
}
let service: GuildIdentity | undefined;
let shared: Database | undefined;
/** The Guild database (same pool as the identity service), for other Guild features like the Council. */
export function guildDatabase(): Database {
  identityService();
  return shared!;
}
export function identityService() {
  const config = identityConfig();
  if (!config)
    throw new IdentityError(
      503,
      "Guild identity is not configured. Local drafts remain available.",
    );
  if (service) return service;
  // Do not let URI options silently replace certificate verification.
  const url = new URL(config.database);
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert", "ssl", "channel_binding"])
    url.searchParams.delete(key);
  const pool = new Pool({
    connectionString: url.toString(),
    ssl: {
      rejectUnauthorized: true,
      ...(process.env.GUILD_DATABASE_CA
        ? { ca: process.env.GUILD_DATABASE_CA }
        : {}),
    },
    max: 3,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    statement_timeout: 5000,
  });
  pool.on("error", () => {
    /* No credentials, proofs or account data are logged. Requests fail closed. */
  });
  const database: Database = {
    query: (text, values) => pool.query(text, values),
    async transaction<T>(run: (sql: Sql) => Promise<T>) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await run(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
  shared = database;
  service = new GuildIdentity(
    database,
    config.origin,
    mainnetKeyAuthorizer(config.rpc),
  );
  return service;
}
