"use client";

import type { Player } from "@/types";
import type { RemoteTransformMap } from "@/hooks/useMultiplayer";
import { RemoteAvatar } from "./RemoteAvatar";

export function MultiplayerAvatars({
  roster,
  transforms,
}: {
  roster: Player[];
  transforms: RemoteTransformMap;
}) {
  return (
    <>
      {roster.map((player) => (
        <RemoteAvatar key={player.id} player={player} transforms={transforms} />
      ))}
    </>
  );
}
