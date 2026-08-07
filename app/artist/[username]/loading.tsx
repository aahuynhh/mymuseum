export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-24">
      <div className="flex flex-col items-center gap-3 motion-safe:animate-pulse">
        <div className="h-28 w-28 rounded-3xl bg-canvas-deep" />
        <p className="text-sm text-ink-muted">Loading profile…</p>
      </div>
    </div>
  );
}
