import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Exchanges the confirmation-link code Supabase emails on signup for a
 * session, then sends the now-signed-in creator on to /create. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/create`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=confirmation-failed`);
}
