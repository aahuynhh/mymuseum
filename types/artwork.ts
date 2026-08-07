export interface WallPosition {
  /** Position of the artwork's frame center in world space */
  x: number;
  y: number;
  z: number;
  /** Y-axis rotation in radians, so the frame faces into the room */
  rotationY: number;
}

export interface InteractionZone {
  /** Center of the invisible trigger volume, usually offset in front of the frame */
  x: number;
  z: number;
  /** Radius in world units within which the "Press E to view" prompt appears */
  radius: number;
}

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  year: number;
  medium: string;
  description: string;
  /** Required accessible description used for alt text and screen readers */
  altText: string;
  imageUrl: string;
  /** 1-indexed position in the sequential portfolio order */
  displayOrder: number;
  wallPosition: WallPosition;
  interactionZone: InteractionZone;
  /** Frame size in world units. Varying these across a collection gives the
   * wall real visual rhythm instead of a row of identical frames. */
  frameWidth?: number;
  frameHeight?: number;
  /** Source image width / height. Used to "contain-fit" the image within its
   * frame's mat opening so uploaded artwork is scaled, never stretched or
   * cropped, to fit the frame. */
  imageAspectRatio?: number;
}
