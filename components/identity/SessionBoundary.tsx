"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { revokeGuildSession } from "./logout";
import { useWalletState } from "@/hooks/useWalletState";
/** Mounted only when server identity is configured. No signatures are requested here. */
export default function SessionBoundary() {
  const { account, ready } = useWalletState();
  const previous = useRef<string | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const revoke = useCallback(() => {
    setFailed(false);
    void revokeGuildSession().catch(() => setFailed(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    const next = account?.accountId ?? null;
    if (
      (previous.current !== undefined && previous.current !== next) ||
      next === null
    )
      revoke();
    previous.current = next;
  }, [account?.accountId, ready, revoke]);
  return failed ? (
    <div className="prototype-notice" role="alert">
      <p>
        Server sign-out could not be confirmed. The previous server session may
        remain until it expires. Retry before verifying another account.
      </p>
      <button className="button" onClick={revoke}>
        RETRY SERVER SIGN-OUT
      </button>
    </div>
  ) : null;
}
