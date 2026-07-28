import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Faint dotted backdrop, masked toward the center card area */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-dot-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_45%,black_10%,transparent_100%)]"
      />

      <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between px-4 sm:px-6">
        <Logo href="/" />
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
