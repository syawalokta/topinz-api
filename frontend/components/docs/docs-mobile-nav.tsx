"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { DocsSidebarContent } from "@/components/docs/docs-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Mobile-only bar that opens the docs navigation in a left sheet. */
export function DocsMobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex items-center border-b py-3 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Menu className="h-4 w-4" />
            Menu Dokumentasi
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="scrollbar-thin w-80 overflow-y-auto"
        >
          <SheetTitle className="sr-only">Menu Dokumentasi</SheetTitle>
          <div className="mt-4">
            <DocsSidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
