"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Tenant, User } from "@/types";
import { MOCK_TENANTS, MOCK_USERS } from "@/mock/tenants.mock";

interface TenantContextType {
  currentTenant: Tenant;
  currentUser: User;
  availableTenants: Tenant[];
  switchTenant: (tenantId: string) => void;
  updateTenantSettings: (newSettings: Partial<Tenant["settings"]>) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [availableTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [currentTenant, setCurrentTenant] = useState<Tenant>(MOCK_TENANTS[0]);
  const [currentUser] = useState<User>(MOCK_USERS[0]);

  const switchTenant = (tenantId: string) => {
    const found = availableTenants.find((t) => t.id === tenantId);
    if (found) {
      setCurrentTenant(found);
    }
  };

  const updateTenantSettings = (newSettings: Partial<Tenant["settings"]>) => {
    setCurrentTenant((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
    }));
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        currentUser,
        availableTenants,
        switchTenant,
        updateTenantSettings,
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
