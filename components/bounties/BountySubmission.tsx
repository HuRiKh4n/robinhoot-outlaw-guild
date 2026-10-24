"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useWalletState } from "@/hooks/useWalletState";

export default function BountySubmission({ bountyId }: { bountyId: string }) {
  const { account } = useWalletState();
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [existing, setExisting] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    setExisting(null); setMessage(""); setDescription(""); setEvidenceUrl("");
    if (!account?.accountId) return;
    fetch("/api/guild/bounty", {headers:{"X-Guild-Account":account.accountId},cache:"no-store"})
      .then(async r => { if (!r.ok) return; const v = await r.json(); if (active) setExisting(v.submissions?.find((s: {bounty_id:string;status:string}) => s.bounty_id === bountyId)?.status ?? null); })
      .catch(() => {});
    return () => { active = false; };
  }, [account?.accountId,bountyId]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account?.accountId || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/guild/bounty", {
        method:"POST",
        headers:{"Content-Type":"application/json","X-Guild-Account":account.accountId},
        body:JSON.stringify({bountyId,evidenceUrl,description}),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error ?? "Submission failed.");
      setExisting(value.status);
      setMessage("Evidence received and stored. Awaiting manual review; no RP or $RHOOT has been awarded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submission failed.");
    } finally { setBusy(false); }
  }
  return <section className="contract-closed" aria-labelledby="submit-title">
    <h2 id="submit-title">Submit your evidence</h2>
    <p>Preview test: one submission per contract and verified NEAR wallet. Submissions are stored off-chain for future manual review. No Reputation Points or $RHOOT are awarded.</p>
    {!account ? <p>Connect your NEAR wallet and <Link href="/guild-identity">verify your Guild Identity</Link> first.</p> :
      existing ? <p role="status">Your submission status: <strong>{existing.toUpperCase()}</strong>. No further submissions are accepted for this contract.</p> :
      <form onSubmit={submit} style={{display:"grid",gap:12,maxWidth:600}}>
        <label>Public HTTPS evidence link
          <input type="url" required maxLength={1000} pattern="https://.*" placeholder="https://..." value={evidenceUrl} onChange={e=>setEvidenceUrl(e.target.value)} style={{width:"100%",padding:12,marginTop:6}} />
        </label>
        <label>Describe your contribution (20–1500 characters)
          <textarea required minLength={20} maxLength={1500} rows={5} value={description} onChange={e=>setDescription(e.target.value)} style={{width:"100%",padding:12,marginTop:6}} />
        </label>
        <button className="button" type="submit" disabled={busy}>{busy?"SUBMITTING…":"SEND FOR REVIEW"}</button>
      </form>}
    {message && <p role="status">{message}</p>}
  </section>;
}
