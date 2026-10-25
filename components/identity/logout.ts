"use client";
let pending: Promise<unknown> = Promise.resolve();
export function revokeGuildSession() {
  pending = pending
    .catch(() => {})
    .then(async () => {
      const response = await fetch("/api/guild/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok)
        throw new Error(
          "Server sign-out was not confirmed. Retry before verifying another account.",
        );
    });
  return pending;
}
export function waitForGuildLogout() {
  return pending;
}
