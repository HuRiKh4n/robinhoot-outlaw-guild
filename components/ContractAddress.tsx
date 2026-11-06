'use client';

import { useState } from 'react';

/** The coin's contract address with a copy button and explorer links. */
export default function ContractAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  }
  return <section className="ca-box" aria-label="Contract address">
    <span className="ca-label">CONTRACT ADDRESS (NEAR)</span>
    <button type="button" className="ca-value" onClick={copy} title="Copy">
      <code>{address}</code><b>{copied ? 'COPIED ✓' : 'COPY'}</b>
    </button>
    <p className="ca-links">
      <a href={`https://nearblocks.io/token/${address}`} target="_blank" rel="noopener noreferrer">NearBlocks ↗</a>
      <a href={`https://dexscreener.com/near/${address}`} target="_blank" rel="noopener noreferrer">DexScreener ↗</a>
      <a href="https://justhoot.fun" target="_blank" rel="noopener noreferrer">Buy on JustHoot ↗</a>
    </p>
  </section>;
}
