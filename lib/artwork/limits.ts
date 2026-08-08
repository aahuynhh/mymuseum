/**
 * Upload limits shared by the client form, the multipart parser, and the
 * validation layer. server.mjs also enforces MAX_TOTAL_REQUEST_BYTES as a
 * cheap Content-Length fast path before Next.js even runs -- it can't
 * import this file directly (it's loaded outside the Next build), so its
 * copy of the number is kept in sync by hand; see the comment there.
 */

export const MAX_ARTWORKS_PER_MUSEUM = 10;

/** Hard cap on a single image's real byte size, enforced server-side against
 * actual received bytes -- never against a client-declared size or the
 * Content-Length header alone. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

/** Hard cap on the whole multipart request body. */
export const MAX_TOTAL_REQUEST_BYTES = 60 * 1024 * 1024; // 60 MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
