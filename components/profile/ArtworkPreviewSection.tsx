"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Artwork } from "@/types";
import { ArtworkGrid } from "@/components/artwork/ArtworkGrid";
import { ArtworkModal } from "@/components/artwork/ArtworkModal";

export function ArtworkPreviewSection({ artworks }: { artworks: Artwork[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <>
      <ArtworkGrid artworks={artworks} onSelect={setActiveId} />
      <AnimatePresence>
        {activeId && (
          <ArtworkModal
            key="artwork-modal"
            artworks={artworks}
            activeId={activeId}
            onClose={() => setActiveId(null)}
            onNavigate={setActiveId}
          />
        )}
      </AnimatePresence>
    </>
  );
}
