export function Hero3DPreviewSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-canvas-deep to-[#ecdfc4]">
      <div className="flex flex-col items-center gap-2 motion-safe:animate-pulse">
        <div className="h-10 w-10 rounded-full bg-terracotta/30" />
        <p className="text-sm text-ink-muted">Loading the museum preview…</p>
      </div>
    </div>
  );
}
