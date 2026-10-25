import "server-only";

/** Minimal NEAR archival RPC client: block lookup by time and historical NEP-141 balances. */
export class NearArchive {
  private blocks = new Map<number, { height: number; time: number }>();
  constructor(private url: string) {}

  private async rpc(method: string, params: unknown) {
    const response = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "raid", method, params }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`RPC ${response.status}`);
    return response.json() as Promise<{ result?: any; error?: any }>;
  }

  /** A block by height; skipped heights fall back to the nearest earlier block. */
  async block(height?: number): Promise<{ height: number; time: number }> {
    for (let step = 0; step < 12; step++) {
      const params = height === undefined ? { finality: "final" } : { block_id: height - step };
      const data = await this.rpc("block", params);
      if (data.result?.header) {
        const header = data.result.header;
        const found = { height: header.height as number, time: Number(BigInt(header.timestamp_nanosec) / BigInt(1000000)) };
        this.blocks.set(found.height, found);
        return found;
      }
      if (height === undefined) break;
    }
    throw new Error("Block not found");
  }

  /** The last block at or before a moment (ms), within a minute or two. */
  async blockAt(time: number, head?: { height: number; time: number }) {
    const top = head ?? await this.block();
    if (time >= top.time) return top;
    let guess = top;
    let msPerBlock = 600;
    for (let round = 0; round < 3; round++) {
      const target = Math.max(1, Math.round(guess.height - (guess.time - time) / msPerBlock));
      const next = await this.block(target);
      if (next.height !== guess.height && next.time !== guess.time) msPerBlock = Math.max(200, Math.abs((guess.time - next.time) / (guess.height - next.height)));
      guess = next;
      if (Math.abs(guess.time - time) < 90_000) break;
    }
    return guess;
  }

  private async view(contract: string, method: string, args: object, height?: number) {
    const params: Record<string, unknown> = {
      request_type: "call_function", account_id: contract, method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
    };
    if (height === undefined) params.finality = "final"; else params.block_id = height;
    const data = await this.rpc("query", params);
    if (data.error || data.result?.error) {
      const text = JSON.stringify(data.error ?? data.result.error);
      // The token did not exist yet at that height: nobody held it.
      if (/UNKNOWN_ACCOUNT|CodeDoesNotExist|does not exist/i.test(text)) return null;
      throw new Error("View call failed");
    }
    return JSON.parse(Buffer.from(data.result.result as number[]).toString("utf8"));
  }

  async balance(token: string, account: string, height: number): Promise<bigint> {
    const value = await this.view(token, "ft_balance_of", { account_id: account }, height);
    return value === null ? BigInt(0) : BigInt(String(value));
  }

  async metadata(token: string): Promise<{ decimals: number; symbol: string }> {
    const value = await this.view(token, "ft_metadata", {});
    return { decimals: Number(value?.decimals ?? 18), symbol: String(value?.symbol ?? "RHOOT") };
  }
}
