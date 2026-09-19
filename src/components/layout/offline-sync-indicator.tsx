"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ReceiptText,
  FileText,
  Users,
  CreditCard,
  X,
} from "lucide-react";
import { getPendingMutations, PendingMutation } from "@/lib/offline-queue";
import { runOfflineSync, initOfflineSyncListeners } from "@/lib/offline-sync-runner";

export function OfflineSyncIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingItems, setPendingItems] = useState<PendingMutation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadPending = async () => {
    try {
      const items = await getPendingMutations();
      setPendingItems(items);
    } catch {
      setPendingItems([]);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    initOfflineSyncListeners();
    loadPending();

    const handleOnline = () => {
      setIsOnline(true);
      loadPending();
    };

    const handleOffline = () => {
      setIsOnline(false);
      loadPending();
    };

    const handleQueueUpdated = () => {
      loadPending();
    };

    const handleDataSynced = () => {
      loadPending();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("billease:queue-updated", handleQueueUpdated);
    window.addEventListener("billease:data-synced", handleDataSynced);

    // Close popover on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("billease:queue-updated", handleQueueUpdated);
      window.removeEventListener("billease:data-synced", handleDataSynced);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    setSyncStatusMsg("Syncing changes with server...");
    try {
      const res = await runOfflineSync();
      await loadPending();
      if (res.synced > 0) {
        setSyncStatusMsg(`Successfully synced ${res.synced} item${res.synced > 1 ? "s" : ""}!`);
      } else if (res.failed > 0) {
        setSyncStatusMsg(`${res.failed} item${res.failed > 1 ? "s" : ""} could not be synced.`);
      } else {
        setSyncStatusMsg("Queue is up to date.");
      }
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } catch (err: any) {
      setSyncStatusMsg("Sync failed. Check your connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingCount = pendingItems.length;

  // If online and nothing is pending, render nothing to keep the header clean
  if (isOnline && pendingCount === 0) {
    return null;
  }

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "invoice":
        return <ReceiptText className="h-3.5 w-3.5 text-blue-600" />;
      case "quotation":
        return <FileText className="h-3.5 w-3.5 text-amber-600" />;
      case "client":
        return <Users className="h-3.5 w-3.5 text-emerald-600" />;
      case "payment":
        return <CreditCard className="h-3.5 w-3.5 text-purple-600" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Header Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-xs cursor-pointer ${
          !isOnline
            ? "bg-amber-500/10 border-amber-500/30 text-amber-800 hover:bg-amber-500/20"
            : "bg-blue-500/10 border-blue-500/30 text-blue-800 hover:bg-blue-500/20"
        }`}
        title={!isOnline ? "Working Offline" : `${pendingCount} items waiting to sync`}
        aria-label="Offline Sync Status"
      >
        {!isOnline ? (
          <CloudOff className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
        ) : (
          <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${isSyncing ? "animate-spin" : ""}`} />
        )}

        <span className="hidden sm:inline">
          {!isOnline
            ? pendingCount > 0
              ? `${pendingCount} to sync (Offline)`
              : "Offline"
            : `${pendingCount} waiting to sync`}
        </span>
        <span className="inline sm:hidden font-bold">
          {pendingCount > 0 ? pendingCount : "!"}
        </span>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200/90 shadow-xl z-50 overflow-hidden text-slate-800 animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Sync Queue
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isOnline
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isOnline ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                  }`}
                />
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Honest Status Banner */}
          <div className="px-4 py-2.5 bg-amber-50/70 border-b border-amber-100/60 text-[11px] text-amber-900 leading-relaxed">
            <div className="flex items-start gap-1.5">
              <CloudOff className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Saved locally</strong> — will sync when you&apos;re back online. Multi-device
                conflict merging is excluded to preserve financial integrity.
              </div>
            </div>
          </div>

          {syncStatusMsg && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-800 font-medium">
              {syncStatusMsg}
            </div>
          )}

          {/* List of Pending Items */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1">
            {pendingItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                Queue is empty. Everything is synced!
              </div>
            ) : (
              pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                      {getEntityIcon(item.entityType)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {item.displayTitle || `${item.entityType.toUpperCase()} #${item.entityId}`}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.action === "create" ? "New" : "Edit"} &bull;{" "}
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Item Status */}
                  <div className="shrink-0 ml-2">
                    {item.status === "pending" && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Waiting
                      </span>
                    )}
                    {item.status === "retrying" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Syncing
                      </span>
                    )}
                    {item.status === "failed" && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
                        title={item.errorMessage || "Failed"}
                      >
                        <AlertTriangle className="h-2.5 w-2.5" /> Error
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Action */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {pendingCount} pending item{pendingCount === 1 ? "" : "s"}
            </span>
            <button
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing || pendingCount === 0}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                !isOnline || pendingCount === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm cursor-pointer"
              }`}
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
