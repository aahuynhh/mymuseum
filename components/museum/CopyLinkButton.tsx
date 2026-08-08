"use client";

import { useState } from "react";
import { Button, type ButtonVariant } from "@/components/ui/Button";

export function CopyLinkButton({
  path,
  variant = "secondary",
  isPrivate = false,
}: {
  /** The stable, relative share route -- always `/museum/[museumId]`.
   * Combined with the browser's own `window.location.origin` at copy time
   * (never a hard-coded domain), so this correctly copies
   * `http://localhost:3000/museum/...` in local dev and the real
   * production origin once deployed, with no configuration needed. */
  path: string;
  variant?: ButtonVariant;
  /** When true, shows a small caption clarifying that copying the link
   * doesn't make the museum publicly reachable -- only the Published/
   * Private toggle does. Used by the Phase 3 dashboard/edit share-link
   * affordances; omitted (false) everywhere a museum is already known to be
   * published, e.g. the create-flow success screen and the demo artist's
   * profile page. */
  isPrivate?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const absoluteUrl = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
    } catch {
      // Clipboard API can be unavailable (older browsers, insecure context);
      // there's nothing else to fall back to from a click handler.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button type="button" variant={variant} onClick={handleCopy}>
        {copied ? "Link copied!" : "Copy museum link"}
      </Button>
      {isPrivate && (
        <span className="text-xs text-ink-muted">
          Private -- only you can open this link right now.
        </span>
      )}
      <span role="status" className="sr-only">
        {copied ? "Museum link copied to clipboard" : ""}
      </span>
    </div>
  );
}
