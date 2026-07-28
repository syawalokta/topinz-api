import type { Metadata } from "next";
import { DocsMobileNav } from "@/components/docs/docs-mobile-nav";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { SiteNavbar } from "@/components/shared/site-navbar";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Dokumentasi lengkap Topinz API — autentikasi, error codes, rate limit, dan referensi seluruh endpoint.",
};

export default function DocsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen">
      <SiteNavbar />
      <div className="container lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="scrollbar-thin sticky top-14 hidden max-h-[calc(100vh-3.5rem)] self-start overflow-y-auto py-8 lg:block">
          <DocsSidebar />
        </aside>
        <div className="min-w-0">
          <DocsMobileNav />
          <main className="py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
