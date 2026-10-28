BEGIN;
CREATE TABLE IF NOT EXISTS bounty_submissions (
  id uuid PRIMARY KEY, owner_account uuid NOT NULL REFERENCES near_accounts(id),
  bounty_id text NOT NULL, evidence_url text NOT NULL, description text NOT NULL,
  status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_account,bounty_id)
);
-- One painted portrait per outlaw (the latest one), plus a daily painting counter to cap AI costs.
CREATE TABLE IF NOT EXISTS outlaw_portraits (
  owner_account uuid PRIMARY KEY REFERENCES near_accounts(id),
  image bytea NOT NULL, content_type text NOT NULL, draft_hash char(64) NOT NULL,
  paints_today integer NOT NULL DEFAULT 1, painted_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON bounty_submissions,outlaw_portraits FROM PUBLIC;
COMMIT;
