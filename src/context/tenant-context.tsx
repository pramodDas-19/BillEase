"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Tenant, User } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { AuthService } from "@/services/auth.service";

const DEFAULT_TENANT: Tenant = {
  id: "tenant-royal-events",
  businessName: "My Business Studio",
  slug: "my-business",
  businessType: "event_planner",
  ownerName: "Account Owner",
  email: "owner@example.com",
  phone: "+91 98765 43210",
  address: {
    street: "Main Street",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "India",
  },
  bankDetails: {
    accountName: "Business Account",
    accountNumber: "919876543210",
    bankName: "HDFC Bank",
    ifscCode: "HDFC0001234",
    upiId: "business@hdfcbank",
  },
  settings: {
    defaultCurrency: "INR",
    enableGstByDefault: true,
    defaultTaxRate: 18,
    quotationNumbering: { prefix: "QT-", nextNumber: 1001, digitLength: 4 },
    invoiceNumbering: { prefix: "INV-", nextNumber: 1001, digitLength: 4 },
    defaultQuotationValidityDays: 14,
    defaultInvoiceDueDays: 14,
    defaultTermsAndConditions: "1. 50% advance required to confirm booking.\n2. Balance due within 14 days of invoice.",
    defaultInvoiceNotes: "Thank you for your business!",
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEFAULT_USER: User = {
  id: "user-1",
  tenantId: "tenant-royal-events",
  name: "Account Owner",
  email: "owner@example.com",
  role: "owner",
  avatarUrl: undefined,
  createdAt: new Date().toISOString(),
};

interface TenantContextType {
  currentTenant: Tenant;
  currentUser: User;
  availableTenants: Tenant[];
  isLoading: boolean;
  switchTenant: (tenantId: string) => void;
  updateTenantSettings: (newSettings: Partial<Tenant["settings"]>) => Promise<void>;
  updateTenantProfile: (newProfile: Partial<Tenant>) => Promise<void>;
  refreshTenantData: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant>(DEFAULT_TENANT);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([DEFAULT_TENANT]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTenantAndUser = async () => {
    try {
      const isImpersonating =
        typeof window !== "undefined" &&
        (sessionStorage.getItem("billease_is_impersonating") === "true" ||
          localStorage.getItem("billease_is_impersonating") === "true");
      const impersonatedTenantId =
        typeof window !== "undefined"
          ? sessionStorage.getItem("billease_active_tenant_id") ||
            localStorage.getItem("billease_active_tenant_id")
          : null;

      let tenantId = "";
      let registeredInfo: any = null;
      let tenantRow: any = null;
      let authUser: any = null;

      if (isImpersonating && impersonatedTenantId) {
        tenantId = impersonatedTenantId;
        AuthService.setActiveTenantId(tenantId);
        try {
          const res = await fetch(`/api/admin/impersonate?tenantId=${tenantId}`);
          if (res.ok) {
            const json = await res.json();
            if (json.tenant) {
              tenantRow = json.tenant;
            }
          }
        } catch (e) {
          console.warn("Could not fetch impersonated tenant via admin API:", e);
        }
      } else {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        authUser = supabaseUser;

        if (typeof window !== "undefined") {
          const regStr = localStorage.getItem("billease_registered_user");
          if (regStr) {
            try {
              registeredInfo = JSON.parse(regStr);
              if (registeredInfo.tenantId) {
                tenantId = registeredInfo.tenantId;
              }
            } catch (e) {}
          }
          const activeStored = localStorage.getItem("billease_active_tenant_id");
          if (activeStored && !tenantId) {
            tenantId = activeStored;
          }
        }

        if (authUser) {
          const appMeta = authUser.app_metadata || {};
          const userMeta = authUser.user_metadata || {};
          tenantId =
            appMeta.tenant_id ||
            userMeta.tenant_id ||
            tenantId ||
            (registeredInfo?.tenantId) ||
            `tenant-${authUser.id.slice(0, 8)}`;
        }

        if (!tenantId) {
          tenantId = "tenant-royal-events";
        }

        AuthService.setActiveTenantId(tenantId);

        // Fetch tenant row from supabase
        const { data: row } = await supabase
          .from("tenants")
          .select("*")
          .eq("id", tenantId)
          .single();
        tenantRow = row;
      }

      const businessName =
        tenantRow?.business_name ||
        (!isImpersonating && registeredInfo?.businessName) ||
        (!isImpersonating && authUser?.user_metadata?.business_name) ||
        "My Business Studio";

      const ownerName =
        tenantRow?.owner_name ||
        (!isImpersonating && (registeredInfo?.ownerName || registeredInfo?.email?.split("@")[0])) ||
        (!isImpersonating && authUser?.user_metadata?.owner_name) ||
        (!isImpersonating && authUser?.email?.split("@")[0]) ||
        "Account Owner";

      const phone =
        tenantRow?.phone ||
        (!isImpersonating && registeredInfo?.phone) ||
        (!isImpersonating && authUser?.user_metadata?.phone) ||
        "";

      const email =
        tenantRow?.email ||
        (!isImpersonating && registeredInfo?.email) ||
        (!isImpersonating && authUser?.email) ||
        "";

      const loadedTenant: Tenant = {
        id: tenantId,
        businessName: businessName,
        slug: businessName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        businessType: tenantRow?.business_type || "event_planner",
        ownerName: ownerName,
        email: email,
        phone: phone,
        gstin: tenantRow?.gstin || "",
        logoUrl: tenantRow?.logo_url || tenantRow?.settings?.logoUrl || (!isImpersonating ? registeredInfo?.logoUrl : undefined),
        signatureUrl: tenantRow?.signature_url || tenantRow?.settings?.signatureUrl || (!isImpersonating ? registeredInfo?.signatureUrl : undefined),
        address: tenantRow?.address || DEFAULT_TENANT.address,
        bankDetails: {
          ...DEFAULT_TENANT.bankDetails,
          ...(!isImpersonating ? (registeredInfo?.bankDetails || {}) : {}),
          ...(tenantRow?.bank_details || {}),
        },
        settings: {
          ...DEFAULT_TENANT.settings,
          ...(!isImpersonating ? (registeredInfo?.settings || {}) : {}),
          ...(tenantRow?.settings || {}),
          logoUrl: tenantRow?.logo_url || tenantRow?.settings?.logoUrl || (!isImpersonating ? registeredInfo?.logoUrl : undefined),
          signatureUrl: tenantRow?.signature_url || tenantRow?.settings?.signatureUrl || (!isImpersonating ? registeredInfo?.signatureUrl : undefined),
        },
        subscription: (() => {
          const storedSub = tenantRow?.settings?.subscription;
          if (storedSub) return storedSub;

          const createdMs = tenantRow?.created_at ? new Date(tenantRow.created_at).getTime() : Date.now();
          const trialEndMs = createdMs + 7 * 24 * 60 * 60 * 1000;
          const graceEndMs = trialEndMs + 48 * 60 * 60 * 1000;
          const isPastTrial = Date.now() > trialEndMs;

          return {
            plan: "trial" as const,
            status: isPastTrial ? ("trial_expired" as const) : ("trial_active" as const),
            trialStartDate: tenantRow?.created_at || new Date().toISOString(),
            trialEndDate: new Date(trialEndMs).toISOString(),
            gracePeriodEndsAt: new Date(graceEndMs).toISOString(),
          };
        })(),
        createdAt: tenantRow?.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const isSuperAdmin =
        !isImpersonating &&
        (email.toLowerCase() === "admin@billease.com" ||
          (typeof window !== "undefined" && localStorage.getItem("billease_super_admin_session") === "true"));

      const loadedUser: User = {
        id: isImpersonating ? `user-${tenantId}` : (registeredInfo?.tenantId || "user-active"),
        tenantId: tenantId,
        name: isSuperAdmin ? "Pramod" : ownerName,
        email: isSuperAdmin ? "admin@billease.com" : email,
        role: isSuperAdmin ? "super_admin" : "owner",
        createdAt: tenantRow?.created_at || new Date().toISOString(),
      };

      setCurrentTenant(loadedTenant);
      setCurrentUser(loadedUser);
      setAvailableTenants([loadedTenant]);
    } catch (err) {
      console.warn("Could not load dynamic tenant session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenantAndUser();

    // Listen for Supabase auth state changes (login, logout, signup)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadTenantAndUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const switchTenant = (tenantId: string) => {
    AuthService.setActiveTenantId(tenantId);
    setCurrentTenant((prev) => ({ ...prev, id: tenantId }));
  };

  const updateTenantSettings = async (newSettings: Partial<Tenant["settings"]>) => {
    const updatedSettings = {
      ...currentTenant.settings,
      ...newSettings,
    };

    setCurrentTenant((prev) => ({
      ...prev,
      settings: updatedSettings,
    }));

    if (typeof window !== "undefined") {
      try {
        const regStr = localStorage.getItem("billease_registered_user");
        const existing = regStr ? JSON.parse(regStr) : {};
        localStorage.setItem(
          "billease_registered_user",
          JSON.stringify({
            ...existing,
            tenantId: currentTenant.id,
            settings: updatedSettings,
          })
        );
      } catch (e) {
        console.warn("Failed to persist settings to localStorage:", e);
      }
    }

    try {
      await supabase
        .from("tenants")
        .update({ settings: updatedSettings })
        .eq("id", currentTenant.id);
    } catch (e) {
      console.error("Failed to persist tenant settings:", e);
    }
  };

  const updateTenantProfile = async (newProfile: Partial<Tenant>) => {
    const updated = {
      ...currentTenant,
      ...newProfile,
      address: {
        ...currentTenant.address,
        ...(newProfile.address || {}),
      },
      bankDetails: {
        ...currentTenant.bankDetails,
        ...(newProfile.bankDetails || {}),
      },
      settings: {
        ...currentTenant.settings,
        ...(newProfile.settings || {}),
        logoUrl: newProfile.logoUrl !== undefined ? newProfile.logoUrl : currentTenant.logoUrl,
        signatureUrl: newProfile.signatureUrl !== undefined ? newProfile.signatureUrl : currentTenant.signatureUrl,
      },
    };

    setCurrentTenant(updated);

    if (typeof window !== "undefined") {
      try {
        const regStr = localStorage.getItem("billease_registered_user");
        const existing = regStr ? JSON.parse(regStr) : {};
        localStorage.setItem(
          "billease_registered_user",
          JSON.stringify({
            ...existing,
            tenantId: currentTenant.id,
            businessName: updated.businessName,
            ownerName: updated.ownerName,
            email: updated.email,
            phone: updated.phone,
            logoUrl: updated.logoUrl,
            signatureUrl: updated.signatureUrl,
            gstin: updated.gstin,
            address: updated.address,
            bankDetails: updated.bankDetails,
            settings: updated.settings,
          })
        );
      } catch (e) {
        console.warn("Failed to persist profile to localStorage:", e);
      }
    }

    try {
      await supabase
        .from("tenants")
        .upsert([
          {
            id: currentTenant.id,
            business_name: updated.businessName,
            owner_name: updated.ownerName,
            phone: updated.phone,
            email: updated.email,
            gstin: updated.gstin || null,
            address: updated.address,
            bank_details: updated.bankDetails,
            settings: updated.settings,
            updated_at: new Date().toISOString(),
          },
        ]);
    } catch (e) {
      console.error("Failed to persist tenant profile:", e);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        currentUser,
        availableTenants,
        isLoading,
        switchTenant,
        updateTenantSettings,
        updateTenantProfile,
        refreshTenantData: loadTenantAndUser,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenantContext must be used within a TenantProvider");
  }
  return context;
}
