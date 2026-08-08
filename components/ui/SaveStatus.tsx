import { Button, type ButtonVariant, type ButtonSize } from "./Button";
import { cn } from "@/utils/cn";

export type SaveStatusState = "idle" | "saving" | "success" | "error";

interface SaveStatusProps {
  /**
   * Purely presentational -- the owning form decides what this should be on
   * every render (including whether a prior "success" should still show
   * after the user has started editing again). This component holds no
   * request/state-management logic of its own.
   */
  state: SaveStatusState;
  onSave: () => void;
  idleLabel?: string;
  savingLabel?: string;
  successMessage?: string;
  errorMessage?: string | null;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function SaveStatus({
  state,
  onSave,
  idleLabel = "Save",
  savingLabel = "Saving…",
  successMessage = "Saved.",
  errorMessage,
  disabled,
  variant = "primary",
  size = "md",
  className,
}: SaveStatusProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={onSave}
        disabled={disabled || state === "saving"}
      >
        {state === "saving" ? savingLabel : idleLabel}
      </Button>
      {state === "success" && <p className="text-sm text-sage-dark">{successMessage}</p>}
      {state === "error" && errorMessage && (
        <p role="alert" className="text-sm font-medium text-dusty-red-dark">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
