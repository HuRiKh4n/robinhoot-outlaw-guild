/** The same arithmetic as scripts/draw.mjs, for the browser: anyone can re-run a draw on their own device. */
export async function sha256Hex(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface Entry { account: string; tickets: number }
export interface Pick { round: number; hash: string; totalTickets: number; ticket: number; account: string; tickets: number }

/** Same as scripts/draw.mjs: ticket = SHA-256(seed:kind:i) mod tickets left, walked along the alphabetical list. */
export async function drawWinners(seedHash: string, kind: string, eligible: Array<string | Entry>, count: number): Promise<Pick[]> {
  const pool: Entry[] = eligible.map(e => typeof e === 'string' ? { account: e, tickets: 1 } : { ...e })
    .sort((a, b) => (a.account < b.account ? -1 : a.account > b.account ? 1 : 0));
  const picks: Pick[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    const total = pool.reduce((sum, e) => sum + e.tickets, 0);
    const hash = await sha256Hex(`${seedHash}:${kind}:${i}`);
    const drawn = Number(BigInt('0x' + hash) % BigInt(total));
    let ticket = drawn, index = 0;
    while (ticket >= pool[index].tickets) { ticket -= pool[index].tickets; index++; }
    const [won] = pool.splice(index, 1);
    picks.push({ round: i, hash, totalTickets: total, ticket: drawn, account: won.account, tickets: won.tickets });
  }
  return picks;
}

export const TICKET_TIERS = [50, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000];
