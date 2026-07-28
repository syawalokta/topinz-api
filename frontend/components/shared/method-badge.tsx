import { cn } from "@/lib/utils";

const methodStyles: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  POST: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PUT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PATCH: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  DELETE: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function MethodBadge({
  method,
  className,
}: {
  method: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-4",
        methodStyles[method.toUpperCase()] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {method.toUpperCase()}
    </span>
  );
}

/** Colored badge for HTTP status codes. */
export function StatusCodeBadge({
  code,
  className,
}: {
  code: number;
  className?: string;
}) {
  const tone =
    code < 300
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : code < 500
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-red-500/10 text-red-600 dark:text-red-400";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-4",
        tone,
        className
      )}
    >
      {code}
    </span>
  );
}
