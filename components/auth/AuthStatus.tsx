"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/auth/actions";

/** Self-contained sign-in/log-out slot for the header. Reads the Supabase
 * session client-side so every page rendering `<SiteHeader />` gets a
 * correct auth state without having to thread it down as a prop. */
export function AuthStatus({ linkClassName }: { linkClassName: string }) {
  // `undefined` = still checking, so we render nothing rather than flash
  // "Sign in" for a moment on every page load.
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (user === undefined) return null;

  if (!user) {
    return (
      <Link href="/sign-in" className={linkClassName}>
        Sign in
      </Link>
    );
  }

  return (
    <>
      <Link href="/dashboard" className={linkClassName}>
        My Museums
      </Link>
      <form action={signOut} className="flex items-center gap-3">
        <span className="text-sm text-ink-muted">{user.email?.split("@")[0]}</span>
        <button type="submit" className={linkClassName}>
          Log out
        </button>
      </form>
    </>
  );
}
