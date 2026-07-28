import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  overline: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}

/** Overline + title + optional description, shared by all marketing sections. */
export function SectionHeading({
  overline,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
        {overline}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
