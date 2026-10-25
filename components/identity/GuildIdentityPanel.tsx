"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { resolveAppearance } from "@/lib/character/appearance";
import { waitForGuildLogout, revokeGuildSession } from "./logout";
import { useWalletState } from "@/hooks/useWalletState";
import { draftKey, parseDraft, type OutlawDraft } from "@/lib/profile/draft";
interface Saved {
  draft: OutlawDraft;
  revision: number;
}
export default function GuildIdentityPanel() {
  const { account } = useWalletState();
  const active = useRef(account?.accountId);
  active.current = account?.accountId;
  useEffect(() => {
    active.current = account?.accountId;
    return () => {
      active.current = undefined;
    };
  }, [account?.accountId]);
  // Reset the editor immediately, while a shared ref also cancels old async requests.
  return (
    <IdentityEditor
      key={account?.accountId ?? "disconnected"}
      active={active}
    />
  );
}
function IdentityEditor({ active }: { active: RefObject<string | undefined> }) {
  const { account, connection } = useWalletState();
  const [verified, setVerified] = useState(false),
    [saved, setSaved] = useState<Saved | null>(null),
    [guildId, setGuildId] = useState<string | null>(null),
    [candidate, setCandidate] = useState<OutlawDraft>(),
    [confirmed, setConfirmed] = useState(false),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const id = account?.accountId;
    let current = true;
    setVerified(false);
    setSaved(null);
    setGuildId(null);
    setCandidate(undefined);
    setConfirmed(false);
    setStatus("");
    if (id)
      void fetch("/api/guild/character", {
        headers: { "X-Guild-Account": id },
        cache: "no-store",
      })
        .then(async (response) => {
          if (!response.ok) return;
          const data = await response.json();
          if (current) {
            setVerified(true);
            setSaved(data.character);
            setGuildId(typeof data.guildId === "string" ? data.guildId : null);
          }
        })
        .catch(() => {
          if (current)
            setStatus(
              "Server identity unavailable. Your local draft is unaffected.",
            );
        });
    return () => {
      current = false;
    };
  }, [account?.accountId]);
  async function request(path: string, method: string, data?: unknown) {
    const id = active.current;
    if (!id) throw new Error("Connect a wallet first.");
    const response = await fetch(`/api/guild/${path}`, {
      method,
      headers: { "Content-Type": "application/json", "X-Guild-Account": id },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    const value = await response.json();
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        setVerified(false);
        setSaved(null);
        setCandidate(undefined);
        setConfirmed(false);
      }
      throw new Error(value.error ?? "Identity request failed.");
    }
    if (active.current !== id) {
      await revokeGuildSession();
      throw new Error("Account changed. Verify the selected account again.");
    }
    return value;
  }
  async function authenticate() {
    if (!connection || !account || busy) return;
    setBusy(true);
    setStatus(
      "Review the off-chain sign-in message in your wallet. No transaction or gas fee is required.",
    );
    try {
      await waitForGuildLogout();
      const challenge = await request("challenge", "POST", {
        accountId: account.accountId,
      });
      const proof = await connection.signIdentityChallenge(challenge);
      await request("verify", "POST", { id: challenge.id, ...proof });
      const current = await request("character", "GET");
      setVerified(true);
      setSaved(current.character);
      setGuildId(typeof current.guildId === "string" ? current.guildId : null);
      setStatus(
        "Wallet ownership verified for this server session. Not an on-chain registration.",
      );
    } catch (error) {
      setVerified(false);
      setStatus(
        error instanceof Error
          ? error.message
          : "Verification was not completed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      await revokeGuildSession();
      setVerified(false);
      setSaved(null);
      setGuildId(null);
      setCandidate(undefined);
      setConfirmed(false);
      setStatus(
        "Server session signed out. Wallet connection and local drafts remain unchanged.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Server sign-out was not confirmed.",
      );
    } finally {
      setBusy(false);
    }
  }
  function reviewLocal() {
    try {
      const raw = localStorage.getItem(draftKey(account?.accountId));
      if (!raw) {
        setStatus(
          "No account-local draft exists. Save your character in My Outlaw first.",
        );
        return;
      }
      setCandidate(parseDraft(raw));
      setConfirmed(false);
      setStatus(
        "Review the local character below. Nothing has been imported yet.",
      );
    } catch {
      setStatus("Browser storage is unavailable. Nothing was imported.");
    }
  }
  async function save() {
    if (!candidate || !confirmed || busy) return;
    setBusy(true);
    try {
      const result = await request("character", "PUT", {
        draft: candidate,
        expectedRevision: saved?.revision ?? 0,
        confirmed: true,
      });
      setSaved({ draft: candidate, revision: result.revision });
      setCandidate(undefined);
      setConfirmed(false);
      setStatus(
        "Character saved on the configured server. Browser-local draft was not changed. Not registered on-chain.",
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  const portrait = saved ? resolveAppearance(saved.draft) : null;
  const sameDraft = Boolean(saved && candidate && JSON.stringify(saved.draft) === JSON.stringify(candidate));
  return (
    <div className="prototype-notice" style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <p className="identity-mode" style={{ margin: 0 }}>
          {verified ? "✓ WALLET VERIFIED" : "WALLET VERIFICATION"}
        </p>
        <p style={{ margin: 0, overflowWrap: "anywhere" }}>
          {account?.accountId ?? "Connect your NEAR wallet to begin"}
        </p>
        <p style={{ margin: 0, opacity: 0.8, fontSize: "0.95rem" }}>
          {verified
            ? "Your secure Guild session is active."
            : "Connect and verify your wallet with a free off-chain signature."}
        </p>
        {!verified && (
          <button className="button" disabled={!account || !connection || busy} onClick={() => void authenticate()}>
            {busy ? "VERIFYING…" : "VERIFY MY WALLET"}
          </button>
        )}
      </div>
      {verified && (
        <section style={{ display: "grid", gap: 16 }}>
          <div style={{ borderTop: "1px solid rgba(230,208,168,.25)", paddingTop: 18 }}>
            {guildId && <p style={{ fontSize: "0.8rem", opacity: 0.75, overflowWrap: "anywhere" }}>GUILD MEMBER ID · {guildId}</p>}
            <p className="eyebrow" style={{ marginBottom: 6 }}>YOUR GUILD PASSPORT</p>
            <h2 style={{ margin: "0 0 12px" }}>{saved ? saved.draft.name.trim() : "Create your outlaw"}</h2>
            {saved ? (
              <>
                <div style={{ border: "1px solid rgba(230,208,168,.3)", borderRadius: 12, overflow: "hidden", background: "#12140f", marginBottom: 16 }}>
                  {portrait?.kind === "cinematic" && portrait.src ? (
                    <Image src={portrait.src} alt={portrait.alt} width={portrait.width} height={portrait.height} priority style={{ display: "block", width: "100%", height: "auto", maxHeight: 520, objectFit: "contain" }} />
                  ) : (
                    <div style={{ padding: "60px 20px", textAlign: "center", color: "#e6d0a8" }}>
                      <p style={{ fontSize: "2rem", margin: "0 0 8px" }}>✦</p>
                      <p style={{ margin: 0 }}>Cinematic portrait not yet available for this outfit.</p>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {[saved.draft.species, saved.draft.class, saved.draft.outfit, saved.draft.personality].map((item, index) => (
                    <span key={index} style={{ border: "1px solid rgba(230,208,168,.35)", padding: "6px 10px", borderRadius: 6, fontSize: "0.9rem" }}>{item}</span>
                  ))}
                </div>
                <p style={{ margin: 0 }}>✓ Saved to your Guild account</p>
                <p style={{ margin: "8px 0 0" }}><Link className="profile-inline-link" href="/my-outlaw">EDIT CHARACTER IN STUDIO →</Link></p>
                <p style={{ margin: "4px 0 0", opacity: 0.65, fontSize: "0.85rem" }}>Profile revision {saved.revision} · Off-chain</p>
              </>
            ) : (
              <p>No Guild character saved yet. Create one in My Outlaw, then save it here.</p>
            )}
          </div>
          <div style={{ display: "grid", gap: 6, borderTop: "1px solid rgba(230,208,168,.25)", paddingTop: 16 }}>
            <p className="eyebrow" style={{ margin: 0 }}>REPUTATION · COMING SOON</p>
            <p style={{ margin: 0 }}>Guild Reputation Points (RP) are not yet earnable. No points or $RHOOT rewards are active.</p>
            <Link className="profile-inline-link" href="/bounties">EXPLORE THE BOUNTY BOARD →</Link>
          </div>
          {!candidate ? (
            <button className="button" disabled={busy} onClick={reviewLocal}>
              {saved ? "REVIEW CHARACTER CHANGES" : "SAVE MY CHARACTER TO GUILD"}
            </button>
          ) : (
            <div style={{ border: "1px solid rgba(230,208,168,.35)", borderRadius: 8, padding: 16, display: "grid", gap: 12 }}>
              <h3 style={{ margin: 0 }}>Review before saving</h3>
              <p style={{ margin: 0, fontWeight: 700 }}>{candidate.name.trim()}</p>
              <p style={{ margin: 0 }}>{candidate.species} · {candidate.class} · {candidate.outfit} · {candidate.personality}</p>
              {sameDraft ? (
                <p style={{ margin: 0 }}>This character already matches your saved Guild profile. No update is needed.</p>
              ) : (
                <>
                  <p style={{ margin: 0 }}>{saved ? "This will replace your saved profile and keep a revision history." : "This will create your Guild profile linked to your verified wallet."}</p>
                  <label className="passport-account-option">
                    <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                    I have reviewed this character and want to save it.
                  </label>
                  <button className="button" disabled={!confirmed || busy} onClick={() => void save()}>
                    {busy ? "SAVING…" : saved ? "SAVE PROFILE CHANGES" : "CONFIRM AND SAVE PROFILE"}
                  </button>
                </>
              )}
              <button type="button" onClick={() => { setCandidate(undefined); setConfirmed(false); }} style={{ background: "transparent", color: "inherit", border: "1px solid currentColor", padding: "10px 14px", cursor: "pointer" }}>
                CANCEL
              </button>
            </div>
          )}
          <button type="button" disabled={busy} onClick={() => void signOut()} style={{ justifySelf: "start", background: "transparent", color: "inherit", border: "none", textDecoration: "underline", padding: "8px 0", cursor: "pointer", opacity: 0.8 }}>
            Sign out of Guild session
          </button>
        </section>
      )}
      {status && <p role="status" style={{ margin: 0 }}>{status}</p>}
      <p style={{ fontSize: "0.85rem", opacity: 0.75, margin: 0 }}>
        Guild profiles are stored securely off-chain. No NFT, token transfer or gas fee is required.
      </p>
    </div>
  );
}
