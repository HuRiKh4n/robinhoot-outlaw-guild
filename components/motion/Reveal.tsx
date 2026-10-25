'use client';

import { useEffect, useRef, useState } from 'react';

/** Reveals its children like ink drying on a page when they scroll into view.
 *  Server-rendered content is visible; it is only hidden after hydration if it is still below the fold. */
export default function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'static' | 'waiting' | 'shown'>('static');

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    if (element.getBoundingClientRect().top < window.innerHeight * 0.85) return;
    setState('waiting');
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setState('shown'); observer.disconnect(); }
    }, { rootMargin: '0px 0px -12% 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={`reveal ${className}`} data-reveal={state}>{children}</div>;
}
