import "server-only";
import { IdentityError, type AuthorizeKey } from "./core";
/** Trusted operator-configured endpoint; verify chain identity as well as final access-key state. */
export function mainnetKeyAuthorizer(
  url: string,
  transport: typeof fetch = fetch,
): AuthorizeKey {
  let mainnetUntil = 0;
  async function rpc(method: string, params: unknown, limit: number) {
    const response = await transport(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "guild-key-check",
        method,
        params,
      }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
      redirect: "error",
    });
    const text = await response.text();
    if (!response.ok || text.length > limit) throw new Error();
    return JSON.parse(text);
  }
  return async (account, publicKey) => {
    try {
      if (mainnetUntil <= Date.now()) {
        const status = await rpc("status", [], 81920);
        if (status.error || status.result?.chain_id !== "mainnet")
          throw new Error();
        mainnetUntil = Date.now() + 300000;
      }
      const data = await rpc(
        "query",
        {
          request_type: "view_access_key",
          finality: "final",
          account_id: account,
          public_key: publicKey,
        },
        8192,
      );
      if (data.error) {
        const name = data.error.cause?.name ?? data.error.data?.name;
        if (["UNKNOWN_ACCESS_KEY", "UNKNOWN_ACCOUNT"].includes(name))
          return false;
        throw new Error();
      }
      return (
        data.result?.permission === "FullAccess" &&
        Number.isSafeInteger(data.result.block_height) &&
        typeof data.result.block_hash === "string"
      );
    } catch {
      throw new IdentityError(
        503,
        "Wallet authorization could not be checked. Try again later.",
      );
    }
  };
}
