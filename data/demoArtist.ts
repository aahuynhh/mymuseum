import type { ArtistProfile, AvatarConfiguration } from "@/types";
import { DEMO_MUSEUM_ID } from "./museum";

export const DEMO_ARTIST: ArtistProfile = {
  id: "alayna-huynh",
  username: "alayna-huynh",
  displayName: "Alayna Huynh",
  bio: "Alayna paints quiet, sunlit interiors and coastal studies exploring color memory and the architecture of light. She works primarily in oil and gouache, and has spent the past four years building a body of work about the rooms and shorelines we return to.",
  disciplines: ["Painting", "Gouache", "Mixed Media"],
  museumId: DEMO_MUSEUM_ID,
};

export const DEMO_ARTIST_AVATAR: AvatarConfiguration = {
  skinTone: "honey",
  hairStyle: "twin-buns",
  hairColor: "chestnut",
  top: "sunset-sweater",
  bottom: "denim-skirt",
  shoes: "garden-boots",
  accessory: "tote-bag",
};
