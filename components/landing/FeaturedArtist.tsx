import { LinkButton } from "@/components/ui/Button";
import { DEMO_ARTIST } from "@/data/demoArtist";
import { DEMO_MUSEUM } from "@/data/museum";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const FRAME_ACCENTS = ["hover:border-berry/60", "hover:border-dusty-blue/60", "hover:border-flax/60"];

export function FeaturedArtist() {
  const previewArtworks = DEMO_MUSEUM.artworks.slice(0, 3);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
      <ScrollReveal>
        <p className="flex items-center gap-2 font-display text-sm italic text-terracotta-dark">
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-berry" />
          Featured artist
        </p>
        <div className="mt-8 grid grid-cols-1 gap-10 rounded-[1.75rem] border border-border/70 bg-surface p-6 shadow-warm-sm sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-14">
          <div>
            <h2 className="font-display text-3xl text-ink sm:text-4xl">{DEMO_ARTIST.displayName}</h2>
            <p className="mt-2 text-sm text-ink-muted">
              @{DEMO_ARTIST.username} · {DEMO_ARTIST.disciplines.join(" · ")}
            </p>
            <p className="mt-5 max-w-md leading-relaxed text-ink-muted">{DEMO_ARTIST.bio}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href={`/artist/${DEMO_ARTIST.username}`}>View profile</LinkButton>
              <LinkButton href="/museum/demo-artist" variant="secondary">
                Enter {DEMO_MUSEUM.name}
              </LinkButton>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {previewArtworks.map((artwork, i) => (
              <div
                key={artwork.id}
                className={`group overflow-hidden rounded-lg border-[5px] border-canvas-deep bg-canvas-deep shadow-warm-xs transition-[border-color,box-shadow] duration-300 hover:shadow-warm-md ${FRAME_ACCENTS[i % FRAME_ACCENTS.length]} ${
                  i === 0 ? "col-span-3 aspect-[16/9] sm:col-span-2 sm:aspect-square" : "aspect-square"
                }`}
              >
                <img
                  src={artwork.imageUrl}
                  alt={artwork.altText}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
