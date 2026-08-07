import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

interface SessionRefreshResult {
  cookiesToSet: CookieToSet[];
  headersToSet: Record<string, string>;
}

/**
 * Refreshes the Supabase auth session for the current request and reports
 * back what the caller (`proxy.ts`) needs to apply to whichever
 * NextResponse it ends up returning (`.next()` or `.rewrite()`), so the
 * refreshed session cookie survives regardless of which branch runs.
 */
export async function refreshSession(request: NextRequest): Promise<SessionRefreshResult> {
  const cookiesToSet: CookieToSet[] = [];
  let headersToSet: Record<string, string> = {};

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(setCookies, headers) {
          cookiesToSet.push(...setCookies);
          headersToSet = headers;
        },
      },
    }
  );

  // Revalidates the JWT and refreshes it if expired -- required so Server
  // Components later in the same request see an up-to-date session.
  await supabase.auth.getUser();

  return { cookiesToSet, headersToSet };
}
