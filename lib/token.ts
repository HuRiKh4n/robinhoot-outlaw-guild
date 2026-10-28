/** The coin's name stays secret until launch.
 *  Set NEXT_PUBLIC_RHOOT_TICKER (e.g. RHOOT) in Vercel and redeploy: the ticker then shows everywhere.
 *  Set RHOOT_TOKEN_CONTRACT and redeploy: The Draws and The Council join the menu. */
export const TICKER = (process.env.NEXT_PUBLIC_RHOOT_TICKER ?? '').trim().replace(/^\$/, '').toUpperCase();
/** "$RHOOT" once revealed, otherwise the fallback ("the coin"). */
export const coin = (fallback = 'the coin') => (TICKER ? `$${TICKER}` : fallback);
/** Footer line: "A TALE FROM THE KINGDOM OF NEAR" plus " · $RHOOT" once revealed. */
export const TALE_LINE = `A TALE FROM THE KINGDOM OF NEAR${TICKER ? ` · $${TICKER}` : ''}`;
export const launched = () => Boolean(process.env.RHOOT_TOKEN_CONTRACT?.trim());
