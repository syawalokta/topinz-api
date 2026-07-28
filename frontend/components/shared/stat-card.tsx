import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

/** Compact KPI card for dashboard overviews. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("shadow-soft", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-muted-foreground">
            {label}
          </p>
          {Icon ? <Icon className="h-4 w-4 text-muted-foreground/70" /> : null}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
