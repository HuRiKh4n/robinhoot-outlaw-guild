BEGIN;
CREATE TABLE guild_users (id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE near_accounts (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES guild_users(id),
  network text NOT NULL CHECK(network='mainnet'), account_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(network,account_id)
);
CREATE TABLE identity_challenges (
  id uuid PRIMARY KEY, account_id text NOT NULL, origin text NOT NULL, recipient text NOT NULL,
  nonce text NOT NULL UNIQUE, message text NOT NULL, binding_hash char(64) NOT NULL,
  expires_at timestamptz NOT NULL, consumed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX identity_challenges_expiry ON identity_challenges(expires_at);
CREATE TABLE identity_sessions (
  token_hash char(64) PRIMARY KEY, linked_account uuid NOT NULL REFERENCES near_accounts(id),
  public_key text NOT NULL, binding_hash char(64) NOT NULL, expires_at timestamptz NOT NULL,
  revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX identity_sessions_account ON identity_sessions(linked_account);
CREATE INDEX identity_sessions_binding ON identity_sessions(binding_hash);
CREATE INDEX identity_sessions_expiry ON identity_sessions(expires_at);
CREATE TABLE outlaw_characters (
  id uuid PRIMARY KEY, owner_account uuid NOT NULL UNIQUE REFERENCES near_accounts(id),
  draft jsonb NOT NULL CHECK(jsonb_typeof(draft)='object'), schema_version smallint NOT NULL DEFAULT 1 CHECK(schema_version=1), revision integer NOT NULL CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE character_revisions (
  character_id uuid NOT NULL REFERENCES outlaw_characters(id), revision integer NOT NULL CHECK(revision>0),
  draft jsonb NOT NULL CHECK(jsonb_typeof(draft)='object'), schema_version smallint NOT NULL DEFAULT 1 CHECK(schema_version=1), created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(character_id,revision)
);
CREATE TABLE identity_rate_limits (bucket char(64) PRIMARY KEY, hits integer NOT NULL, expires_at timestamptz NOT NULL);
REVOKE ALL ON guild_users,near_accounts,identity_challenges,identity_sessions,outlaw_characters,character_revisions,identity_rate_limits FROM PUBLIC;
COMMIT;
