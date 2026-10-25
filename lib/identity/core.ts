import "server-only";
import {
  createHash,
  createPublicKey,
  randomBytes,
  randomUUID,
  verify,
} from "node:crypto";
import bs58 from "bs58";
import { parseDraft, type OutlawDraft } from "../profile/draft";

export interface Sql {
  query(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: Record<string, unknown>[] }>;
}
export interface Database extends Sql {
  transaction<T>(run: (sql: Sql) => Promise<T>): Promise<T>;
}
export class IdentityError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const token = () => randomBytes(32).toString("base64url");
export const SESSION_SECONDS = 12 * 60 * 60;
export function accountId(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length < 2 ||
    value.length > 64 ||
    !/^([a-z0-9]+[-_.])*[a-z0-9]+$/.test(value)
  )
    throw new IdentityError(400, "Invalid account.");
  return value;
}
export function characterDraft(value: unknown): OutlawDraft {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new IdentityError(400, "Invalid character.");
  const source = value as Record<string, unknown>,
    parsed = parseDraft(JSON.stringify(value));
  if (
    Object.keys(source).sort().join() !==
      "class,name,outfit,personality,species" ||
    !parsed.name.trim() ||
    Object.entries(parsed).some(([key, v]) => source[key] !== v)
  )
    throw new IdentityError(400, "Invalid character.");
  return parsed;
}
function stringBytes(value: string) {
  const bytes = Buffer.from(value, "utf8"),
    size = Buffer.alloc(4);
  size.writeUInt32LE(bytes.length);
  return Buffer.concat([size, bytes]);
}
/** NEP-413: Borsh u32(2^31+413), string, [u8;32], string, Option<string>(None), SHA-256. */
export function nep413Digest(
  message: string,
  nonce: Uint8Array,
  recipient: string,
): Buffer {
  if (nonce.length !== 32) throw new IdentityError(400, "Invalid nonce.");
  const tag = Buffer.alloc(4);
  tag.writeUInt32LE(2147484061);
  return createHash("sha256")
    .update(
      Buffer.concat([
        tag,
        stringBytes(message),
        Buffer.from(nonce),
        stringBytes(recipient),
        Buffer.from([0]),
      ]),
    )
    .digest();
}
export interface Proof {
  accountId: string;
  publicKey: string;
  signature: string;
}
export function validSignature(
  message: string,
  nonce: string,
  recipient: string,
  proof: Proof,
): boolean {
  try {
    if (
      !proof.publicKey.startsWith("ed25519:") ||
      proof.publicKey.length > 64 ||
      proof.signature.length !== 88
    )
      return false;
    const key = bs58.decode(proof.publicKey.slice(8)),
      signature = Buffer.from(proof.signature, "base64");
    if (
      key.length !== 32 ||
      signature.length !== 64 ||
      signature.toString("base64") !== proof.signature
    )
      return false;
    const der = Buffer.concat([
      Buffer.from("302a300506032b6570032100", "hex"),
      key,
    ]);
    return verify(
      null,
      nep413Digest(message, Buffer.from(nonce, "base64"), recipient),
      createPublicKey({ key: der, format: "der", type: "spki" }),
      signature,
    );
  } catch {
    return false;
  }
}
interface Challenge {
  id: string;
  account_id: string;
  origin: string;
  recipient: string;
  nonce: string;
  message: string;
  binding_hash: string;
  expires_at: Date;
  consumed_at: Date | null;
}
interface Session {
  linked_account: string;
  account_id: string;
  public_key: string;
}
export type AuthorizeKey = (
  account: string,
  publicKey: string,
) => Promise<boolean>;
export class GuildIdentity {
  constructor(
    private db: Database,
    private origin: string,
    private authorizeKey: AuthorizeKey,
  ) {}
  async issue(account: unknown, binding: string) {
    const id = accountId(account),
      challengeId = randomUUID(),
      nonce = randomBytes(32).toString("base64");
    const expires = new Date(Date.now() + 180000),
      recipient = new URL(this.origin).host;
    const message = `Sign in to RobinHoot Guild Identity\nOrigin: ${this.origin}\nNEAR mainnet account: ${id}\nChallenge: ${challengeId}\nExpires: ${expires.toISOString()}\nNo transaction, token transfer or on-chain registration.`;
    await this.db.transaction(async (sql) => {
      for (const [bucket, limit] of [
        [`global`, 300],
        [`account:${id}`, 12],
        [`browser:${binding}`, 12],
      ] as const) {
        const result = await sql.query(
          `INSERT INTO identity_rate_limits(bucket,hits,expires_at) VALUES($1,1,now()+interval '10 minutes') ON CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN identity_rate_limits.expires_at<=now() THEN 1 ELSE identity_rate_limits.hits+1 END, expires_at=CASE WHEN identity_rate_limits.expires_at<=now() THEN now()+interval '10 minutes' ELSE identity_rate_limits.expires_at END RETURNING hits`,
          [hash(bucket)],
        );
        if (Number(result.rows[0].hits) > limit)
          throw new IdentityError(429, "Try again later.");
      }
      await sql.query(
        "INSERT INTO identity_challenges(id,account_id,origin,recipient,nonce,message,binding_hash,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          challengeId,
          id,
          this.origin,
          recipient,
          nonce,
          message,
          hash(binding),
          expires,
        ],
      );
    });
    return {
      id: challengeId,
      accountId: id,
      network: "mainnet",
      message,
      nonce,
      recipient,
      expiresAt: expires.toISOString(),
    };
  }
  async complete(id: string, binding: string, proof: Proof) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        id,
      ) ||
      !proof ||
      typeof proof.publicKey !== "string" ||
      typeof proof.signature !== "string"
    )
      throw new IdentityError(401, "Invalid proof.");
    const result = await this.db.query(
      "SELECT * FROM identity_challenges WHERE id=$1",
      [id],
    );
    const challenge = result.rows[0] as unknown as Challenge | undefined;
    if (
      !challenge ||
      challenge.consumed_at ||
      new Date(challenge.expires_at).getTime() <= Date.now() ||
      challenge.origin !== this.origin ||
      challenge.binding_hash !== hash(binding) ||
      challenge.account_id !== proof.accountId
    )
      throw new IdentityError(401, "Invalid or expired challenge.");
    if (
      !validSignature(
        challenge.message,
        challenge.nonce,
        challenge.recipient,
        proof,
      )
    )
      throw new IdentityError(401, "Invalid signature.");
    // Burn a cryptographically valid challenge atomically before any RPC or account creation.
    const consumed = await this.db.query(
      "UPDATE identity_challenges SET consumed_at=now() WHERE id=$1 AND consumed_at IS NULL AND expires_at>now() RETURNING id",
      [id],
    );
    if (consumed.rows.length !== 1)
      throw new IdentityError(401, "Invalid or expired challenge.");
    if (!(await this.authorizeKey(proof.accountId, proof.publicKey)))
      throw new IdentityError(401, "Key is not authorized.");
    const sessionToken = token();
    await this.db.transaction(async (sql) => {
      const user = randomUUID();
      await sql.query("INSERT INTO guild_users(id) VALUES($1)", [user]);
      const account = await sql.query(
        `INSERT INTO near_accounts(id,user_id,network,account_id) VALUES($1,$2,'mainnet',$3) ON CONFLICT(network,account_id) DO UPDATE SET account_id=EXCLUDED.account_id RETURNING id,user_id`,
        [randomUUID(), user, proof.accountId],
      );
      if (account.rows[0].user_id !== user)
        await sql.query("DELETE FROM guild_users WHERE id=$1", [user]);
      await sql.query(
        "UPDATE identity_sessions SET revoked_at=now() WHERE binding_hash=$1 AND revoked_at IS NULL",
        [hash(binding)],
      );
      await sql.query(
        `INSERT INTO identity_sessions(token_hash,linked_account,public_key,binding_hash,expires_at) VALUES($1,$2,$3,$4,now()+interval '12 hours')`,
        [
          hash(sessionToken),
          account.rows[0].id,
          proof.publicKey,
          hash(binding),
        ],
      );
    });
    return sessionToken;
  }
  async session(
    sessionToken: string,
    expectedAccount: string,
  ): Promise<Session> {
    accountId(expectedAccount);
    if (!/^[\w-]{43}$/.test(sessionToken))
      throw new IdentityError(401, "Sign in required.");
    const result = await this.db.query(
      `SELECT s.linked_account,s.public_key,a.account_id FROM identity_sessions s JOIN near_accounts a ON a.id=s.linked_account WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now()`,
      [hash(sessionToken)],
    );
    const session = result.rows[0] as unknown as Session | undefined;
    if (!session) throw new IdentityError(401, "Sign in required.");
    if (session.account_id !== expectedAccount)
      throw new IdentityError(403, "Sign in again for the selected account.");
    if (!(await this.authorizeKey(session.account_id, session.public_key))) {
      await this.logout(sessionToken);
      throw new IdentityError(
        401,
        "Wallet key authorization changed. Sign in again.",
      );
    }
    const stillValid = await this.db.query(
      "SELECT token_hash FROM identity_sessions WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now()",
      [hash(sessionToken)],
    );
    if (!stillValid.rows.length)
      throw new IdentityError(401, "Sign in required.");
    return session;
  }
  async logout(sessionToken: string) {
    await this.db.query(
      "UPDATE identity_sessions SET revoked_at=now() WHERE token_hash=$1",
      [hash(sessionToken)],
    );
  }
  async read(sessionToken: string, expectedAccount: string) {
    const session = await this.session(sessionToken, expectedAccount);
    const result = await this.db.query(
      "SELECT draft,revision,updated_at FROM outlaw_characters WHERE owner_account=$1",
      [session.linked_account],
    );
    const member = await this.db.query("SELECT user_id FROM near_accounts WHERE id=$1 AND network='mainnet'", [session.linked_account]);
    return { accountId: session.account_id, guildId: member.rows[0]?.user_id ?? null, character: result.rows[0] ?? null };
  }
  async submitBounty(sessionToken: string, expectedAccount: string, bountyId: unknown, evidenceUrl: unknown, description: unknown) {
    if (typeof bountyId !== "string" || !/^RH-[CSG]0[12]$/.test(bountyId))
      throw new IdentityError(400, "Unknown contract.");
    if (typeof evidenceUrl !== "string" || evidenceUrl.length > 1000 || evidenceUrl.length < 12)
      throw new IdentityError(400, "Provide a public evidence URL.");
    let url: URL;
    try { url = new URL(evidenceUrl); } catch { throw new IdentityError(400, "Invalid evidence URL."); }
    if (url.protocol !== "https:" || url.username || url.password || url.hostname === "localhost" || !url.hostname.includes("."))
      throw new IdentityError(400, "Use a public HTTPS evidence link.");
    if (typeof description !== "string" || description.trim().length < 20 || description.length > 1500)
      throw new IdentityError(400, "Add a description between 20 and 1500 characters.");
    const session = await this.session(sessionToken, expectedAccount);
    try {
      const result = await this.db.query(
        "INSERT INTO bounty_submissions(id,owner_account,bounty_id,evidence_url,description) VALUES($1,$2,$3,$4,$5) RETURNING id,status,created_at",
        [randomUUID(),session.linked_account,bountyId,url.toString(),description.trim()],
      );
      return result.rows[0];
    } catch(error) {
      if ((error as {code?: string}).code === "23505")
        throw new IdentityError(409,"You already submitted this contract. It is awaiting review.");
      throw error;
    }
  }
  async bountyStatus(sessionToken: string, expectedAccount: string) {
    const session = await this.session(sessionToken, expectedAccount);
    const result = await this.db.query(
      "SELECT bounty_id,status,created_at FROM bounty_submissions WHERE owner_account=$1 ORDER BY created_at DESC LIMIT 20",
      [session.linked_account],
    );
    return { submissions: result.rows };
  }
  async save(
    sessionToken: string,
    expectedAccount: string,
    draft: unknown,
    revision: unknown,
    confirmed: unknown,
  ) {
    const next = characterDraft(draft);
    if (
      confirmed !== true ||
      !Number.isSafeInteger(revision) ||
      Number(revision) < 0 ||
      Number(revision) > 2147483646
    )
      throw new IdentityError(
        400,
        "Review and confirm the character revision.",
      );
    const session = await this.session(sessionToken, expectedAccount);
    try {
      return await this.db.transaction(async (sql) => {
        // Lock the session as well: logout/rotation and a write cannot race past revocation.
        const valid = await sql.query(
          "SELECT token_hash FROM identity_sessions WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now() FOR UPDATE",
          [hash(sessionToken)],
        );
        if (!valid.rows.length)
          throw new IdentityError(401, "Sign in required.");
        const current = await sql.query(
          "SELECT id,revision FROM outlaw_characters WHERE owner_account=$1 FOR UPDATE",
          [session.linked_account],
        );
        const row = current.rows[0];
        if (Number(row?.revision ?? 0) !== revision)
          throw new IdentityError(
            409,
            "Character changed. Reload and review before replacing it.",
          );
        const id = row?.id ?? randomUUID(),
          version = Number(revision) + 1;
        if (row)
          await sql.query(
            "UPDATE outlaw_characters SET draft=$1,revision=$2,updated_at=now() WHERE id=$3",
            [JSON.stringify(next), version, id],
          );
        else
          await sql.query(
            "INSERT INTO outlaw_characters(id,owner_account,draft,revision) VALUES($1,$2,$3,1)",
            [id, session.linked_account, JSON.stringify(next)],
          );
        await sql.query(
          "INSERT INTO character_revisions(character_id,revision,draft) VALUES($1,$2,$3)",
          [id, version, JSON.stringify(next)],
        );
        return { revision: version };
      });
    } catch (error) {
      if ((error as { code?: string }).code === "23505")
        throw new IdentityError(409, "Character changed. Reload and review.");
      throw error;
    }
  }
}
