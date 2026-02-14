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

  // Never intercept API routes, static files, or NextAuth routes
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images")
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
