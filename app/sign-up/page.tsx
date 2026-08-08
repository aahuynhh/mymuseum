import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { PageHeader } from "@/components/ui/PageHeader";
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
        <PageHeader
          eyebrow="New account"
          title="Create an account"
          description="An account lets you build and own a museum that stays yours."
        />
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
