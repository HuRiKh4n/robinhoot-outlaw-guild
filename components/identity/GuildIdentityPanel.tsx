"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
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
    [candidate, setCandidate] = useState<OutlawDraft>(),
    [confirmed, setConfirmed] = useState(false),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const id = account?.accountId;
    let current = true;
    setVerified(false);
    setSaved(null);
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
      "Review the off-chain sign-in message in Meteor. No transaction or gas fee is required.",
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
  return (
    <div className="prototype-notice">
      <p className="identity-mode">
        {verified ? "SERVER SESSION VERIFIED" : "NO VERIFIED SERVER SESSION"}
      </p>
      <p>
        Connected account: {account?.accountId ?? "None"}. Account sharing alone
        is not authentication.
      </p>
      <button
        className="button"
        disabled={!account || !connection || busy}
        onClick={() => void authenticate()}
      >
        VERIFY WALLET OWNERSHIP
      </button>
      {verified && (
        <>
          <button
            className="button"
            disabled={busy}
            onClick={() => void signOut()}
          >
            SIGN OUT OF SERVER
          </button>
          <h2>Server character</h2>
          {saved ? (
            <>
              <p>Revision {saved.revision}</p>
              <pre className="identity-review">
                {JSON.stringify(saved.draft, null, 2)}
              </pre>
            </>
          ) : (
            <p>No server character saved for this verified account.</p>
          )}
          <button className="button" disabled={busy} onClick={reviewLocal}>
            REVIEW LOCAL DRAFT FOR IMPORT
          </button>
        </>
      )}
      {verified && candidate && (
        <>
          <h3>Proposed import</h3>
          <pre className="identity-review">
            {JSON.stringify(candidate, null, 2)}
          </pre>
          <label className="passport-account-option">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            {saved
              ? "Replace my existing server character with this reviewed draft. A revision will be retained."
              : "Create my server character from this reviewed local draft."}
          </label>
          <button
            className="button"
            disabled={!confirmed || busy}
            onClick={() => void save()}
          >
            CONFIRM IMPORT
          </button>
        </>
      )}
      <p role="status">{status}</p>
      <p>
        Local character data remains in this browser. A server record is not an
        NFT, guild membership or on-chain identity.
      </p>
    </div>
  );
}
