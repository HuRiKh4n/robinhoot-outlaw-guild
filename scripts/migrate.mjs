// Applies db/migrations/*.sql once each, in order, at build time (Vercel runs `prebuild`).
// Skips quietly when no database is connected, so the site still builds without one.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) { console.log('migrate: no database connected, skipping'); process.exit(0); }
let pg;
try { pg = (await import('pg')).default; } catch { console.log('migrate: pg not installed, skipping'); process.exit(0); }
const clean = new URL(url);
for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'ssl', 'channel_binding']) clean.searchParams.delete(key);
const client = new pg.Client({ connectionString: clean.toString(), ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 10000 });
try {
  await client.connect();
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  await client.query('REVOKE ALL ON schema_migrations FROM PUBLIC');
  const dir = path.join(process.cwd(), 'db/migrations');
  const done = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map(row => row.name));
  for (const file of (await readdir(dir)).filter(name => name.endsWith('.sql')).sort()) {
    if (done.has(file)) continue;
    // 001 predates this runner: if its tables already exist, just record it.
    if (file.startsWith('001')) {
      const exists = await client.query("SELECT to_regclass('public.guild_users') AS t");
      if (exists.rows[0].t) { await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [file]); console.log(`migrate: ${file} already present`); continue; }
    }
    await client.query(await readFile(path.join(dir, file), 'utf8'));
    await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [file]);
    console.log(`migrate: applied ${file}`);
  }
  console.log('migrate: database up to date');
} catch (error) {
  // Never block a deploy: the site works without the Guild database, and the next build retries.
  console.warn(`migrate: FAILED (${error.message}). The Guild features stay off until this succeeds.`);
} finally {
  await client.end().catch(() => {});
}
