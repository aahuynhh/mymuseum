import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionEnvironment } from "@/components/ui/SectionEnvironment";
import { Plaque } from "@/components/ui/Plaque";
import { SectionIntro } from "@/components/landing/SectionIntro";
import { StepsIcon } from "@/components/ui/PageIcons";
import { AvatarHeadshot } from "@/components/avatar/AvatarHeadshot";
import { GALLERY_THEMES } from "@/game/museum/themes";
import type { AvatarConfiguration } from "@/types";
import { DEFAULT_AVATAR_CONFIGURATION } from "@/types/avatar";

// A second, visibly different config purely so the "together" preview reads
// as two distinct people rather than one avatar duplicated -- not tied to
// any real account.
const SECOND_AVATAR_CONFIGURATION: AvatarConfiguration = {
  bodyShape: "capsule",
  skinTone: "sky",
  hairStyle: "sprout",
  hairColor: "flax",
  top: "linen-shirt",
  bottom: "denim-skirt",
  shoes: "gallery-loafers",
  accessory: "square-glasses",
  expression: "happy",
};

/**
 * The same thin gold-on-navy frame ExhibitionWallPiece uses for real
 * museum artwork on the homepage's gallery wall -- reused here so these
 * step previews read as "a photo from inside the product" rather than an
 * illustrated icon in a rounded SaaS-card badge.
 */
function StepFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-[3px] border border-antique-gold/35 bg-[#0f2a41] shadow-warm-xs">
      {children}
    </div>
  );
}

/** A real GALLERY_THEME wall with a real artwork image framed on it -- the
 * same wall/rail construction RoomPreview uses for the Room Styles section
 * below, at a scale where it reads as a snapshot of a room rather than a
 * swatch. */
function BuildMuseumPreview() {
  const theme = GALLERY_THEMES["museum-blue"];
  return (
    <StepFrame>
      <div aria-hidden="true" className="absolute inset-0" style={{ backgroundColor: theme.wallColor }}>
        <div
          className="absolute inset-x-0 opacity-70"
          style={{ top: "24%", height: 1, backgroundColor: theme.railColor }}
        />
        <div
          className="absolute left-1/2 top-[45%] h-[64%] w-[38%] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
          style={{ border: `2px solid ${theme.trimColor}` }}
        >
          <img src="/artwork/the-lily-pond.jpg" alt="" className="h-full w-full object-cover" />
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[18%]"
        style={{ backgroundColor: theme.floorColor }}
      />
    </StepFrame>
  );
}

/** The real AvatarModel/AvatarHeadshot renderer -- the actual avatar a
 * visitor builds in the editor, standing on a real room wall, not a person
 * icon. */
function AvatarStepPreview() {
  const theme = GALLERY_THEMES.linen;
  return (
    <StepFrame>
      <div aria-hidden="true" className="absolute inset-0" style={{ backgroundColor: theme.wallColor }} />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[22%]"
        style={{ backgroundColor: theme.floorColor }}
      />
      <div className="absolute inset-0 flex items-center justify-center pb-2">
        <AvatarHeadshot config={DEFAULT_AVATAR_CONFIGURATION} className="h-16 w-16 shadow-none" />
      </div>
    </StepFrame>
  );
}

/** A second real avatar plus the same "N live" pill used on the actual
 * museum listings above (ExhibitionWallPiece) -- shared presence shown with
 * the product's own live-visitor affordance, not an invented icon. */
function TogetherStepPreview() {
  const theme = GALLERY_THEMES.sage;
  return (
    <StepFrame>
      <div aria-hidden="true" className="absolute inset-0" style={{ backgroundColor: theme.wallColor }} />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[26%]"
        style={{ backgroundColor: theme.floorColor }}
      />
      <div className="absolute inset-x-0 bottom-1.5 flex items-end justify-center gap-2">
        <AvatarHeadshot config={DEFAULT_AVATAR_CONFIGURATION} className="h-11 w-11 shadow-none" />
        <AvatarHeadshot config={SECOND_AVATAR_CONFIGURATION} className="h-11 w-11 shadow-none" />
      </div>
      <span
        aria-hidden="true"
        className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-canvas/95 px-2 py-1 text-[10px] font-medium text-ink shadow-warm-xs"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-sage" />2 live
      </span>
    </StepFrame>
  );
}

const STEPS = [
  {
    Preview: BuildMuseumPreview,
    title: "Build your museum",
    description:
      "Your work is arranged on the walls of a room designed around it -- framed, labeled, and lit like a real gallery.",
  },
  {
    Preview: AvatarStepPreview,
    title: "Customize your avatar",
    description:
      "Pick a skin tone, hairstyle, and outfit. It's the same friendly face that represents you everywhere in MyMuseum.",
  },
  {
    Preview: TogetherStepPreview,
    title: "Share and explore together",
    description:
      "Send one link. Visitors walk in as their own avatar, browse at their own pace, and see who else is there.",
  },
] as const;

export function HowItWorks() {
  return (
    <SectionEnvironment tone="cream" id="hero-boundary" className="py-20 sm:py-28">
      <ScrollReveal>
        <SectionIntro
          icon={<StepsIcon />}
          accent="dustyBlue"
          title="A portfolio you can walk through"
          description="MyMuseum turns a portfolio into a place. Three stations take you from a folder of work to a shared, walkable gallery."
        />
      </ScrollReveal>

      <ol className="relative mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8">
        {/* Connecting path across the three stations, sitting behind the
            thumbnails -- centered on the thumbnail's own height (h-24), not
            on any numeral, now that sequence reads from the 1/2/3 corner
            badge and the left-to-right layout instead. */}
        <span
          aria-hidden="true"
          className="rule-dotted absolute inset-x-0 top-12 z-0 hidden sm:block"
        />
        {STEPS.map((step, index) => {
          const Preview = step.Preview;
          return (
            <li key={step.title} className="relative z-10">
              <ScrollReveal delay={index * 0.12} className="flex flex-col gap-5">
                <Preview />
                {/* A small reference-number tag pinned to the card's corner,
                    like an exhibit catalog number -- replaces the old
                    oversized background numeral so sequence is still legible
                    without competing with the thumbnail above. */}
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-3 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-antique-gold/40 bg-surface font-heading text-base text-ink-muted shadow-warm-xs"
                  >
                    {index + 1}
                  </span>
                  <Plaque title={step.title} subtitle={step.description} />
                </div>
              </ScrollReveal>
            </li>
          );
        })}
      </ol>

      <ScrollReveal delay={0.15} className="mt-16 border-t border-border/70">
        <div className="flex flex-col gap-6 bg-canvas-deep p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h3 className="font-heading text-xl text-ink">Museums are shared, not solo</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
              Every museum is a live room. When a friend, classmate, or recruiter opens the same
              link, you&apos;ll see their avatar walk in, move around, and stop to look at the
              same pieces -- no chat, no clutter, just presence.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-medium text-ink shadow-warm-xs">
            <span className="h-2 w-2 rounded-full bg-sage" aria-hidden="true" />
            Live presence, always on
          </div>
        </div>
      </ScrollReveal>
    </SectionEnvironment>
  );
}
