import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { PageHeader } from "@/components/ui/PageHeader";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your MyMuseum account.",
};

export default function SignInPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-md flex-1 px-6 py-12 sm:py-16">
        <PageHeader eyebrow="Welcome back" title="Sign in" />
        <SignInForm />
        <p className="mt-6 text-center text-sm text-ink-muted">
          Need an account?{" "}
          <Link href="/sign-up" className="font-medium text-ink underline underline-offset-4">
            Create one
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
