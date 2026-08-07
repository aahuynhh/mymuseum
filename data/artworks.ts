import type { Artwork } from "@/types";
import { getRoom } from "./rooms";
import { placeOnWall } from "@/game/museum/placement";

// Generated at 1200x900 (see scripts/generate-placeholder-artwork.mjs) --
// every demo piece shares this source aspect ratio.
const DEMO_IMAGE_ASPECT_RATIO = 4 / 3;

// Widened for more dramatic contrast between focal-point pieces and the
// smaller pieces around them, rather than three closely-sized tiers -- a
// real gallery wall mixes scale much more than that. SMALL keeps a portrait
// lean (taller than wide) for compositional variety against the mostly
// landscape MEDIUM/LARGE pieces.
const LARGE = { frameWidth: 2.7, frameHeight: 1.85, imageAspectRatio: DEMO_IMAGE_ASPECT_RATIO };
const MEDIUM = { frameWidth: 1.65, frameHeight: 1.25, imageAspectRatio: DEMO_IMAGE_ASPECT_RATIO };
const SMALL = { frameWidth: 0.95, frameHeight: 1.2, imageAspectRatio: DEMO_IMAGE_ASPECT_RATIO };

const entrance = getRoom("entrance");
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
    id: "autumn-still-life",
    title: "Autumn Still Life",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Watercolor on paper",
    description:
      "A quiet tabletop study built around a half-full bottle, a single shot glass, and a small huddle of pumpkins and an apple.",
    altText:
      "Watercolor still life of a glass bottle, a small shot glass, two pumpkins, and an apple against a soft green wash background.",
    imageUrl: "/artwork/autumn-still-life.jpg",
    displayOrder: 1,
    ...SMALL,
    imageAspectRatio: 0.746,
    ...placeOnWall(entrance, "west", (entrance.bounds.minZ + entrance.bounds.maxZ) / 2),
  },
  {
    id: "evening-on-the-pond",
    title: "Evening on the Pond",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Gouache on paper",
    description:
      "A dusk-lit pond study, painted from the reeds looking out at a small flock of geese drifting across still water.",
    altText:
      "Painting of Canada geese swimming on a calm blue-violet pond at dusk, framed by tall grasses and pink wildflowers in the foreground.",
    imageUrl: "/artwork/evening-on-the-pond.jpg",
    displayOrder: 2,
    ...SMALL,
    imageAspectRatio: 0.725,
    ...placeOnWall(entrance, "east", (entrance.bounds.minZ + entrance.bounds.maxZ) / 2),
  },
  {
    id: "adrift",
    title: "Adrift",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Oil on canvas",
    description:
      "A goldfish circles inside a knotted plastic bag, suspended in open water as sunlight breaks through from above -- the largest and most pointed piece in the collection.",
    altText:
      "Oil painting of a goldfish swimming inside a clear plastic bag underwater, surrounded by coral, seaweed, and small fish, with sunbeams streaming down from the surface.",
    imageUrl: "/artwork/adrift.jpg",
    displayOrder: 3,
    ...LARGE,
    imageAspectRatio: 1.325,
    ...placeOnWall(mainGallery, "south", -5.55),
  },
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
    displayOrder: 4,
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
    displayOrder: 5,
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
    displayOrder: 6,
    frameWidth: 1.39,
    frameHeight: 2.0,
    imageAspectRatio: 0.693,
    ...placeOnWall(mainGallery, "north", -5.6),
  },
  {
    id: "patchwork-portrait",
    title: "Patchwork Self-Portrait",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Pen and ink on paper",
    description:
      "A self-portrait built from a grid of hand-drawn textures and patterns -- each square its own small study, together resolving into a face.",
    altText:
      "Pen and ink self-portrait of a young woman divided into a grid, where each square is filled with a different hand-drawn pattern or texture, from crosshatching to spirals to waves.",
    imageUrl: "/artwork/patchwork-portrait.jpg",
    displayOrder: 7,
    frameWidth: 1.17,
    frameHeight: 1.5,
    imageAspectRatio: 0.779,
    ...placeOnWall(mainGallery, "north", 5.6),
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
    displayOrder: 8,
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
    displayOrder: 9,
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
    displayOrder: 10,
    ...MEDIUM,
    imageAspectRatio: 1.141,
    ...placeOnWall(eastWing, "north", 12.25),
  },
  {
    id: "garden-pergola",
    title: "Garden Pergola",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Graphite on paper",
    description:
      "A quiet garden study of a stone terrace, wooden bench, and pergola glimpsed through overgrown hedges.",
    altText:
      "Graphite pencil drawing of a garden terrace with a wooden armchair, brick balustrade, stairs, and a pergola framed by dense trees and shrubs.",
    imageUrl: "/artwork/garden-pergola.jpg",
    displayOrder: 11,
    ...MEDIUM,
    imageAspectRatio: 1.389,
    ...placeOnWall(eastWing, "east", (eastWing.bounds.minZ + eastWing.bounds.maxZ) / 2),
  },
  {
    id: "australopithecus-sediba",
    title: "Australopithecus Sediba",
    artist: "Alayna Huynh",
    year: 2025,
    medium: "Graphite on paper",
    description:
      "A paleoanthropology field study, pairing a full standing reconstruction with a detailed study of the eye, drawn from museum reference material.",
    altText:
      "Graphite pencil drawing of a standing Australopithecus sediba reconstruction alongside a detailed close-up study of an eye, labeled 'Australopithecus sediba' in hand lettering.",
    imageUrl: "/artwork/australopithecus-sediba.jpg",
    displayOrder: 12,
    frameWidth: 1.5,
    frameHeight: 2.0,
    imageAspectRatio: 0.75,
    ...placeOnWall(farRoom, "north", 0),
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
    displayOrder: 13,
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
    displayOrder: 14,
    frameWidth: 1.18,
    frameHeight: 1.5,
    imageAspectRatio: 0.784,
    ...placeOnWall(farRoom, "west", -10),
  },
];

export function getArtworkByOrder(order: number): Artwork | undefined {
  return DEMO_ARTWORKS.find((artwork) => artwork.displayOrder === order);
}
