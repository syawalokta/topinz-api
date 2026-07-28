/** Manually styled building blocks for the Terms and Privacy pages. */

export function LegalHeader({
  title,
  updated,
  intro,
}: {
  title: string;
  updated: string;
  intro: string;
}) {
  return (
    <header>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Terakhir diperbarui: {updated}
      </p>
      <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
        {intro}
      </p>
    </header>
  );
}

export function LegalSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 mt-10 text-base font-semibold tracking-tight">
        {number}. {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
