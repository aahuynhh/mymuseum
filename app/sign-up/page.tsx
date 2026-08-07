import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Sign up to create and own your own MyMuseum gallery.",
};

export default function SignUpPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-md flex-1 px-6 py-12 sm:py-16">
        <header className="mb-10">
          <p className="font-display text-sm italic text-terracotta-dark">Create My Museum</p>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Create an account</h1>
          <p className="mt-3 text-ink-muted">
            An account lets you build and own a museum that stays yours.
          </p>
        </header>
        <SignUpForm />
        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-ink underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
