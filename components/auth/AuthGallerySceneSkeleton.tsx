export function AuthGallerySceneSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2f4258] to-[#1a2436]">
      <div className="flex flex-col items-center gap-2 motion-safe:animate-pulse">
        <div className="h-10 w-10 rounded-full bg-antique-gold/30" />
        <p className="text-sm text-surface/70">Loading the gallery…</p>
      </div>
    </div>
  );
}
