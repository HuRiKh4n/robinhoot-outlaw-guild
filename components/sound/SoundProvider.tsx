'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/** Tavern music + small sound effects. Off by default; the visitor turns it on with the lute button.
 *  Lives in the root layout so the music keeps playing across page navigations. */
const PLAYLIST = ['/audio/tavern-raise-your-mugs.mp3', '/audio/tavern-knight-and-maid.mp3'];
const EFFECTS = { coin: '/audio/fx-coins.mp3', hit: '/audio/fx-epic-hit.mp3' } as const;
type Effect = keyof typeof EFFECTS;
const STORAGE_KEY = 'robinhoot:sound';
const MUSIC_VOLUME = 0.32;

interface SoundState { on: boolean; toggle: () => void; play: (effect: Effect) => void }
const SoundContext = createContext<SoundState>({ on: false, toggle: () => {}, play: () => {} });
export const useSound = () => useContext(SoundContext);

export default function SoundProvider({ children }: { children: React.ReactNode }) {
  const [on, setOn] = useState(false);
  const music = useRef<HTMLAudioElement | null>(null);
  const track = useRef(0);
  const fade = useRef<number>(0);

  const ensureMusic = useCallback(() => {
    if (!music.current) {
      const audio = new Audio(PLAYLIST[track.current]);
      audio.preload = 'none';
      audio.addEventListener('ended', () => {
        track.current = (track.current + 1) % PLAYLIST.length;
        audio.src = PLAYLIST[track.current];
        void audio.play().catch(() => {});
      });
      music.current = audio;
    }
    return music.current;
  }, []);

  const fadeTo = useCallback((audio: HTMLAudioElement, target: number, done?: () => void) => {
    cancelAnimationFrame(fade.current);
    const start = audio.volume, began = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - began) / 900);
      audio.volume = start + (target - start) * k;
      if (k < 1) fade.current = requestAnimationFrame(step); else done?.();
    };
    fade.current = requestAnimationFrame(step);
  }, []);

  const start = useCallback(() => {
    const audio = ensureMusic();
    audio.volume = 0;
    audio.play().then(() => fadeTo(audio, MUSIC_VOLUME)).catch(() => {});
  }, [ensureMusic, fadeTo]);

  const toggle = useCallback(() => {
    setOn(previous => {
      const next = !previous;
      try { localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off'); } catch {}
      if (next) start();
      else if (music.current) { const audio = music.current; fadeTo(audio, 0, () => audio.pause()); }
      return next;
    });
  }, [start, fadeTo]);

  // A returning visitor who left sound on: browsers only allow audio after a tap, so wait for the first one.
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch {}
    if (saved !== 'on') return;
    setOn(true);
    const resume = () => { start(); window.removeEventListener('pointerdown', resume); window.removeEventListener('keydown', resume); };
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
    return () => { window.removeEventListener('pointerdown', resume); window.removeEventListener('keydown', resume); };
  }, [start]);

  // Pause when the tab is hidden, resume when it comes back.
  useEffect(() => {
    const onVisibility = () => {
      const audio = music.current;
      if (!audio || !on) return;
      if (document.hidden) audio.pause(); else void audio.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [on]);

  const play = useCallback((effect: Effect) => {
    if (!on) return;
    const sfx = new Audio(EFFECTS[effect]);
    sfx.volume = effect === 'hit' ? 0.55 : 0.4;
    void sfx.play().catch(() => {});
  }, [on]);

  return <SoundContext.Provider value={{ on, toggle, play }}>{children}</SoundContext.Provider>;
}
