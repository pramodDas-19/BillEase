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

    // Auto-create tenant record in the database
    if (data.user) {
      try {
        await supabase.from("tenants").insert([
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
        console.warn("Could not insert initial tenant row (may already exist):", insertErr);
      }
    }

    return data;
  }

  /**
   * Signs out the current user session.
   */
  static async signOut(): Promise<void> {
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
      // Return default session for local development if not logged in
      return {
        id: "demo-user-1",
        email: "contact@royalevents.com",
        businessName: "Royal Events & Print Studio",
        ownerName: "Pramod Das",
        phone: "+91 98765 43210",
        tenantId: "tenant-royal-events",
      };
    }

    return {
      id: user.id,
      email: user.email || "",
      businessName: user.user_metadata?.business_name || "Business Account",
      ownerName: user.user_metadata?.owner_name || "Account Owner",
      phone: user.user_metadata?.phone || "",
      tenantId: user.user_metadata?.tenant_id || "tenant-royal-events",
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
