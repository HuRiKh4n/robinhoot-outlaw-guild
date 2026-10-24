import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import GuildIdentityPanel from "@/components/identity/GuildIdentityPanel";
import { identityConfig } from "@/lib/identity/server";
export const dynamic = "force-dynamic";
export const metadata = { title: "Guild Identity Foundation | RobinHoot" };
export default function GuildIdentityPage() {
  const enabled = Boolean(identityConfig());
  return (
    <main className="guild-identity-page">
      <SiteHeader />
      <section className="guild my-outlaw">
        <p className="eyebrow">PHASE 7A · SERVER IDENTITY FOUNDATION</p>
        <h1>GUILD IDENTITY</h1>
        <p>
          Optional off-chain wallet ownership verification. No seed phrase,
          private key, token transfer, access-key authorization or gas fee is
          required.
        </p>
        {enabled ? (
          <GuildIdentityPanel />
        ) : (
          <div className="prototype-notice">
            <strong>SERVER IDENTITY NOT CONFIGURED</strong>
            <p>
              Persistent registration is not operational on this deployment. A
              migrated PostgreSQL database, canonical HTTPS origin and trusted
              NEAR mainnet RPC are required before this flow can be enabled and
              tested.
            </p>
            <p>
              Your Character Creator, account-local drafts and downloads remain
              available. Nothing has been registered on-chain.
            </p>
          </div>
        )}
        <Link className="profile-inline-link" href="/my-outlaw">
          ← BACK TO MY OUTLAW
        </Link>
      </section>
    </main>
  );
}
