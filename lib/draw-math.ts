/** The same arithmetic as scripts/draw.mjs, for the browser: anyone can re-run a draw on their own device. */
export async function sha256Hex(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface Pick { round: number; hash: string; poolSize: number; position: number; account: string }

/** Winner i = position SHA-256(seed:kind:i) mod (accounts left), over the alphabetical list. */
export async function drawWinners(seedHash: string, kind: string, eligible: string[], count: number): Promise<Pick[]> {
  const pool = [...eligible].sort();
  const picks: Pick[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    const hash = await sha256Hex(`${seedHash}:${kind}:${i}`);
    const position = Number(BigInt('0x' + hash) % BigInt(pool.length));
    picks.push({ round: i, hash, poolSize: pool.length, position, account: pool[position] });
    pool.splice(position, 1);
  }
  return picks;
}
