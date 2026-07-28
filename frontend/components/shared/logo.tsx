import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("h-6 w-6", className)}
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M9 11h14v3.2h-5.4V23h-3.2V14.2H9V11z" fill="white" />
    </svg>
  );
}

export function Logo({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 font-semibold tracking-tight text-foreground",
        className
      )}
    >
      <LogoMark />
      <span>
        Topinz<span className="text-muted-foreground"> API</span>
      </span>
    </Link>
  );
}
