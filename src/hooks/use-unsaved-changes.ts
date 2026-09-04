"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export interface UseUnsavedChangesOptions {
  isDirty: boolean;
  isSubmitting?: boolean;
  documentType?: string;
}

export function useUnsavedChanges({
  isDirty,
  isSubmitting = false,
  documentType = "document",
}: UseUnsavedChangesOptions) {
  const router = useRouter();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const isBypassingRef = useRef(false);

  const bypassWarning = useCallback(() => {
    isBypassingRef.current = true;
    setShowWarningModal(false);
    setPendingUrl(null);
  }, []);

  // 1. Browser reload & close tab guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting && !isBypassingRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, isSubmitting]);

  // 2. Intercept in-app internal navigation (sidebar links, top bar links, back button links)
  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const handleClickCapture = (e: MouseEvent) => {
      if (isBypassingRef.current) return;

      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore anchor jumps, javascript:, mailto:, tel:, or new tab opens
      if (
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        target.getAttribute("download") !== null
      ) {
        return;
      }

      // Check if it's external link
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) {
          return;
        }

        // Compare pathname + search
        const currentPathWithSearch = window.location.pathname + window.location.search;
        const targetPathWithSearch = url.pathname + url.search;

        if (currentPathWithSearch === targetPathWithSearch) {
          return;
        }

        // It is an internal route change! Stop navigation and open warning modal
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        setPendingUrl(targetPathWithSearch);
        setShowWarningModal(true);
      } catch {
        // In case of invalid URL parsing, allow default behavior
      }
    };

    // Capture phase listener to catch clicks before Next.js Link handles them
    document.addEventListener("click", handleClickCapture, true);
    return () => {
      document.removeEventListener("click", handleClickCapture, true);
    };
  }, [isDirty, isSubmitting]);

  // 3. Browser Back / Forward Button Interception
  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    // Push dummy history entry so back button doesn't leave immediately
    window.history.pushState({ guard: true }, "", window.location.href);

    const handlePopState = () => {
      if (isBypassingRef.current) return;

      if (isDirty && !isSubmitting) {
        // Re-push state so page stays on current URL
        window.history.pushState({ guard: true }, "", window.location.href);
        setPendingUrl("__HISTORY_BACK__");
        setShowWarningModal(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirty, isSubmitting]);

  // Confirm navigation (User chose "Discard & Leave")
  const confirmLeave = useCallback(() => {
    isBypassingRef.current = true;
    setShowWarningModal(false);

    if (pendingUrl === "__HISTORY_BACK__") {
      window.history.go(-2);
    } else if (pendingUrl) {
      router.push(pendingUrl);
    }
  }, [pendingUrl, router]);

  // Cancel navigation (User chose "Stay & Keep Editing")
  const cancelLeave = useCallback(() => {
    setShowWarningModal(false);
    setPendingUrl(null);
  }, []);

  // Programmatic navigation with guard (for Cancel buttons etc.)
  const navigateWithGuard = useCallback(
    (url: string) => {
      if (isDirty && !isSubmitting && !isBypassingRef.current) {
        setPendingUrl(url);
        setShowWarningModal(true);
      } else {
        router.push(url);
      }
    },
    [isDirty, isSubmitting, router]
  );

  return {
    showWarningModal,
    confirmLeave,
    cancelLeave,
    bypassWarning,
    navigateWithGuard,
    documentType,
  };
}
