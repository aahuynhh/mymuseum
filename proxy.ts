import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_MUSEUM_ID } from "@/data/museum";
import { DEMO_ARTIST } from "@/data/demoArtist";
import { hasStoredMuseum } from "@/server/museumStore";

/**
 * Streaming responses in this Next.js version can't change their HTTP status
 * once the body starts streaming, so calling `notFound()` from inside an
 * async page (after `await params`) renders the right UI but still returns
 * 200 (see Next's `loading.md` "Status codes" note). So Proxy checks
 * `/museum/:id` and `/artist/:username` slugs before any rendering starts
 * and rewrites unknown ones to a path that doesn't exist -- letting Next's
 * own filesystem 404 (real `404` status) handle it. Museum slugs are
 * checked against the demo id plus the in-memory store of user-created
 * museums (shared with the `/api/museums` route and the museum page within
 * this same process).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const museumMatch = pathname.match(/^\/museum\/([^/]+)\/?$/);
  if (museumMatch) {
    const museumId = decodeURIComponent(museumMatch[1]);
    if (museumId !== DEMO_MUSEUM_ID && !hasStoredMuseum(museumId)) {
      return NextResponse.rewrite(new URL("/not-a-real-museum-route", request.url));
    }
  }

  const artistMatch = pathname.match(/^\/artist\/([^/]+)\/?$/);
  if (artistMatch && decodeURIComponent(artistMatch[1]) !== DEMO_ARTIST.username) {
    return NextResponse.rewrite(new URL("/not-a-real-artist-route", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/museum/:path*", "/artist/:path*"],
};
