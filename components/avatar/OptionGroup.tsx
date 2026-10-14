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
  /** "swatch" is for primarily-color choices (body/decoration/feet color):
   * a compact color chip with a small caption, instead of a full pill --
   * only takes effect on options that actually carry a `hex`. Default
   * "pill" keeps the original labeled-pill look used for shape/expression/
   * decoration/accessory groups. */
  variant?: "pill" | "swatch";
}

/** Accessible custom-radio group: real <input type="radio"> elements give
 * native keyboard arrow-key navigation and correct screen-reader semantics. */
export function OptionGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  variant = "pill",
}: OptionGroupProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-semibold text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          const input = (
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
          );

          if (variant === "swatch" && option.hex) {
            return (
              <label key={option.value} className="cursor-pointer">
                {input}
                <span
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl px-1.5 py-1.5 transition-all duration-200 ease-out",
                    "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-terracotta"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-7 w-7 rounded-full border transition-all duration-200 ease-out",
                      selected
                        ? "border-terracotta ring-2 ring-terracotta ring-offset-2 ring-offset-canvas"
                        : "border-black/10 hover:border-ink-muted"
                    )}
                    style={{ background: option.hex }}
                  />
                  <span
                    className={cn(
                      "text-[11px] font-medium leading-none",
                      selected ? "text-terracotta-dark" : "text-ink-muted"
                    )}
                  >
                    {option.label}
                  </span>
                </span>
              </label>
            );
          }

          return (
            <label key={option.value} className="cursor-pointer">
              {input}
              <span
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 ease-out",
                  "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-terracotta",
                  selected
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
          );
        })}
      </div>
    </fieldset>
  );
}
