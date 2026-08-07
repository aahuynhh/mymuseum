"use client";

import { useLocalStorageState } from "./useLocalStorageState";

export interface VisitorIdentity {
  username: string;
  displayName: string;
  /** Stable per-browser id sent with every multiplayer join so the server
   * can recognize "this is the same visitor reconnecting" and clean up the
   * old connection instead of leaving a duplicate avatar behind. */
  sessionId: string;
}

const STORAGE_KEY = "mymuseum.visitorIdentity";

function randomId() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function createGuestIdentity(): VisitorIdentity {
  const suffix = Math.floor(100 + Math.random() * 900);
  return { username: `visitor-${suffix}`, displayName: `Visitor ${suffix}`, sessionId: randomId() };
}

/** A lightweight, no-signup identity for this browser -- MyMuseum has one
 * account type and no registration flow in this prototype, so visitors get
 * a friendly guest name that persists locally and travels with their avatar. */
export function useVisitorIdentity() {
  const { value, setValue, hydrated } = useLocalStorageState<VisitorIdentity>(
    STORAGE_KEY,
    createGuestIdentity
  );

  return { identity: value, setIdentity: setValue, hydrated };
}
