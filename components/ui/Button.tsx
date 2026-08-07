"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[0.005em] transition-[background-color,border-color,color,box-shadow] duration-200 ease-out focus-visible:outline-none disabled:opacity-45 disabled:pointer-events-none";

// Single source of truth for button colors across the whole site.
// Terracotta is the primary action color, while sage is used for
// secondary hover states and supporting interactions.
const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-sage text-surface shadow-warm-sm hover:bg-sage-dark hover:shadow-warm-md",

  secondary:
    "bg-surface text-ink border border-border shadow-warm-xs hover:border-sage-dark hover:text-sage-dark hover:shadow-warm-sm",

  ghost:
    "bg-transparent text-ink hover:bg-canvas-deep hover:text-sage-dark",
};

const sizes: Record<ButtonSize, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

const tapAnimation = { scale: 0.97 };
const hoverAnimation = { y: -1 };

interface SharedProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...props
}: SharedProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">) {
  return (
    <motion.button
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {icon}
      {children}
    </motion.button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: SharedProps & { href: string; children: ReactNode } & Omit<
    React.ComponentProps<typeof Link>,
    "href" | "className"
  >) {
  return (
    <motion.div whileHover={hoverAnimation} whileTap={tapAnimation} transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }} className="inline-block">
      <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
        {icon}
        {children}
      </Link>
    </motion.div>
  );
}
