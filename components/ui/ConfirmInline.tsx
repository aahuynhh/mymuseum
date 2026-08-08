import type { ReactNode } from "react";
import { Button } from "./Button";
import { cn } from "@/utils/cn";

interface ConfirmInlineProps {
  /** Whether the Cancel/Confirm step is currently shown instead of the
   * low-emphasis trigger link. Owned by the parent, same as today. */
  confirming: boolean;
  /** True while the confirmed action's own request is in flight. */
  busy: boolean;
  onRequestConfirm: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  triggerLabel: string;
  triggerDisabled?: boolean;
  triggerDisabledTitle?: string;
  triggerClassName?: string;
  confirmPrompt: ReactNode;
  confirmLabel?: string;
  confirmingLabel?: string;
  cancelLabel?: string;
  className?: string;
}

/**
 * Shared "are you sure?" inline confirm step for destructive actions.
 * Purely presentational -- the parent owns the confirming/busy state and
 * what actually happens on confirm (the fetch call, error handling), the
 * same per-component state machines DeleteMuseumButton and EditArtworkRow
 * already had. The trigger stays a low-emphasis text link; only the actual
 * confirmation step uses the `danger` Button variant.
 */
export function ConfirmInline({
  confirming,
  busy,
  onRequestConfirm,
  onCancel,
  onConfirm,
  triggerLabel,
  triggerDisabled,
  triggerDisabledTitle,
  triggerClassName,
  confirmPrompt,
  confirmLabel = "Confirm",
  confirmingLabel = "Removing…",
  cancelLabel = "Cancel",
  className,
}: ConfirmInlineProps) {
  if (confirming) {
    return (
      <div className={cn("flex flex-wrap items-center justify-end gap-2", className)}>
        <span className="text-xs text-ink-muted">{confirmPrompt}</span>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onCancel}
          disabled={busy}
          className="px-2.5 py-1 text-xs"
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="danger"
          size="md"
          onClick={onConfirm}
          disabled={busy}
          className="px-2.5 py-1 text-xs"
        >
          {busy ? confirmingLabel : confirmLabel}
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onRequestConfirm}
      disabled={triggerDisabled}
      title={triggerDisabled ? triggerDisabledTitle : undefined}
      className={cn(
        "text-xs font-medium text-ink-muted underline-offset-2 transition-colors hover:text-dusty-red-dark hover:underline disabled:opacity-40 disabled:hover:no-underline",
        triggerClassName,
        className
      )}
    >
      {triggerLabel}
    </button>
  );
}
