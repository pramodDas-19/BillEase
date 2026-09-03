import { supabase } from "@/lib/supabase/client";

export interface SignUpParams {
  email: string;
  password: string;
  businessName: string;
  ownerName: string;
  phone: string;
}

export interface UserSession {
  id: string;
  email: string;
  businessName?: string;
  ownerName?: string;
  phone?: string;
  tenantId?: string;
}

export class AuthService {
  /**
   * Returns the currently active tenant ID based on logged in user or storage.
   */
  static async getActiveTenantId(): Promise<string> {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("billease_active_tenant_id");
        if (stored) return stored;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const tId = user?.app_metadata?.tenant_id || user?.user_metadata?.tenant_id;
      if (tId) {
        if (typeof window !== "undefined") {
          localStorage.setItem("billease_active_tenant_id", tId);
        }
        return tId;
      }
    } catch (e) {
      console.warn("Could not determine active tenant ID:", e);
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("billease_active_tenant_id");
      if (stored) return stored;

      const registered = localStorage.getItem("billease_registered_user");
      if (registered) {
        try {
          const parsed = JSON.parse(registered);
          if (parsed.tenantId) {
            localStorage.setItem("billease_active_tenant_id", parsed.tenantId);
            return parsed.tenantId;
          }
        } catch (e) {}
      }
    }

    return "tenant-royal-events";
  }

  /**
   * Sets the active tenant ID explicitly.
   */
  static setActiveTenantId(tenantId: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("billease_active_tenant_id", tenantId);
    }
  }

  /**
   * Signs in a user using Email & Password.
   */
  static async signIn(email: string, password: string): Promise<{ session: any; user: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    const tId = data.user?.app_metadata?.tenant_id || data.user?.user_metadata?.tenant_id;
    if (tId) {
      this.setActiveTenantId(tId);
    }

    return data;
  }

  /**
   * Registers a new business owner account and provisions tenant server-side.
   */
  static async signUp(params: SignUpParams): Promise<{ user: any; session: any }> {
    // 1. Register auth user without client-side tenant_id in user_metadata
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          business_name: params.businessName,
          owner_name: params.ownerName,
          phone: params.phone,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // 2. Call server-only provision-tenant route (service-role writes app_metadata)
    try {
      const res = await fetch("/api/auth/provision-tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: params.businessName,
          ownerName: params.ownerName,
          phone: params.phone,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.tenantId) {
          this.setActiveTenantId(json.tenantId);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "billease_registered_user",
              JSON.stringify({
                tenantId: json.tenantId,
                businessName: params.businessName,
                ownerName: params.ownerName,
                email: params.email,
                phone: params.phone,
              })
            );
          }
        }
      }
    } catch (provisionErr) {
      console.warn("Could not auto-provision tenant immediately:", provisionErr);
    }

    return data;
  }

  /**
   * Signs out the current user session.
   */
  static async signOut(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem("billease_active_tenant_id");
      localStorage.removeItem("billease_registered_user");
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
    }
  }



  /**
   * Retrieves the currently authenticated user.
   */
  static async getCurrentUser(): Promise<UserSession | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const tenantId = user.user_metadata?.tenant_id || `tenant-${user.id.slice(0, 8)}`;
      this.setActiveTenantId(tenantId);

      return {
        id: user.id,
        email: user.email || "",
        businessName: user.user_metadata?.business_name || "My Business",
        ownerName: user.user_metadata?.owner_name || "Account Owner",
        phone: user.user_metadata?.phone || "",
        tenantId,
      };
    }

    if (typeof window !== "undefined") {
      const registered = localStorage.getItem("billease_registered_user");
      if (registered) {
        try {
          const parsed = JSON.parse(registered);
          return {
            id: parsed.tenantId || "user-local",
            email: parsed.email || "",
            businessName: parsed.businessName || "My Business",
            ownerName: parsed.ownerName || "Account Owner",
            phone: parsed.phone || "",
            tenantId: parsed.tenantId,
          };
        } catch (e) {}
      }
    }

    return null;
  }

  /**
   * Sends a password reset email.
   */
  static async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Updates the password for the current session.
   */
  static async updatePassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw new Error(error.message);
    }
  }
}
