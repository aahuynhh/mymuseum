"use client";

import { useState } from "react";
import { Button, type ButtonVariant } from "@/components/ui/Button";

export function CopyLinkButton({
  url,
  variant = "secondary",
}: {
  url: string;
  variant?: ButtonVariant;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API can be unavailable (older browsers, insecure context);
      // the URL is still visible to the user to copy manually.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button type="button" variant={variant} onClick={handleCopy}>
        {copied ? "Link copied!" : "Copy museum link"}
      </Button>
      <span role="status" className="sr-only">
        {copied ? "Museum link copied to clipboard" : ""}
      </span>
    </div>
  );
}
