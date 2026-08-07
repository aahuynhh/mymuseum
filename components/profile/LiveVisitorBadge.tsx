"use client";

import { useVisitorCountPeek } from "@/hooks/useVisitorCountPeek";

export function LiveVisitorBadge({ museumId }: { museumId: string }) {
  const count = useVisitorCountPeek(museumId, 1);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas-deep px-3 py-1.5 text-sm font-medium text-ink">
      <span className="h-2 w-2 rounded-full bg-sage" aria-hidden="true" />
      {count} {count === 1 ? "visitor" : "visitors"} here now
    </span>
  );
}
