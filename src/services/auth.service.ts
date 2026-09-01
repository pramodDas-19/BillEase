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
      if (user?.user_metadata?.tenant_id) {
        const tId = user.user_metadata.tenant_id;
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

    if (data.user?.user_metadata?.tenant_id) {
      this.setActiveTenantId(data.user.user_metadata.tenant_id);
    }

    return data;
  }

  /**
   * Registers a new tenant and business owner account.
   */
  static async signUp(params: SignUpParams): Promise<{ user: any; session: any }> {
    const tenantId = `tenant-${params.businessName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;

    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          business_name: params.businessName,
          owner_name: params.ownerName,
          phone: params.phone,
          tenant_id: tenantId,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    this.setActiveTenantId(tenantId);

    // Auto-create tenant record in the database
    if (data.user) {
      try {
        await supabase.from("tenants").upsert([
          {
            id: tenantId,
            business_name: params.businessName,
            owner_name: params.ownerName,
            email: params.email,
            phone: params.phone,
            address: { street: "", city: "", state: "", pincode: "" },
            bank_details: { bankName: "HDFC Bank", accountNumber: "", ifscCode: "", upiId: "" },
            settings: { quotationPrefix: "QT-", invoicePrefix: "INV-", enableGstByDefault: true },
          },
        ]);
      } catch (insertErr) {
        console.warn("Could not insert initial tenant row:", insertErr);
      }
    }

    return data;
  }

  /**
   * Signs out the current user session.
   */
  static async signOut(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem("billease_active_tenant_id");
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
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const tenantId = user.user_metadata?.tenant_id || "tenant-royal-events";
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
