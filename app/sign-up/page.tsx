import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthGallerySceneLoader } from "@/components/auth/AuthGallerySceneLoader";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Sign up to create and own your own MyMuseum gallery.",
};

export default function SignUpPage() {
  return (
    <>
      <AuthHeader mode="sign-up" />
      <main id="main-content" className="flex-1">
        {/* A single two-item grid: grid-cols-1 stacks visual-then-form on
            mobile (matching document order, so no `order-*` juggling is
            needed), lg:grid-cols-2 sets them side by side. Only one
            AuthGallerySceneLoader ever mounts either way -- duplicating it
            for separate mobile/desktop layouts would open two WebGL
            contexts for one visible scene. */}
        <div className="grid grid-cols-1 lg:min-h-[calc(100dvh-73px)] lg:grid-cols-2">
          <div className="relative h-56 overflow-hidden bg-[#1a2436] sm:h-72 lg:h-full">
            <AuthGallerySceneLoader />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent px-6 py-5"
            />
            <p className="pointer-events-none absolute inset-x-0 bottom-6 px-6 font-display text-sm italic text-surface/90">
              Your museum starts here.
            </p>
          </div>

          <div className="flex items-center justify-center px-6 py-10 sm:py-14 lg:px-16">
            <div className="w-full max-w-sm">
              <p className="flex items-center gap-2 font-display text-sm italic text-terracotta-dark">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
                Join MyMuseum
              </p>
              <h1 className="mt-2 font-heading text-3xl text-ink">Create your account</h1>
              <p className="mt-3 text-ink-muted">
                Build a museum for your work, customize your character, and explore galleries with
                others.
              </p>

              <div className="mt-8">
                <SignUpForm />
              </div>

              <p className="mt-6 text-center text-sm text-ink-muted">
                Already have an account?{" "}
                <Link href="/sign-in" className="font-medium text-ink underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
