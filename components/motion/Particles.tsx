/** Decorative floating particles (embers, fireflies, falling coins). Pure CSS, no JS at runtime.
 *  Positions come from a fixed seed so server and client render identically. */
type Kind = 'ember' | 'firefly' | 'coin';

function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

export default function Particles({ kind, count, seed = 7 }: { kind: Kind; count: number; seed?: number }) {
  const rand = seeded(seed);
  return <div className={`particles particles-${kind}`} aria-hidden="true">
    {Array.from({ length: count }, (_, i) => {
      const style = {
        left: `${(rand() * 100).toFixed(1)}%`,
        top: kind === 'coin' ? '-8%' : `${(20 + rand() * 75).toFixed(1)}%`,
        animationDelay: `${(-rand() * 14).toFixed(2)}s`,
        animationDuration: `${(kind === 'coin' ? 5 + rand() * 5 : 7 + rand() * 9).toFixed(2)}s`,
        '--drift': `${((rand() - 0.5) * 120).toFixed(0)}px`,
        '--size': `${(kind === 'coin' ? 12 + rand() * 12 : kind === 'firefly' ? 3 + rand() * 4 : 2 + rand() * 3).toFixed(1)}px`,
      } as React.CSSProperties;
      return <span key={i} style={style} />;
    })}
  </div>;
}
