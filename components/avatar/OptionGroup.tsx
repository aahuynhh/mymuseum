"use client";

import { cn } from "@/utils/cn";

interface Option<T extends string> {
  value: T;
  label: string;
  hex?: string;
}

interface OptionGroupProps<T extends string> {
  legend: string;
  name: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Accessible custom-radio group: real <input type="radio"> elements give
 * native keyboard arrow-key navigation and correct screen-reader semantics. */
export function OptionGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: OptionGroupProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-semibold text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 ease-out",
                "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-terracotta",
                value === option.value
                  ? "border-terracotta bg-terracotta/10 text-terracotta-dark shadow-warm-xs"
                  : "border-border text-ink hover:border-ink-muted hover:bg-canvas-deep/60"
              )}
            >
              {option.hex && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ background: option.hex }}
                />
              )}
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
