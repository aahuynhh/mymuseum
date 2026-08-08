import "server-only";
import Busboy from "busboy";
import { Readable } from "node:stream";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import { MAX_ARTWORKS_PER_MUSEUM, MAX_IMAGE_BYTES, MAX_TOTAL_REQUEST_BYTES } from "./limits";

/**
 * Thrown when the request (or one file within it) exceeds the configured
 * limits. Kept distinct from a generic parse error so the route handler can
 * map it to a 413 instead of a 400.
 */
export class PayloadTooLargeError extends Error {}

export interface ParsedFile {
  fieldName: string;
  filename: string;
  /** Client-declared MIME type -- a hint only. Never trusted for security;
   * lib/artwork/validateImage.ts re-derives the real type from the bytes. */
  declaredMimeType: string;
  buffer: Buffer;
}

export interface ParsedUploadRequest {
  fields: Record<string, string>;
  files: ParsedFile[];
}

/**
 * Streams a multipart/form-data request body through busboy so an
 * oversized payload is rejected as bytes arrive, not after the whole body
 * has already been buffered into memory. request.formData() would do the
 * latter -- fine for a well-behaved client, but it defeats the point of a
 * size limit against an adversarial one, since the memory cost is already
 * paid before any check can run. The Content-Length checks elsewhere
 * (server.mjs, this route's own early check) are cheap, spoofable fast
 * paths; this is the real enforcement boundary.
 */
export function parseUploadRequest(request: Request): Promise<ParsedUploadRequest> {
  return new Promise((resolve, reject) => {
    const contentType = request.headers.get("content-type") || "";
    if (!request.body) {
      reject(new Error("Empty request body."));
      return;
    }

    const busboy = Busboy({
      headers: { "content-type": contentType },
      limits: {
        fileSize: MAX_IMAGE_BYTES,
        files: MAX_ARTWORKS_PER_MUSEUM,
        fields: 5,
        fieldSize: 20_000,
      },
    });

    const fields: Record<string, string> = {};
    const files: ParsedFile[] = [];
    let totalBytes = 0;
    let settled = false;

    function fail(err: Error) {
      if (settled) return;
      settled = true;
      busboy.removeAllListeners();
      busboy.destroy();
      reject(err);
    }

    function succeed() {
      if (settled) return;
      settled = true;
      resolve({ fields, files });
    }

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (name, stream, info) => {
      const chunks: Buffer[] = [];
      let fileBytes = 0;
      let tooLarge = false;

      stream.on("data", (chunk: Buffer) => {
        fileBytes += chunk.length;
        totalBytes += chunk.length;
        if (fileBytes > MAX_IMAGE_BYTES || totalBytes > MAX_TOTAL_REQUEST_BYTES) {
          // Stop keeping bytes for a file that's already over budget, but
          // keep draining the stream so busboy can finish tearing down
          // cleanly -- the request is failed below once the stream closes.
          tooLarge = true;
          return;
        }
        chunks.push(chunk);
      });

      stream.on("limit", () => {
        tooLarge = true;
      });

      stream.on("close", () => {
        if (tooLarge) {
          fail(new PayloadTooLargeError("One or more images exceed the allowed size."));
          return;
        }
        files.push({
          fieldName: name,
          filename: info.filename,
          declaredMimeType: info.mimeType,
          buffer: Buffer.concat(chunks),
        });
      });
    });

    busboy.on("filesLimit", () => {
      fail(
        new PayloadTooLargeError(
          `This prototype supports up to ${MAX_ARTWORKS_PER_MUSEUM} artworks per museum.`
        )
      );
    });

    busboy.on("error", (err) => fail(err instanceof Error ? err : new Error(String(err))));
    busboy.on("close", () => succeed());

    Readable.fromWeb(request.body as NodeWebReadableStream<Uint8Array>).pipe(busboy);
  });
}
