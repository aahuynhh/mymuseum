import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Museum } from "@/types";

/**
 * File-backed store for user-created museums -- deliberately not a real
 * database (see README "Not implemented"). An earlier in-memory `Map`
 * version didn't work: Next.js compiles the `/api/museums` route handler,
 * `proxy.ts`, and the `/museum/[id]` page into separate server bundles that
 * don't reliably share module-level state at runtime even within one `next
 * start` process, so a museum created via the API was invisible to the page
 * that was supposed to render it. A small JSON file on disk sidesteps that
 * entirely since every route reads/writes the same file. Fine for a
 * prototype's traffic level; not meant to survive a real production load.
 */
const DATA_DIR = path.join(process.cwd(), ".mymuseum-data");
const STORE_FILE = path.join(DATA_DIR, "museums.json");

function readStore(): Record<string, Museum> {
  try {
    if (!existsSync(STORE_FILE)) return {};
    return JSON.parse(readFileSync(STORE_FILE, "utf8")) as Record<string, Museum>;
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, Museum>): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(STORE_FILE, JSON.stringify(data), "utf8");
  } catch {
    // Best-effort: an inaccessible filesystem shouldn't crash the request;
    // the museum just won't persist for this attempt.
  }
}

export function saveMuseum(museum: Museum): void {
  const data = readStore();
  data[museum.id] = museum;
  writeStore(data);
}

export function getStoredMuseum(id: string): Museum | undefined {
  return readStore()[id];
}

export function hasStoredMuseum(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(readStore(), id);
}
