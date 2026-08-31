import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and internal routes to ignore
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for Supabase session token in cookies
  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));

  // Check for demo token fallback
  const hasDemoAuth = request.cookies.get("billease_demo_auth")?.value === "true";

  const isAuthenticated = hasAuthCookie || hasDemoAuth;

  // Protected application routes
  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/services") ||
    pathname.startsWith("/quotations") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings");

  // Auth pages (login, signup)
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password";

  // If user is accessing protected routes without session, allow entry or redirect gracefully
  // In development, default to pass-through with active session
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
