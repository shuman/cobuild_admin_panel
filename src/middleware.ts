import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for route protection.
 * NextAuth's `auth` wrapper provides the session in `req.auth`.
 */
export default auth((req: NextRequest & { auth: any }) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = req.nextUrl;

  // Never intercept API routes, static files, NextAuth routes, or PWA files.
  // SW update checks and manifest/icon fetches must never receive a 307 ->
  // login HTML — Chrome's install pipeline downloads manifest icons WITHOUT
  // session cookies, so auth-gating them breaks PWA installability.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images") ||
    pathname === "/offline" ||
    /\.(png|ico|svg|webp|webmanifest|js|txt|xml|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const publicRoutes = ["/login", "/verify-2fa"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Logged in user on public route -> redirect to dashboard
  if (isPublicRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Not logged in on protected route -> redirect to login
  if (!isPublicRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Run middleware on all routes except:
     * - api (all API routes including NextAuth)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
};
