import { cn } from "@/utils/cn";

/** The picture-rail seam between two homepage "rooms" -- sits at the top of
 * each SectionEnvironment so scrolling past it reads as crossing into the
 * next room rather than continuing down one flat page. */
export function RoomBoundary({ tone = "on-light" }: { tone?: "on-light" | "on-dark" }) {
  return (
    <div aria-hidden="true" className={cn("rule-molding", tone === "on-dark" && "opacity-40")} />
  );
}
