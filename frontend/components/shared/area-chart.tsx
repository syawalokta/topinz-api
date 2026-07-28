"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AreaChartProps {
  data: { date: string; count: number }[];
  height?: number;
  className?: string;
  /** Short label formatter for x-axis ticks, e.g. "12 Jul". */
  formatLabel?: (date: string) => string;
}

/**
 * Dependency-free SVG area chart with hover tooltip.
 * Intentionally minimal — a quiet Stripe-like usage chart.
 */
export function AreaChart({
  data,
  height = 180,
  className,
  formatLabel = (d) => {
    const date = new Date(d);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(date);
  },
}: AreaChartProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const width = 600; // viewBox width; scales responsively

  const max = Math.max(...data.map((d) => d.count), 1);
  const padX = 4;
  const padTop = 12;
  const padBottom = 4;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const points = data.map((d, i) => ({
    x: padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW),
    y: padTop + innerH - (d.count / max) * innerH,
  }));

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${points[points.length - 1]?.x.toFixed(2)},${
    padTop + innerH
  } L${points[0]?.x.toFixed(2)},${padTop + innerH} Z`;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    });
    setHover(nearest);
  };

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-sm text-muted-foreground",
          className
        )}
        style={{ height }}
      >
        Belum ada data
      </div>
    );
  }

  const active = hover !== null ? data[hover] : null;
  const activePoint = hover !== null ? points[hover] : null;

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Usage chart"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="hsl(var(--primary))"
              stopOpacity="0.18"
            />
            <stop
              offset="100%"
              stopColor="hsl(var(--primary))"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaFill)" />
        <path
          d={line}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {activePoint ? (
          <g>
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={padTop}
              y2={padTop + innerH}
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="4"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--background))"
              strokeWidth="2"
            />
          </g>
        ) : null}
      </svg>
      {active && activePoint ? (
        <div
          className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-soft"
          style={{ left: `${(activePoint.x / width) * 100}%` }}
        >
          <span className="font-medium tabular-nums">
            {new Intl.NumberFormat("id-ID").format(active.count)}
          </span>{" "}
          <span className="text-muted-foreground">
            · {formatLabel(active.date)}
          </span>
        </div>
      ) : null}
      <div className="mt-1 flex justify-between px-1 text-[11px] text-muted-foreground">
        <span>{formatLabel(data[0].date)}</span>
        {data.length > 2 ? (
          <span>{formatLabel(data[Math.floor(data.length / 2)].date)}</span>
        ) : null}
        <span>{formatLabel(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}
