"use client";

import { useEffect, useRef, useState } from "react";

const AMBIENT_VOLUME = 0.32;

/**
 * Soft looping background music for a museum visit. Browsers block
 * autoplay-with-sound without a prior user gesture, so this attempts to
 * play on mount and quietly falls back to "not playing" if blocked --
 * the returned `toggle` is what the Controls panel uses to start it by
 * hand in that case.
 */
export function useAmbientAudio(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = AMBIENT_VOLUME;
    audioRef.current = audio;

    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [src]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  }

  return { playing, toggle };
}
