import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { AuthService } from "@/services/auth.service";
import { supabase } from "@/lib/supabase/client";

describe("Module 1: Authentication & Middleware Bug Fix Verifications", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("TEST 1: /reset-password is NOT redirected to /dashboard even when user has auth cookie", async () => {
    // Request with auth cookie to /reset-password
    const req = new NextRequest("http://localhost:3000/reset-password", {
      headers: {
        cookie: "sb-butxutqhbhscbihunnwr-auth-token=valid-token",
      },
    });

    const res = await middleware(req);
    // Should NOT redirect to /dashboard
    expect(res.status).not.toBe(307);
    expect(res.status).not.toBe(302);
    expect(res.headers.get("location")).toBeNull();
  });

  it("TEST 2: Public marketing route /pricing passes through without redirection", async () => {
    const req = new NextRequest("http://localhost:3000/pricing");
    const res = await middleware(req);
    expect(res.status).not.toBe(307);
    expect(res.status).not.toBe(302);
  });

  it("TEST 3: Protected route /invoices redirects unauthenticated visitors to /login", async () => {
    const req = new NextRequest("http://localhost:3000/invoices");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("redirectTo=%2Finvoices");
  });

  it("TEST 4: AuthService.getCurrentUser prioritizes app_metadata.tenant_id over fallback", async () => {
    vi.spyOn(supabase.auth, "getUser").mockResolvedValueOnce({
      data: {
        user: {
          id: "test-user-uuid-9999",
          email: "owner@studio.com",
          app_metadata: {
            tenant_id: "tenant-studio-apex-7777",
          },
          user_metadata: {
            business_name: "Apex Studio",
            owner_name: "John Doe",
          },
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as any,
      },
      error: null,
    });

    const user = await AuthService.getCurrentUser();
    expect(user).toBeTruthy();
    expect(user?.tenantId).toBe("tenant-studio-apex-7777");
  });

  it("TEST 5: AuthService.signOut cleans up impersonation and registration keys", async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("billease_active_tenant_id", "test-tenant");
      localStorage.setItem("billease_is_impersonating", "true");
      sessionStorage.setItem("billease_is_impersonating", "true");
      localStorage.setItem("billease_just_registered", "true");

      await AuthService.signOut();

      expect(localStorage.getItem("billease_active_tenant_id")).toBeNull();
      expect(localStorage.getItem("billease_is_impersonating")).toBeNull();
      expect(sessionStorage.getItem("billease_is_impersonating")).toBeNull();
      expect(localStorage.getItem("billease_just_registered")).toBeNull();
    }
  });
});
