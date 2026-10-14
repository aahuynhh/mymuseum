"use client";

import type { AvatarConfiguration } from "@/types";

const AVATAR_UPDATED_EVENT = "mymuseum:avatar-updated";

/**
 * Lets whichever editor just persisted the signed-in user's avatar
 * (AvatarEditor on /avatar, ProfileEditor on /dashboard/profile) tell the
 * corner AccountMenu to update immediately. AccountMenu fetches the
 * account's avatar once on mount and otherwise has no way to learn it
 * changed -- router.refresh() only re-renders server components, and
 * AccountMenu's avatar comes from its own client-side fetch.
 */
export function broadcastAvatarUpdate(config: AvatarConfiguration) {
  window.dispatchEvent(new CustomEvent<AvatarConfiguration>(AVATAR_UPDATED_EVENT, { detail: config }));
}

export function onAvatarUpdate(handler: (config: AvatarConfiguration) => void) {
  function listener(event: Event) {
    handler((event as CustomEvent<AvatarConfiguration>).detail);
  }
  window.addEventListener(AVATAR_UPDATED_EVENT, listener);
  return () => window.removeEventListener(AVATAR_UPDATED_EVENT, listener);
}
