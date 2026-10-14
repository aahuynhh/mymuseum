import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

/**
 * The auth pages' own header -- deliberately not SiteHeader. No Explore, no
 * Create Museum, no account menu: just the way in (logo, back to the
 * marketing site) and the one alternate path (sign in vs. create account),
 * so the threshold into MyMuseum doesn't compete with a full nav for
 * attention. Static markup, no client state, so it costs nothing over SSR.
 */
export function AuthHeader({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <header className="border-b border-border/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="rounded-full transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        <p className="text-sm text-ink-muted">
          {mode === "sign-up" ? (
            <>
              Already a member?{" "}
              <Link href="/sign-in" className="font-medium text-ink underline underline-offset-4 hover:text-terracotta-dark">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New to MyMuseum?{" "}
              <Link href="/sign-up" className="font-medium text-ink underline underline-offset-4 hover:text-terracotta-dark">
                Create account
              </Link>
            </>
          )}
        </p>
      </div>
    </header>
  );
}
