import type { Museum } from "@/types";
import { DEMO_ARTWORKS } from "./artworks";
import { DEMO_CONNECTORS, DEMO_ROOMS } from "./rooms";

export const DEMO_MUSEUM_ID = "demo-artist";

/**
 * The real, signed-up account Artlane is attributed to on public
 * profile-driven surfaces (/artist/[username], /explore, /explore/artists)
 * -- set once by hand, keyed by the account's stable user id rather than
 * its username (which is user-editable, see ProfileEditor) since Artlane
 * is static seed data with no real `owner_id` column to join against. If
 * this id doesn't resolve to a real profile row, Artlane simply doesn't
 * appear on any of those surfaces -- see server/creatorsRepository.ts.
 */
export const DEMO_MUSEUM_OWNER_ID = "db0fa346-6880-45be-9dad-9211c389ebb9";

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
