import type { GalleryTheme } from "@/game/museum/themes";
import { Plaque } from "@/components/ui/Plaque";

/**
 * Fills a Room Styles card with a miniature wall/rail/frame/floor
 * composition built from the real GalleryTheme fields -- a small window
 * into what the room actually looks like, instead of one flat color swatch.
 * Proportions echo Walls.tsx's real picture-rail placement (high on the
 * wall, not centered).
 */
export function RoomPreview({ theme, label, mood }: { theme: GalleryTheme; label: string; mood: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Wall */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[72%]"
        style={{ backgroundColor: theme.wallColor }}
      >
        {/* Frame hint */}
        <div
          className="absolute left-1/2 top-1/2 h-[30%] w-[34%] -translate-x-1/2 -translate-y-1/2"
          style={{ border: `2px solid ${theme.trimColor}`, backgroundColor: `${theme.skylight}55` }}
        />
      </div>
      {/* Baseboard seam */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 h-px"
        style={{ top: "72%", backgroundColor: theme.trimColor }}
      />
      {/* Floor */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[28%]"
        style={{ backgroundColor: theme.floorColor }}
      />
      <div className="absolute inset-x-3 bottom-3">
        <Plaque size="sm" title={label} subtitle={mood} />
      </div>
    </div>
  );
}
