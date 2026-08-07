import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MuseumStyles } from "@/components/landing/MuseumStyles";
import { FeaturedArtist } from "@/components/landing/FeaturedArtist";
import { LinkButton } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export default function Home() {
  return (
    <>
      <SiteHeader heroIntro />
      <main id="main-content" className="flex-1">
        <Hero />
        <HowItWorks />
        <MuseumStyles />
        <FeaturedArtist />
        <section className="mx-auto w-full max-w-6xl px-6 pb-24 sm:pb-32">
          <ScrollReveal className="relative flex flex-col items-center gap-4 overflow-hidden rounded-[1.75rem] bg-ink px-8 py-16 text-center text-surface shadow-warm-lg sm:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 h-72 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/20 blur-3xl"
            />
            <p className="relative flex items-center gap-2 font-display text-sm italic text-surface/70">
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-dusty-red" />
              One last thing
            </p>
            <h2 className="relative text-balance font-display text-3xl sm:text-4xl">
              Ready to build your museum?
            </h2>
            <p className="relative max-w-md text-surface/75">
              Start in the demo museum, customize your avatar, and see what a portfolio can feel
              like when it&apos;s a place instead of a page.
            </p>
            <div className="relative mt-2 flex flex-wrap justify-center gap-4">
              <LinkButton href="/museum/demo-artist" size="lg">
                Enter Demo Museum
              </LinkButton>
              <LinkButton
                href="/avatar"
                variant="secondary"
                size="lg"
                className="!border-dusty-blue/40 !bg-transparent !text-surface hover:!border-dusty-blue hover:!bg-dusty-blue/15"
              >
                Customize Avatar
              </LinkButton>
            </div>
            <Link
              href="/create"
              className="relative mt-1 text-sm font-medium text-surface/70 underline-offset-4 transition-colors hover:text-surface hover:underline"
            >
              Or build your own museum with your own work →
            </Link>
          </ScrollReveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
