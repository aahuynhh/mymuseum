"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionResult {
  error?: string;
}

/** Creates the account. With email confirmation required, this does not
 * sign the user in -- the caller shows a "check your email" state. */
export async function signUp(email: string, password: string): Promise<AuthActionResult> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: error.message };
  return {};
}

/** Signs an existing, confirmed user in. Redirects to /create on success,
 * the one route this phase actually gates on being signed in. */
export async function signIn(email: string, password: string): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/create");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
