import "server-only";
import sharp from "sharp";

/**
 * Server-side image validation. This is the authority on "is this actually
 * an image, what type is it, and how big is it" -- sharp parses the real
 * bytes (magic-byte-based format detection under the hood), so a client's
 * declared Content-Type/filename extension is never trusted for anything
 * security-relevant. Client-side compression (components/create/
 * CreateMuseumForm.tsx) stays a bandwidth/UX nicety only.
 */

export class ImageValidationError extends Error {}

const CONTENT_TYPE_BY_FORMAT: Record<string, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

// sharp's own detected format names -> the extension we store the object
// under. jpg/jpeg both map to a single canonical extension.
const EXTENSION_BY_FORMAT: Record<string, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
  gif: "gif",
};

export interface ValidatedImage {
  buffer: Buffer;
  width: number;
  height: number;
  extension: string;
  contentType: string;
}

export async function validateImage(buffer: Buffer): Promise<ValidatedImage> {
  const metadata = await sharp(buffer)
    .metadata()
    .catch(() => {
      throw new ImageValidationError("Not a valid image file.");
    });

  const format = metadata.format;
  if (!format || !(format in EXTENSION_BY_FORMAT)) {
    throw new ImageValidationError(
      "Unsupported image type. Use PNG, JPEG, WebP, or GIF."
    );
  }
  if (!metadata.width || !metadata.height) {
    throw new ImageValidationError("Couldn't read this image's dimensions.");
  }

  return {
    buffer,
    width: metadata.width,
    height: metadata.height,
    extension: EXTENSION_BY_FORMAT[format],
    contentType: CONTENT_TYPE_BY_FORMAT[format],
  };
}
