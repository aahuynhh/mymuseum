import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and
 * Server Actions -- authenticated as whichever user's session cookie is on
 * the current request (or unauthenticated/"anon" if there isn't one). All
 * museum writes go through this client, never a service-role client, so
 * Postgres RLS (owner_id = auth.uid()) is the actual enforcement boundary.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component that can't set cookies (no
            // response object available) -- fine as long as proxy.ts also
            // refreshes the session, which keeps cookies in sync anyway.
          }
        },
      },
    }
  );
}

/**
 * Reads the current authenticated user, if any. Uses `getUser()` (not
 * `getSession()`) because it revalidates the JWT against Supabase Auth
 * rather than trusting the cookie's contents as-is.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
