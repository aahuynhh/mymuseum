"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/Button";

export default function MuseumError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-2xl text-ink">This museum hit a snag</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        Something went wrong while loading this room. You can try again, or head back home.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="primary">
          Try again
        </Button>
        <LinkButton href="/" variant="secondary">
          Back to MyMuseum
        </LinkButton>
      </div>
    </main>
  );
}
