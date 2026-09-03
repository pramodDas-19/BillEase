import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static assets, Next.js internals, and public resources to ignore
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/icon.png") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Public customer portal routes that must always be accessible without login
  // e.g. /pay/[id] (Client payment portal)
  if (pathname.startsWith("/pay/")) {
    return NextResponse.next();
  }

  // 3. Create Supabase client for SSR Cookie handling
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_-pV2SiWE3RXBHyN63admfg_z8S0yx9c";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // 4. Authenticate user from Supabase session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fallback session cookies
  const hasAuthSessionCookie = request.cookies.get("billease_auth_session")?.value === "true";
  const hasDemoAuth = request.cookies.get("billease_demo_auth")?.value === "true";
  const hasSbCookie = request.cookies
    .getAll()
    .some(
      (c) =>
        (c.name.startsWith("sb-") && c.name.endsWith("-auth-token")) ||
        c.name.includes("auth-token")
    );

  const isAuthenticated = !!user || hasAuthSessionCookie || hasDemoAuth || hasSbCookie;


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

  // Auth pages (login, signup, password resets)
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  // 5. Route Protection Enforcement:
  // A. If accessing protected routes while NOT authenticated -> redirect to /login
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // B. If already authenticated and trying to visit login/signup -> redirect to /dashboard
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // C. Root redirect: "/" -> "/dashboard" if authenticated, else "/login"
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
