"use client";

import { useEffect, useRef } from "react";

export interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

function emptyKeyState(): KeyState {
  return { forward: false, backward: false, left: false, right: false };
}

const FORWARD_KEYS = new Set(["KeyW", "ArrowUp"]);
const BACKWARD_KEYS = new Set(["KeyS", "ArrowDown"]);
const LEFT_KEYS = new Set(["KeyA", "ArrowLeft"]);
const RIGHT_KEYS = new Set(["KeyD", "ArrowRight"]);
const NAVIGATION_CODES = new Set([
  ...FORWARD_KEYS,
  ...BACKWARD_KEYS,
  ...LEFT_KEYS,
  ...RIGHT_KEYS,
]);

/**
 * Tracks WASD / arrow-key movement state in a ref (not React state) so the
 * render loop can read it every frame without triggering re-renders.
 * Resets to neutral whenever the window loses focus or `enabled` becomes
 * false, so a key held down while a modal opens can never get "stuck".
 */
export function useKeyState(enabled: boolean) {
  const keysRef = useRef<KeyState>(emptyKeyState());

  useEffect(() => {
    if (!enabled) {
      keysRef.current = emptyKeyState();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!NAVIGATION_CODES.has(event.code)) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      event.preventDefault();
      if (FORWARD_KEYS.has(event.code)) keysRef.current.forward = true;
      if (BACKWARD_KEYS.has(event.code)) keysRef.current.backward = true;
      if (LEFT_KEYS.has(event.code)) keysRef.current.left = true;
      if (RIGHT_KEYS.has(event.code)) keysRef.current.right = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (FORWARD_KEYS.has(event.code)) keysRef.current.forward = false;
      if (BACKWARD_KEYS.has(event.code)) keysRef.current.backward = false;
      if (LEFT_KEYS.has(event.code)) keysRef.current.left = false;
      if (RIGHT_KEYS.has(event.code)) keysRef.current.right = false;
    };

    const reset = () => {
      keysRef.current = emptyKeyState();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) reset();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reset();
    };
  }, [enabled]);

  return keysRef;
}
