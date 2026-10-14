import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionEnvironment } from "@/components/ui/SectionEnvironment";

/**
 * The final wall of the gallery, not a marketing CTA banner -- this is the
 * room's floor, not its wall: CommunityMuseums above stays gallery-blue, and
 * this section is gallery-floor brown, with a gold trim strip (matching the
 * in-game "Museum Blue" room theme, game/museum/themes.ts) as the seam where
 * the wall above meets the floor.
 */
export function FinalCta() {
  return (
    <SectionEnvironment tone="floor" boundary={false} bottomBoundary className="pb-10 sm:pb-14">
      <div
        aria-hidden="true"
        className="h-[3px] w-screen ml-[calc(50%-50vw)] bg-gallery-trim shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.25)]"
      />
      <ScrollReveal className="relative mx-auto mt-10 flex max-w-md flex-col items-center text-center sm:mt-14">
        <h2 className="text-balance font-heading text-3xl text-surface sm:text-4xl">
          Ready to build your museum?
        </h2>
        <p className="mt-3 max-w-xs text-surface/75">
          Create a space for your work and invite others inside.
        </p>

        <LinkButton
          href="/create"
          size="lg"
          className="mt-6 !bg-surface !text-gallery-floor hover:!bg-surface/90"
        >
          Create My Museum →
        </LinkButton>

        <div className="mt-5 flex items-center gap-4 text-sm text-surface/60">
          <Link href="/explore" className="transition-colors duration-200 hover:text-surface">
            Explore museums
          </Link>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-surface/30" />
          <Link href="/avatar" className="transition-colors duration-200 hover:text-surface">
            Customize avatar
          </Link>
        </div>
      </ScrollReveal>
    </SectionEnvironment>
  );
}
