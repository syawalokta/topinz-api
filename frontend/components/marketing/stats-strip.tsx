import { heroStats } from "@/lib/site";

/** Quiet editorial stat band between hero and the first content section. */
export function StatsStrip() {
  return (
    <section className="border-y">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 md:divide-x">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center px-4 py-8 text-center md:py-10"
            >
              <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
