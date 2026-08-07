import { ScrollReveal } from "@/components/ui/ScrollReveal";

function UploadIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
      <rect x="5" y="6" width="22" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="11.5" cy="12.5" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 19.5 12 14l4.5 4 3-2.5L27 19" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16 3v6M13.2 5.6 16 3l2.8 2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AvatarIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
      <circle cx="16" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 27c1.2-6 5.4-9 11-9s9.8 3 11 9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="13.5" cy="12" r="0.9" fill="currentColor" />
      <circle cx="18.5" cy="12" r="0.9" fill="currentColor" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
      <path
        d="M11 5c-3.9 1.8-6 5.9-6 11s2.1 9.2 6 11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M11 5v22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="22.5" cy="10.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="22.5" cy="21.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M22.5 13v6.5" stroke="currentColor" strokeWidth="1.6" strokeDasharray="1.2 2.2" strokeLinecap="round" />
    </svg>
  );
}

const STEPS = [
  {
    number: "01",
    icon: UploadIcon,
    accent: "text-flax",
    title: "Build your museum",
    description:
      "Your work is arranged on the walls of a room designed around it -- framed, labeled, and lit like a real gallery.",
  },
  {
    number: "02",
    icon: AvatarIcon,
    accent: "text-dusty-blue",
    title: "Customize your avatar",
    description:
      "Pick a skin tone, hairstyle, and outfit. It's the same friendly face that represents you everywhere in MyMuseum.",
  },
  {
    number: "03",
    icon: ShareIcon,
    accent: "text-berry",
    title: "Share and explore together",
    description:
      "Send one link. Visitors walk in as their own avatar, browse at their own pace, and see who else is there.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="border-y border-border/70 bg-surface py-20 sm:py-28" id="how-it-works">
      <div className="mx-auto w-full max-w-6xl px-6">
        <ScrollReveal className="max-w-xl">
          <p className="flex items-center gap-2 font-display text-sm italic text-terracotta-dark">
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-dusty-blue" />
            How it works
          </p>
          <h2 className="mt-2 text-balance font-display text-3xl text-ink sm:text-4xl">
            A portfolio you can walk through
          </h2>
          <p className="mt-4 text-ink-muted">
            MyMuseum turns a portfolio into a place. Three steps take you from a folder of work to
            a shared, walkable gallery.
          </p>
        </ScrollReveal>

        <ol className="mt-14 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.number} className="relative">
                <ScrollReveal delay={index * 0.12} className="flex flex-col gap-4 sm:pr-8">
                  <div className="flex items-center gap-4">
                    <span
                      aria-hidden="true"
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-canvas-deep shadow-warm-xs ${step.accent}`}
                    >
                      <Icon />
                    </span>
                    <span className="font-display text-sm italic text-ink-muted">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-ink">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.description}</p>
                  </div>
                </ScrollReveal>
                {index < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute right-0 top-7 hidden h-16 w-px bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1.5px)] bg-[length:1px_7px] bg-repeat-y sm:block"
                  />
                )}
              </li>
            );
          })}
        </ol>

        <ScrollReveal
          delay={0.15}
          className="mt-16 flex flex-col gap-6 rounded-[1.75rem] border border-border/70 bg-canvas-deep p-8 shadow-warm-xs sm:flex-row sm:items-center sm:justify-between sm:p-10"
        >
          <div>
            <h3 className="font-display text-xl text-ink">Museums are shared, not solo</h3>
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
        </ScrollReveal>
      </div>
    </section>
  );
}
