import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthGallerySceneLoader } from "@/components/auth/AuthGallerySceneLoader";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your MyMuseum account.",
};

export default function SignInPage() {
  return (
    <>
      <AuthHeader mode="sign-in" />
      <main id="main-content" className="flex-1">
        <div className="grid grid-cols-1 lg:min-h-[calc(100dvh-73px)] lg:grid-cols-2">
          <div className="relative h-56 overflow-hidden bg-[#1a2436] sm:h-72 lg:h-full">
            <AuthGallerySceneLoader />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent px-6 py-5"
            />
            <p className="pointer-events-none absolute inset-x-0 bottom-6 px-6 font-display text-sm italic text-surface/90">
              Right where you left it.
            </p>
          </div>

          <div className="flex items-center justify-center px-6 py-10 sm:py-14 lg:px-16">
            <div className="w-full max-w-sm">
              <p className="flex items-center gap-2 font-display text-sm italic text-terracotta-dark">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
                Welcome back
              </p>
              <h1 className="mt-2 font-heading text-3xl text-ink">Sign in</h1>
              <p className="mt-3 text-ink-muted">
                Step back into your museum, and see who&apos;s exploring it with you.
              </p>

              <div className="mt-8">
                <SignInForm />
              </div>

              <p className="mt-6 text-center text-sm text-ink-muted">
                Need an account?{" "}
                <Link href="/sign-up" className="font-medium text-ink underline underline-offset-4">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
