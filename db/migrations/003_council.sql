BEGIN;
-- The Guild Council: holders vote Tobias's weekly mission and changes to his prompt.
CREATE TABLE IF NOT EXISTS council_proposals (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('mission','prompt')),
  title text NOT NULL, body text NOT NULL,
  author_account text NOT NULL,
  opens_at timestamptz NOT NULL, closes_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','vetoed')),
  veto_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS council_proposals_closes ON council_proposals(closes_at);
CREATE TABLE IF NOT EXISTS council_votes (
  proposal_id uuid NOT NULL REFERENCES council_proposals(id),
  account text NOT NULL,
  choice text NOT NULL CHECK (choice IN ('for','against')),
  weight integer NOT NULL CHECK (weight BETWEEN 1 AND 15),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (proposal_id, account)
);
CREATE TABLE IF NOT EXISTS council_prompt_versions (
  version integer PRIMARY KEY,
  text text NOT NULL, sha256 char(64) NOT NULL,
  proposal_id uuid REFERENCES council_proposals(id),
  approved_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS council_log (
  id uuid PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  text text NOT NULL, link text
);
REVOKE ALL ON council_proposals,council_votes,council_prompt_versions,council_log FROM PUBLIC;
COMMIT;
