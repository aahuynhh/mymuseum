import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { PAGE_ACCENT_BG, type PageAccent } from "@/components/ui/pageAccents";

interface AuthGateProps {
  icon: ReactNode;
  accent?: PageAccent;
  title: string;
  description?: ReactNode;
}

/**
 * "Sign in to continue" card shown in place of a page's real content when
 * there's no session -- was hand-typed identically on create/dashboard/
 * profile/mail/edit, each with its own copy-pasted italic eyebrow line.
 * Consolidated so all five stay in sync and share PageHeader's icon-badge
 * language instead of the old eyebrow.
 */
export function AuthGate({ icon, accent = "terracotta", title, description }: AuthGateProps) {
  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-surface p-8 text-center shadow-warm-sm sm:p-12">
      <span
        aria-hidden="true"
        className={cn(
          "tile-bevel mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-surface",
          PAGE_ACCENT_BG[accent]
        )}
      >
        {icon}
      </span>
      <h1 className="mt-4 font-heading text-2xl font-semibold text-ink">{title}</h1>
      {description && <p className="mx-auto mt-3 max-w-sm text-ink-muted">{description}</p>}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <LinkButton href="/sign-in" size="lg">
          Sign in
        </LinkButton>
        <LinkButton href="/sign-up" variant="secondary" size="lg">
          Create an account
        </LinkButton>
      </div>
    </div>
  );
}
