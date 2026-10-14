export function LogoMark({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="" aria-hidden="true" className={`${className} object-contain`} />
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="font-heading text-xl font-medium tracking-tight text-ink">
        MyMuseum
      </span>
    </span>
  );
}
