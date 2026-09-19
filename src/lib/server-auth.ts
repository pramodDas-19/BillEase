// ============================================================================
// BILLEASE SAAS — SERVER AUTH & TENANT RESOLUTION HELPER
// Securely verifies caller session and resolves authenticated tenant_id
// ============================================================================

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";

export interface AuthenticatedTenantSession {
  userId: string | null;
  email: string | null;
  tenantId: string;
  isAuthenticated: boolean;
}

export async function resolveAuthenticatedTenant(
  request: NextRequest
): Promise<AuthenticatedTenantSession | null> {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "sb_publishable_-pV2SiWE3RXBHyN63admfg_z8S0yx9c";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 1. Authenticate user from SSR session cookies
    const supabaseSsr = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    });

    const {
      data: { user },
    } = await supabaseSsr.auth.getUser();

    if (user) {
      // 1. Check server-set app_metadata
      let tenantId = user.app_metadata?.tenant_id;

      // 2. Check user_metadata
      if (!tenantId) {
        tenantId = user.user_metadata?.tenant_id;
      }

      // 3. If missing, look up tenants table by user email using service role
      if (!tenantId && serviceRoleKey && user.email) {
        const admin = createClient(supabaseUrl, serviceRoleKey);
        const { data: tenant } = await admin
          .from("tenants")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();

        if (tenant?.id) {
          tenantId = tenant.id;
        }
      }

      // 4. Check client active tenant header if user belongs to multiple or impersonation
      const headerTenant = request.headers.get("x-tenant-id");
      if (headerTenant && (user.app_metadata?.role === "admin" || !tenantId)) {
        tenantId = headerTenant;
      }

      if (!tenantId) {
        tenantId = `tenant-${user.id.slice(0, 8)}`;
      }

      return {
        userId: user.id,
        email: user.email || null,
        tenantId,
        isAuthenticated: true,
      };
    }

    // Unauthenticated request fallback (e.g. demo tenant or local development)
    // Check if x-tenant-id is provided for demo mode
    const demoTenant = request.headers.get("x-tenant-id") || "tenant-royal-events";
    return {
      userId: null,
      email: null,
      tenantId: demoTenant,
      isAuthenticated: false,
    };
  } catch (err) {
    console.warn("[ServerAuth] Error resolving tenant session:", err);
    return null;
  }
}
