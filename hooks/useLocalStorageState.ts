"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * React state backed by localStorage. Always renders `defaultValue` on the
 * server and on first client render (so markup matches and hydration never
 * mismatches), then syncs from localStorage in an effect immediately after mount.
 */
export function useLocalStorageState<T>(key: string, defaultValue: T | (() => T)) {
  const [value, setValueState] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage is only reachable on the client, so the first sync from it
    // necessarily happens post-mount, after the hydration-safe `defaultValue`
    // has already rendered once -- this is the standard, correct pattern.
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValueState(JSON.parse(raw) as T);
      } else {
        // Nothing stored yet -- persist the freshly-generated default so it
        // (and anything derived from it, like a guest identity) stays the
        // same across reloads instead of re-randomizing every visit.
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Corrupted or inaccessible storage -- fall back to the default value.
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValueState((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Ignore quota errors or privacy-mode restrictions.
        }
        return resolved;
      });
    },
    [key]
  );

  return { value, setValue, hydrated };
}
