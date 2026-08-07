import { LinkButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div>
        <h1 className="font-display text-3xl text-ink">This room doesn&apos;t exist</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
          The page or museum you&apos;re looking for isn&apos;t here. It may have moved, or the link
          might be off.
        </p>
      </div>
      <LinkButton href="/">Back to MyMuseum</LinkButton>
    </main>
  );
}
