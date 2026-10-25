'use client';

import { useEffect, useRef } from 'react';
import { RoadStory, SheriffStory, TaleStory } from './Stories';

const stories = [
  { hash: 'tale', title: 'tale-title', Story: TaleStory, className: 'story-tale' },
  { hash: 'sheriff', title: 'sheriff-title', Story: SheriffStory, className: 'story-sheriff' },
  { hash: 'road', title: 'road-title', Story: RoadStory, className: 'story-road' },
] as const;

/** Parchment pages that open over the hideout. Each has its own address (#tale, #sheriff, #road),
 *  so links, the back button and shared URLs all work. */
export default function StoryDialogs() {
  const refs = useRef<Record<string, HTMLDialogElement | null>>({});

  useEffect(() => {
    const sync = () => {
      const wanted = location.hash.slice(1);
      for (const { hash } of stories) {
        const dialog = refs.current[hash];
        if (!dialog) continue;
        if (hash === wanted && !dialog.open) dialog.showModal();
        if (hash !== wanted && dialog.open) dialog.close();
      }
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const clearHash = (hash: string) => {
    if (location.hash === `#${hash}`) history.replaceState(null, '', location.pathname + location.search);
  };

  return <>{stories.map(({ hash, title, Story, className }) =>
    <dialog key={hash} id={`story-${hash}`} ref={element => { refs.current[hash] = element; }} className={`story-dialog ${className}`} aria-labelledby={title}
      onClose={() => clearHash(hash)} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <div className="story-page">
        <button type="button" className="story-close" onClick={() => refs.current[hash]?.close()} aria-label="Close">✕</button>
        <Story />
      </div>
    </dialog>)}</>;
}
