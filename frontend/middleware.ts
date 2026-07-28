import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight route guard based on session cookies.
 * Real authorization is always enforced by the Express backend —
 * this only improves UX by redirecting early.
 */
export function middleware(req: NextRequest) {
  const token = req.cookies.get("topinz_token")?.value;
  const role = req.cookies.get("topinz_role")?.value;
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (isProtected && !token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && token && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if ((pathname === "/login" || pathname === "/register") && token) {
    return NextResponse.redirect(
      new URL(role === "admin" ? "/admin" : "/dashboard", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
