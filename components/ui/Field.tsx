import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

const fieldInputBase = "rounded-lg border border-border bg-canvas text-ink outline-none focus-visible:border-terracotta";

interface FieldChromeProps {
  label: ReactNode;
  /** Secondary text appended after the label, e.g. "(optional)". */
  hint?: ReactNode;
  labelClassName?: string;
  /** Denser padding/gap, matching the multi-field grids used in artwork
   * rows (ArtworkDraftItem, EditArtworkRow, AddArtworkForm) as opposed to
   * standalone forms (sign-in, museum metadata). */
  compact?: boolean;
}

type TextFieldProps = FieldChromeProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export function TextField({ label, hint, labelClassName, compact, ...props }: TextFieldProps) {
  return (
    <label className={cn("flex flex-col text-sm", compact ? "gap-1" : "gap-1.5", labelClassName)}>
      <span className="font-medium text-ink">
        {label} {hint && <span className="font-normal text-ink-muted">{hint}</span>}
      </span>
      <input
        className={cn(fieldInputBase, compact ? "px-3 py-2 text-sm" : "px-3 py-2.5")}
        {...props}
      />
    </label>
  );
}

type TextAreaFieldProps = FieldChromeProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

export function TextAreaField({ label, hint, labelClassName, compact, ...props }: TextAreaFieldProps) {
  return (
    <label className={cn("flex flex-col text-sm", compact ? "gap-1" : "gap-1.5", labelClassName)}>
      <span className="font-medium text-ink">
        {label} {hint && <span className="font-normal text-ink-muted">{hint}</span>}
      </span>
      <textarea
        className={cn(fieldInputBase, "resize-none", compact ? "px-3 py-2 text-sm" : "px-3 py-2.5")}
        {...props}
      />
    </label>
  );
}
