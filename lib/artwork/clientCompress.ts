"use client";

/** Client-side resize/re-encode shared by the create flow
 * (components/create/CreateMuseumForm.tsx) and the Phase 3 add-artwork flow
 * (components/dashboard/edit/AddArtworkForm.tsx). Purely a bandwidth/UX
 * optimization -- the server (sharp, see lib/artwork/validateImage.ts)
 * re-derives real type/dimensions from the bytes it actually receives and is
 * the only trusted source for either. */

const MAX_IMAGE_DIMENSION = 1200;
const JPEG_QUALITY = 0.82;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't encode image"))),
      type,
      quality
    );
  });
}

export async function compressImage(
  file: File
): Promise<{ blob: Blob; imageAspectRatio: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const imageAspectRatio = bitmap.width / bitmap.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
  return { blob, imageAspectRatio };
}
