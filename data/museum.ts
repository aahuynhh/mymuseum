import type { Museum } from "@/types";
import { DEMO_ARTWORKS } from "./artworks";
import { DEMO_CONNECTORS, DEMO_ROOMS } from "./rooms";

export const DEMO_MUSEUM_ID = "demo-artist";

export const DEMO_MUSEUM: Museum = {
  id: DEMO_MUSEUM_ID,
  ownerId: "alayna-huynh",
  name: "Artlane",
  description:
    "Five small rooms built around a few years of studio work -- paintings about morning light, coastlines, and the rooms we return to.",
  artworks: DEMO_ARTWORKS,
  spawnPoint: { x: 0, y: 0, z: 6 },
  rooms: DEMO_ROOMS,
  openingConnectors: DEMO_CONNECTORS,
};
