"use client";

import { Text } from "@react-three/drei";
import type { Museum } from "@/types";
import { getGalleryTheme } from "@/game/museum/themes";
import { Floor } from "./Floor";
import { Walls } from "./Walls";
import { Ceiling } from "./Ceiling";
import { CustomRoomModel } from "./CustomRoomModel";
import { Bench, Chandelier, Sculpture } from "./Furnishings";
import { Rug, TallPlant } from "./DecorModels";
import { MuseumAssetPiece } from "./MuseumAssetPieces";
import { ArtworkFrame } from "@/components/artwork/ArtworkFrame";

interface MuseumRoomProps {
  museum: Museum;
  activeArtworkId?: string | null;
}

export function MuseumRoom({ museum, activeArtworkId }: MuseumRoomProps) {
  const { rooms, artworks } = museum;

  const areas = rooms.map((r) => (r.bounds.maxX - r.bounds.minX) * (r.bounds.maxZ - r.bounds.minZ));
  const largestRoomIndex = areas.indexOf(Math.max(...areas));

  return (
    <group>
      {rooms.map((room, i) => {
        const theme = getGalleryTheme(room.theme);
        const width = room.bounds.maxX - room.bounds.minX;
        const depth = room.bounds.maxZ - room.bounds.minZ;
        const centerX = (room.bounds.minX + room.bounds.maxX) / 2;
        const centerZ = (room.bounds.minZ + room.bounds.maxZ) / 2;
        const area = width * depth;
        const entranceOpening = room.openings.find((o) => o.isEntrance);

        return (
          <group key={room.id}>
            {room.modelUrl ? (
              <CustomRoomModel url={room.modelUrl} />
            ) : (
              <>
                <Floor bounds={room.bounds} color={theme.floorColor} />
                <Walls room={room} />
                <Ceiling bounds={room.bounds} height={room.height} skylightColor={theme.skylight} />
                <Chandelier position={[centerX, room.height * 0.72, centerZ]} accentColor={theme.accentLight} />
              </>
            )}

            {/* Room name signage, mounted high on the back wall. Offset
                past the wall's inner face (0.2 in from the bounds line,
                see Walls.tsx) so the text sits proud of the wall instead
                of embedding inside it. */}
            <Text
              position={[centerX, Math.min(room.height * 0.82, room.height - 0.4), room.bounds.minZ + 0.22]}
              fontSize={0.16}
              color={theme.railColor}
              anchorX="center"
              anchorY="middle"
              maxWidth={width * 0.8}
            >
              {room.name.toUpperCase()}
            </Text>

            {/* Welcome plaque beside the museum's front door */}
            {entranceOpening && (
              <Text
                position={[entranceOpening.center, room.height * 0.62, room.bounds.maxZ - 0.22]}
                fontSize={0.22}
                color={theme.railColor}
                anchorX="center"
                anchorY="middle"
                maxWidth={entranceOpening.width * 1.6}
              >
                {museum.name}
              </Text>
            )}

            {/* Auto-placed furnishings, conservative so nothing collides with artwork or doorways.
                The largest room gets a sculpture centerpiece instead of center benches.
                Skipped for a custom-modeled room -- sized/positioned for the procedural
                box's empty floor, they'd clip through or clash with hand-modeled decor. */}
            {!room.modelUrl &&
              (i === largestRoomIndex ? (
                <>
                  <Rug position={[centerX, 0.011, centerZ]} scale={1.35} color={theme.railColor} />
                  <Sculpture position={[centerX, 0, centerZ]} />
                  {/* Columns need real clearance around the rug/sculpture
                      centerpiece to not crowd it -- the smallest single-room
                      museums (as tight as ~6.5x6.5) had them nearly touching
                      the rug. Same 55 sq-unit bar as the two-bench layout
                      below, which already marks a room as genuinely spacious. */}
                  {area > 55 && (
                    <>
                      <MuseumAssetPiece name="Column" position={[centerX - width * 0.2, 0, centerZ - depth * 0.05]} />
                      <MuseumAssetPiece name="Column" position={[centerX + width * 0.2, 0, centerZ - depth * 0.05]} />
                    </>
                  )}
                </>
              ) : area > 55 ? (
                <>
                  <Bench position={[centerX - width * 0.22, 0.22, centerZ]} />
                  <Bench position={[centerX + width * 0.22, 0.22, centerZ]} />
                </>
              ) : (
                area > 30 && <Bench position={[centerX, 0.22, centerZ]} />
              ))}
            {/* One per room, not two -- tall_flower.obj is 16.6k faces (vs.
                ~2-4k for the rest of the decor set), so a second copy in
                every large room was a real, measurable performance cost for
                a corner accent plant. */}
            {!room.modelUrl && area > 45 && (
              <TallPlant position={[room.bounds.minX + 0.9, 0, room.bounds.minZ + 0.9]} />
            )}
            {!room.modelUrl && area > 45 && i !== largestRoomIndex && (
              <MuseumAssetPiece name="GlassBox" position={[room.bounds.maxX - 0.9, 0, room.bounds.maxZ - 0.9]} />
            )}
          </group>
        );
      })}

      {artworks.map((artwork) => (
        <ArtworkFrame key={artwork.id} artwork={artwork} isActive={artwork.id === activeArtworkId} />
      ))}
    </group>
  );
}
