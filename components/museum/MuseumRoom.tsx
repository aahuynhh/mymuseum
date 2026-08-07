"use client";

import { Text } from "@react-three/drei";
import type { Museum } from "@/types";
import { getGalleryTheme } from "@/game/museum/themes";
import { Floor } from "./Floor";
import { Walls } from "./Walls";
import { Bench, PottedPlant, Sculpture } from "./Furnishings";
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
            <Floor bounds={room.bounds} color={theme.floorColor} />
            <Walls room={room} />

            {/* Soft overhead skylight glow, tinted per room */}
            <mesh position={[centerX, room.height - 0.02, centerZ]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[width * 0.55, depth * 0.55]} />
              <meshBasicMaterial color={theme.skylight} transparent opacity={0.4} />
            </mesh>

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
                The largest room gets a sculpture centerpiece instead of center benches. */}
            {i === largestRoomIndex ? (
              <Sculpture position={[centerX, 0, centerZ]} />
            ) : area > 55 ? (
              <>
                <Bench position={[centerX - width * 0.22, 0.22, centerZ]} />
                <Bench position={[centerX + width * 0.22, 0.22, centerZ]} />
              </>
            ) : (
              area > 30 && <Bench position={[centerX, 0.22, centerZ]} />
            )}
            {area > 45 && (
              <>
                <PottedPlant position={[room.bounds.minX + 0.9, 0, room.bounds.minZ + 0.9]} />
                <PottedPlant position={[room.bounds.maxX - 0.9, 0, room.bounds.minZ + 0.9]} />
              </>
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
