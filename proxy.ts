import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_MUSEUM_ID } from "@/data/museum";
import { DEMO_ARTIST } from "@/data/demoArtist";
import { hasMuseum } from "@/server/museumsRepository";
import { refreshSession } from "@/lib/supabase/middleware";

/**
 * Streaming responses in this Next.js version can't change their HTTP status
 * once the body starts streaming, so calling `notFound()` from inside an
 * async page (after `await params`) renders the right UI but still returns
 * 200 (see Next's `loading.md` "Status codes" note). So Proxy checks
 * `/museum/:id` and `/artist/:username` slugs before any rendering starts
 * and rewrites unknown ones to a path that doesn't exist -- letting Next's
 * own filesystem 404 (real `404` status) handle it. Museum slugs are
 * checked against the demo id plus the Postgres `museums` table (shared
 * with the `/api/museums` route and the museum page).
 *
 * Proxy also refreshes the Supabase auth session cookie on (almost) every
 * request -- see `config.matcher` below -- which is what keeps a creator's
 * signed-in state valid across page loads without any client-side polling.
 */
export async function proxy(request: NextRequest) {
  const { cookiesToSet, headersToSet } = await refreshSession(request);
  const { pathname } = request.nextUrl;

  let response: NextResponse | null = null;

  const museumMatch = pathname.match(/^\/museum\/([^/]+)\/?$/);
  if (museumMatch) {
    const museumId = decodeURIComponent(museumMatch[1]);
    if (museumId !== DEMO_MUSEUM_ID && !(await hasMuseum(museumId))) {
      response = NextResponse.rewrite(new URL("/not-a-real-museum-route", request.url));
    }
  }

  if (!response) {
    const artistMatch = pathname.match(/^\/artist\/([^/]+)\/?$/);
    if (artistMatch && decodeURIComponent(artistMatch[1]) !== DEMO_ARTIST.username) {
      response = NextResponse.rewrite(new URL("/not-a-real-artist-route", request.url));
    }
  }

  if (!response) response = NextResponse.next();

  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options);
  }
  for (const [key, value] of Object.entries(headersToSet)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  // Runs on everything except static assets/images, so the Supabase auth
  // cookie stays fresh across the whole site (needed by /create's
  // sign-in gate and the header's logged-in state), not just the two
  // route groups that need the 404-rewrite check above.
  matcher: ["/((?!_next/static|_next/image|favicon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
