import type { Artwork } from "@/types";
import { getRoom } from "./rooms";
import { placeOnWall } from "@/game/museum/placement";

const entranceHall = getRoom("entrance");

// Generated at 1200x900 (see scripts/generate-placeholder-artwork.mjs) --
// every demo piece shares this source aspect ratio.
const DEMO_IMAGE_ASPECT_RATIO = 4 / 3;

// Widened for more dramatic contrast between focal-point pieces and the
// smaller pieces around them, rather than three closely-sized tiers -- a
// real gallery wall mixes scale much more than that. SMALL keeps a portrait
// lean (taller than wide) for compositional variety against the mostly
// landscape MEDIUM piece.
const MEDIUM = { frameWidth: 1.65, frameHeight: 1.25, imageAspectRatio: DEMO_IMAGE_ASPECT_RATIO };
const SMALL = { frameWidth: 0.95, frameHeight: 1.2, imageAspectRatio: DEMO_IMAGE_ASPECT_RATIO };

const mainGallery = getRoom("main-gallery");
const westWing = getRoom("west-alcove");
const eastWing = getRoom("east-alcove");
const farRoom = getRoom("north-gallery");

/**
 * Demo collection for the featured artist, Alayna Huynh (see
 * data/demoArtist.ts). Real paintings, spanning watercolor, oil, gouache,
 * and ink -- selected and placed to keep the room-by-room variety in
 * color, brightness, and composition that the gallery layout was
 * originally designed around.
 */
export const DEMO_ARTWORKS: Artwork[] = [
  {
    id: "the-watcher",
    title: "The Watcher",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Acrylic and resin on carved wood",
    description:
      "A carved side table topped with a hyperrealistic painted eye, its blue iris rendered in swirling brushwork -- part furniture, part unsettling portrait.",
    altText:
      "Photograph of a round wooden side table with a large painted eye on its surface -- blue iris, black pupil, and bloodshot white -- standing on three dark red legs, one carved with a jagged vein-like opening.",
    imageUrl: "/artwork/the-watcher.jpg",
    displayOrder: 1,
    frameWidth: 1.51,
    frameHeight: 2.0,
    imageAspectRatio: 0.753,
    ...placeOnWall(mainGallery, "south", 5.55),
  },
  {
    id: "grape-study",
    title: "Grape Study",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Ink wash on paper",
    description:
      "A loose, tonal study of a grape cluster and its leaves, built entirely from layered gray ink wash rather than line.",
    altText:
      "Monochrome ink wash drawing of a cluster of grapes with two curling leaves, rendered in soft gray tones on white paper.",
    imageUrl: "/artwork/grape-study.jpg",
    displayOrder: 2,
    ...MEDIUM,
    imageAspectRatio: 1.293,
    ...placeOnWall(mainGallery, "west", -4.2),
  },
  {
    id: "self-portrait-charcoal",
    title: "Self-Portrait in Charcoal",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Charcoal on paper",
    description:
      "A close, direct self-portrait built up in soft charcoal layers -- the only figure study in the collection rendered at this scale.",
    altText:
      "Charcoal drawing of a young woman with long dark hair looking directly at the viewer, softly shaded in grayscale with a warm tan wash at the shoulders.",
    imageUrl: "/artwork/self-portrait-charcoal.jpg",
    displayOrder: 3,
    frameWidth: 1.39,
    frameHeight: 2.0,
    imageAspectRatio: 0.693,
    ...placeOnWall(mainGallery, "north", -5.6),
  },
  {
    id: "the-flume",
    title: "The Flume",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Oil on canvas",
    description:
      "A steep granite gorge study, painted looking down through two footbridges toward the whitewater rushing between the rock walls below.",
    altText:
      "Oil painting of a narrow granite gorge with a rushing whitewater stream, two wooden footbridges crossing overhead, and dense green foliage on either side.",
    imageUrl: "/artwork/the-flume.jpg",
    displayOrder: 4,
    ...SMALL,
    imageAspectRatio: 0.753,
    ...placeOnWall(westWing, "south", -12.25),
  },
  {
    id: "the-lily-pond",
    title: "The Lily Pond",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Oil on canvas",
    description:
      "A formal garden study of a stone stairway and flower-topped balustrade overlooking a still lily pond, with a small rowboat waiting at the water's edge.",
    altText:
      "Oil painting of a stone garden staircase flanked by flower-covered urns, overlooking a lily pad-covered pond with a wooden rowboat and blooming trees in the background.",
    imageUrl: "/artwork/the-lily-pond.jpg",
    displayOrder: 5,
    ...SMALL,
    imageAspectRatio: 0.804,
    ...placeOnWall(westWing, "west", (westWing.bounds.minZ + westWing.bounds.maxZ) / 2),
  },
  {
    id: "duckette",
    title: "Duckette",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Watercolor and ink on paper",
    description:
      "A six-panel watercolor comic following Duckette through a sleepless night, a dream, and a rejection -- a small, personal detour from the rest of the collection.",
    altText:
      "Six-panel watercolor comic strip about a duck named Duckette who develops a crush, dreams about it, and gets rejected, illustrated in a soft cartoon style with hand-lettered captions.",
    imageUrl: "/artwork/duckette.jpg",
    displayOrder: 6,
    ...MEDIUM,
    imageAspectRatio: 1.141,
    ...placeOnWall(eastWing, "north", 12.25),
  },
  {
    id: "pixelated-bouquet",
    title: "Pixelated Bouquet",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Oil on canvas",
    description:
      "A bouquet of sunflowers and baby's breath rendered in realist detail, set against a vase reimagined as a field of blocky, pixelated color.",
    altText:
      "Oil painting of yellow sunflowers and small white flowers in a vase, where the vase itself is rendered as a mosaic of small colorful pixel-like squares, against a dark background.",
    imageUrl: "/artwork/pixelated-bouquet.jpg",
    displayOrder: 7,
    ...MEDIUM,
    imageAspectRatio: 0.856,
    ...placeOnWall(farRoom, "east", -10),
  },
  {
    id: "ah-ma",
    title: "Ah Ma",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Charcoal on paper",
    description:
      "A portrait of the artist's grandmother, drawn from a favorite photograph -- quiet and warm, rendered entirely in soft charcoal.",
    altText:
      "Charcoal portrait of an elderly woman with short dark hair, softly lit against a black background, looking gently off to the side.",
    imageUrl: "/artwork/ah-ma.jpg",
    displayOrder: 8,
    frameWidth: 1.18,
    frameHeight: 1.5,
    imageAspectRatio: 0.784,
    ...placeOnWall(farRoom, "west", -10),
  },
  {
    id: "by-the-shore",
    title: "By the Shore",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Graphite and colored pencil on paper",
    description:
      "A close portrait of a young boy in a striped shirt, smiling against a band of blue ocean with the sun breaking through in the corner of the sky.",
    altText:
      "Colored pencil portrait of a smiling young boy with dark hair in a brown-and-white striped shirt, drawn against a backdrop of blue ocean water and a pale sky with the sun glowing in the upper right corner.",
    imageUrl: "/artwork/by-the-shore.jpg",
    displayOrder: 9,
    frameWidth: 1.38,
    frameHeight: 1.6,
    imageAspectRatio: 0.865,
    ...placeOnWall(entranceHall, "west", (entranceHall.bounds.minZ + entranceHall.bounds.maxZ) / 2),
  },
  {
    id: "patchwork-portrait",
    title: "Patchwork Portrait",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Pen and ink on paper",
    description:
      "A woman's face rendered entirely in pen, built from a grid of small hand-drawn patterns -- spirals, crosshatching, dots, waves -- so the portrait reads as both a likeness and a patchwork of individual textures.",
    altText:
      "Black-and-white pen and ink portrait of a woman's face divided into a grid of small squares, each filled with a different hand-drawn pattern such as spirals, stripes, crosshatching, or dots, forming the overall likeness.",
    imageUrl: "/artwork/patchwork-portrait.jpg",
    displayOrder: 10,
    frameWidth: 1.33,
    frameHeight: 1.7,
    imageAspectRatio: 0.779,
    ...placeOnWall(mainGallery, "east", -4.2),
  },
  {
    id: "adrift",
    title: "Adrift",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Acrylic on canvas",
    description:
      "An underwater scene built around a single, unsettling substitution: a goldfish swimming inside a knotted plastic bag instead of a bowl, lit from above and surrounded by a healthy reef of small fish and coral.",
    altText:
      "Painting of a coral reef scene showing a goldfish swimming inside a clear knotted plastic bag suspended in the water, lit by rays of light from above, surrounded by small silver fish, pink coral, and sea plants.",
    imageUrl: "/artwork/adrift.jpg",
    displayOrder: 11,
    frameWidth: 1.7,
    frameHeight: 1.28,
    imageAspectRatio: 1.325,
    ...placeOnWall(mainGallery, "south", -5.55),
  },
  {
    id: "australopithecus-sediba",
    title: "Australopithecus Sediba",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Graphite on paper",
    description:
      "A study of the early hominin species Australopithecus sediba, standing and turning to look back over its shoulder, paired with a separate close study of a single eye.",
    altText:
      "Graphite pencil drawing of a standing hominin figure labeled 'Australopithecus sediba', turning to look over its shoulder, with a separate detailed close-up study of an eye beside it.",
    imageUrl: "/artwork/australopithecus-sediba.jpg",
    displayOrder: 12,
    frameWidth: 1.13,
    frameHeight: 1.5,
    imageAspectRatio: 0.75,
    ...placeOnWall(eastWing, "south", 12.25),
  },
  {
    id: "evening-on-the-pond",
    title: "Evening on the Pond",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Gouache on paper",
    description:
      "A quiet dusk view across a pond, Canada geese scattered across the still water, tall reeds and pink wildflowers framing the foreground beneath a heavy, clouded sky.",
    altText:
      "Painting of a calm pond at dusk under a cloudy blue sky, with several Canada geese swimming on the water, tall green reeds and pink wildflowers in the foreground, and a tree line along the far shore.",
    imageUrl: "/artwork/evening-on-the-pond.jpg",
    displayOrder: 13,
    frameWidth: 1.02,
    frameHeight: 1.4,
    imageAspectRatio: 0.725,
    ...placeOnWall(farRoom, "north", -3.5),
  },
  {
    id: "garden-pergola",
    title: "Garden Pergola",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Graphite on paper",
    description:
      "A garden terrace study looking through a brick-walled stairway toward a wooden pergola, drawn entirely in pencil with dense, textured foliage crowding in on every side.",
    altText:
      "Graphite pencil drawing of a garden terrace with a wooden armchair, brick planter walls, a short flight of steps, and a curved wooden pergola in the background, surrounded by dense trees and shrubs.",
    imageUrl: "/artwork/garden-pergola.jpg",
    displayOrder: 14,
    frameWidth: 1.6,
    frameHeight: 1.15,
    imageAspectRatio: 1.39,
    ...placeOnWall(farRoom, "north", 3.5),
  },
  {
    id: "autumn-still-life",
    title: "Autumn Still Life",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Watercolor on paper",
    description:
      "A tabletop still life of a tall glass wine bottle, a small cordial glass, two miniature pumpkins, and a deep red apple, set against a mottled sage-green wash.",
    altText:
      "Watercolor still life painting of a tall clear glass wine bottle half filled with liquid, a small stemmed glass, two small orange pumpkins, and a red apple, arranged on a table against a soft green background.",
    imageUrl: "/artwork/autumn-still-life.jpg",
    displayOrder: 15,
    frameWidth: 0.97,
    frameHeight: 1.3,
    imageAspectRatio: 0.746,
    ...placeOnWall(westWing, "north", -12.25),
  },
];

export function getArtworkByOrder(order: number): Artwork | undefined {
  return DEMO_ARTWORKS.find((artwork) => artwork.displayOrder === order);
}
