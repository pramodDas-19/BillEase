import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";

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

  // 2. Public customer portal and static marketing routes that require zero authentication
  if (
    pathname.startsWith("/pay/") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/privacy")
  ) {
    return NextResponse.next();
  }

  // 3. Cryptographically verify Super-Admin session token
  const adminAuth = await verifyAdminSession(request);
  const hasAdminSession = adminAuth.valid;

  // 4. Fast Supabase auth cookie inspection
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
  );

  // If user has neither an admin session nor a Supabase auth cookie, they are definitively unauthenticated
  if (!hasAuthCookie && !hasAdminSession) {
    const isProtectedPath =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/clients") ||
      pathname.startsWith("/services") ||
      pathname.startsWith("/quotations") ||
      pathname.startsWith("/invoices") ||
      pathname.startsWith("/payments") ||
      pathname.startsWith("/reports") ||
      pathname.startsWith("/settings");

    if (isProtectedPath) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Allow /admin to load so unauthenticated users can access the Super-Admin 2FA login form
    return NextResponse.next();
  }

  // 4. Create Supabase client for SSR Cookie handling only when auth cookies are present
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

  // Verify Supabase session cryptographically
  let user = null;
  if (hasAuthCookie) {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  }

  const isAuthenticated = !!user || hasAdminSession;

  // Admin routes: allow /admin to render login form or console, redirect subpaths to /admin if unauthenticated
  const isAdminPath = pathname.startsWith("/admin");
  if (isAdminPath && pathname !== "/admin" && !hasAdminSession) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

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

  // B. If already authenticated and trying to visit login/signup
  if (isAuthPage && isAuthenticated) {
    if (hasAdminSession) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // C. Root redirect: "/" -> "/admin" if admin, "/dashboard" if authenticated, else "/login"
  if (pathname === "/") {
    if (hasAdminSession) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
