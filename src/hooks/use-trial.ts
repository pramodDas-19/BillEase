"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTenantContext } from "@/context/tenant-context";
import { TrialLifecycleState, SubscriptionInfo } from "@/types";
import { InvoiceService } from "@/services/invoice.service";
import { TenantService } from "@/services/tenant.service";

import { computeTrialDetails } from "@/lib/trial-calculator";

export interface TrialStats {
  invoiceCount: number;
  totalBilled: number;
}

export function useTrial() {
  const { currentTenant, refreshTenantData } = useTenantContext();
  const [stats, setStats] = useState<TrialStats>({ invoiceCount: 0, totalBilled: 0 });
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallAction, setPaywallAction] = useState<string>("create_invoice");

  const sub = currentTenant?.subscription;

  // Real-time invoice stats for personalized value reinforcement
  useEffect(() => {
    let isMounted = true;
    if (currentTenant?.id) {
      InvoiceService.getInvoices().then((invoices) => {
        if (!isMounted) return;
        const count = invoices.length;
        const total = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        setStats({ invoiceCount: count, totalBilled: total });
      });
    }
    return () => {
      isMounted = false;
    };
  }, [currentTenant?.id]);

  // Compute exact trial status
  const trialDetails = useMemo(() => {
    return computeTrialDetails(sub);
  }, [sub]);

  // Check if a specific banner/modal is dismissed
  const isBannerDismissed = useCallback(
    (key: "day5" | "lastDay"): boolean => {
      if (typeof window === "undefined") return false;
      const stored = localStorage.getItem(`billease_dismissed_${key}_${currentTenant?.id || "default"}`);
      if (!stored) return false;

      const dismissedAt = parseInt(stored, 10);
      // Suppress Day 5 banner for 24h if dismissed
      if (key === "day5") {
        return Date.now() - dismissedAt < 24 * 60 * 60 * 1000;
      }
      // Suppress Day 7 modal indefinitely once dismissed
      return true;
    },
    [currentTenant?.id]
  );

  const dismissBanner = useCallback(
    (key: "day5" | "lastDay") => {
      if (typeof window === "undefined") return;
      localStorage.setItem(
        `billease_dismissed_${key}_${currentTenant?.id || "default"}`,
        Date.now().toString()
      );
    },
    [currentTenant?.id]
  );

  // Downgrade to Free Tier
  const downgradeToFree = useCallback(async () => {
    if (!currentTenant) return;
    const updated = await TenantService.updateSubscription(currentTenant.id, {
      plan: "free",
      status: "active",
      downgradeChoiceMadeAt: new Date().toISOString(),
    });
    if (updated) {
      await refreshTenantData();
      setIsPaywallOpen(false);
    }
  }, [currentTenant, refreshTenantData]);

  // Upgrade to Pro
  const upgradeToPro = useCallback(async () => {
    if (!currentTenant) return;
    const updated = await TenantService.updateSubscription(currentTenant.id, {
      plan: "pro_monthly",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (updated) {
      await refreshTenantData();
      setIsPaywallOpen(false);
    }
  }, [currentTenant, refreshTenantData]);

  // Guard action execution: if locked, open paywall modal and return false; otherwise execute and return true
  const checkCanPerformAction = useCallback(
    (actionName: string = "create_invoice"): boolean => {
      if (!trialDetails.canCreate) {
        setPaywallAction(actionName);
        setIsPaywallOpen(true);
        return false;
      }
      return true;
    },
    [trialDetails.canCreate]
  );

  return {
    ...trialDetails,
    stats,
    isPaywallOpen,
    setIsPaywallOpen,
    paywallAction,
    isBannerDismissed,
    dismissBanner,
    downgradeToFree,
    upgradeToPro,
    checkCanPerformAction,
  };
}
