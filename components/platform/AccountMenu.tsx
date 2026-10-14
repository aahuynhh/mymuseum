"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/auth/actions";
import { AvatarHeadshot } from "@/components/avatar/AvatarHeadshot";
import { LinkButton } from "@/components/ui/Button";
import { onAvatarUpdate } from "@/lib/profile/avatarSync";
import type { AvatarConfiguration } from "@/types";

interface AccountProfile {
  username: string | null;
  displayName: string | null;
  avatarConfiguration: AvatarConfiguration | null;
}

const menuItemClass =
  "rounded-lg px-2.5 py-1.5 text-left font-heading text-sm font-medium text-ink transition-colors duration-200 hover:bg-canvas-deep";

/**
 * The persistent top-right corner of the platform HUD. Doubles as the
 * account identity (the user's own avatar renders as the trigger, per the
 * "avatar as identity" brief) and the entry point for everything that used
 * to be plain nav-bar text -- My Profile, Log out, etc.
 */
export function AccountMenu() {
  const [expanded, setExpanded] = useState(false);
  // `undefined` = still checking the session, so nothing flashes on load.
  const [user, setUser] = useState<User | null | undefined>(undefined);
  // Only ever read once `user` is truthy (the component renders the signed-
  // out state otherwise), so there's no need to reset this back to
  // "unloaded" on logout -- it simply goes unused until the next sign-in
  // re-keys the fetch effect below.
  const [profile, setProfile] = useState<AccountProfile | undefined>(undefined);
  // Whether the signed-in user has any unread Museum Mail -- a presence
  // dot, not a numeric badge, deliberately: a count is the same
  // checking-compulsion trigger the feature's "no public message counts"
  // rule already avoids, even kept private.
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("username, display_name, avatar_configuration")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile({
          username: data?.username ?? null,
          displayName: data?.display_name ?? null,
          avatarConfiguration: (data?.avatar_configuration as AvatarConfiguration | null) ?? null,
        });
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null)
      .then(({ count }) => setHasUnread((count ?? 0) > 0));
  }, [user]);

  // AvatarEditor and ProfileEditor both persist a saved avatar straight to
  // the account (profiles.avatar_configuration) via PATCH /api/profile, but
  // this menu's own `profile` state is only ever fetched once above --
  // nothing else would otherwise tell it the avatar it's already rendering
  // just changed. See lib/profile/avatarSync.ts.
  useEffect(() => {
    return onAvatarUpdate((avatarConfiguration) => {
      setProfile((prev) => (prev ? { ...prev, avatarConfiguration } : prev));
    });
  }, []);

  // Render a same-position, same-size placeholder while the session check
  // is in flight (rather than nothing) -- this corner is the one persistent
  // piece of account identity in the HUD, so leaving it visibly blank on
  // first paint read as the redesign not having loaded at all. The pulse is
  // a plain CSS animation, so globals.css's reduced-motion override already
  // neutralizes it for prefers-reduced-motion.
  if (user === undefined) {
    return (
      <div className="fixed right-4 top-4 z-40 sm:right-6 sm:top-6">
        <div
          aria-hidden="true"
          className="h-14 w-14 animate-pulse rounded-full border border-border/70 bg-surface/70 shadow-warm-sm backdrop-blur-md"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed right-4 top-4 z-40 flex items-center gap-2 sm:right-6 sm:top-6">
        <LinkButton href="/sign-in" variant="secondary" size="md" className="!bg-surface/95 backdrop-blur-md">
          Log in
        </LinkButton>
        <LinkButton href="/sign-up" size="md">
          Sign Up
        </LinkButton>
      </div>
    );
  }

  const publicProfileHref = profile?.username ? `/artist/${profile.username}` : "/dashboard/profile";
  const label = profile?.displayName || profile?.username || "Your account";

  return (
    <div className="fixed right-4 top-4 z-40 sm:right-6 sm:top-6">
      <div className="relative">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={`Account menu for ${label}${hasUnread ? " (unread Museum Mail)" : ""}`}
          className="group relative block h-14 w-14 shrink-0 rounded-full"
        >
          <span className="block h-full w-full overflow-hidden rounded-full border border-border/70 bg-surface/95 shadow-warm-sm backdrop-blur-md transition-shadow duration-200 group-hover:shadow-warm-md">
            {profile?.avatarConfiguration ? (
              <AvatarHeadshot config={profile.avatarConfiguration} className="h-full w-full border-0 shadow-none" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-gallery-blue font-heading text-base text-surface">
                {label.charAt(0).toUpperCase()}
              </span>
            )}
          </span>
          {hasUnread && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-terracotta-dark"
            />
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-2xl border border-border/70 bg-surface/95 p-3 shadow-warm-md backdrop-blur-md"
            >
              <div className="px-1 pb-2">
                <p className="truncate font-heading text-sm text-ink">{profile?.displayName || "Unnamed artist"}</p>
                {profile?.username && <p className="truncate text-xs text-ink-muted">@{profile.username}</p>}
              </div>
              <div className="rule-dotted mb-2" />
              <div className="flex flex-col gap-1">
                <Link href="/avatar" className={menuItemClass} onClick={() => setExpanded(false)}>
                  Customize Avatar
                </Link>
                <Link href={publicProfileHref} className={menuItemClass} onClick={() => setExpanded(false)}>
                  Public Profile
                </Link>
                <Link
                  href="/dashboard/mail"
                  className={`${menuItemClass} flex items-center gap-1.5`}
                  onClick={() => setExpanded(false)}
                >
                  Museum Mail
                  {hasUnread && (
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta-dark" />
                  )}
                </Link>
                <Link href="/dashboard/profile" className={menuItemClass} onClick={() => setExpanded(false)}>
                  Settings
                </Link>
                <form action={signOut}>
                  <button type="submit" className={`${menuItemClass} w-full text-terracotta-dark`}>
                    Log out
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
