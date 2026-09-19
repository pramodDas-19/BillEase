"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NotificationService, AppNotification } from "@/services/notification.service";
import { getWhatsAppReminderUrl } from "@/lib/whatsapp";
import { useTenant } from "@/hooks/use-tenant";
import { cn } from "@/lib/utils";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  CheckCheck,
  X,
  FileText,
  PlusCircle,
  Loader2,
  Volume2,
} from "lucide-react";

export function NotificationDropdown() {
  const router = useRouter();
  const { currentTenant } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [selectedTab, setSelectedTab] = useState<"all" | "dues" | "payments" | "activity">("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pushStatus, setPushStatus] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Register service worker once on mount
  useEffect(() => {
    NotificationService.registerServiceWorker();
  }, []);

  // Fetch unread count for badge
  const fetchUnreadCount = useCallback(async () => {
    const count = await NotificationService.getUnreadCount();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    // Refresh unread count periodically
    const interval = setInterval(fetchUnreadCount, 45000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Load notifications for active tab
  const loadNotifications = useCallback(async (tab: string) => {
    setIsLoading(true);
    try {
      const data = await NotificationService.getLiveNotifications(tab);
      setNotifications(data || []);
      // Recalculate unread count
      const unread = (data || []).filter((n) => !n.isRead).length;
      if (tab === "all") {
        setUnreadCount(unread);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // When dropdown opens or selected tab changes, fetch notifications
  useEffect(() => {
    if (isOpen) {
      loadNotifications(selectedTab);
    }
  }, [isOpen, selectedTab, loadNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    const ids = notifications.map((n) => n.id);
    NotificationService.markAllAsRead(ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleDismissOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    NotificationService.dismissNotification(id);
    setNotifications((prev) => {
      const item = prev.find((n) => n.id === id);
      if (item && !item.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  };

  const handleClearAll = () => {
    const ids = notifications.map((n) => n.id);
    NotificationService.clearAllNotifications(ids);
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleItemClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      NotificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setIsOpen(false);
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  const handleTestPush = async () => {
    const granted = await NotificationService.requestPermissionAndSendTest();
    if (granted) {
      setPushStatus("Push Active ✅");
      setTimeout(() => setPushStatus(""), 3500);
    } else {
      setPushStatus("Denied / Blocked");
      setTimeout(() => setPushStatus(""), 3500);
    }
  };

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "overdue":
      case "invoice_overdue":
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      case "due_soon":
      case "invoice_due_soon":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "payment_received":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "quote_accepted":
      case "quotation_accepted":
      case "quotation_converted":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "action_created":
      case "invoice_created":
      case "quotation_created":
        return <PlusCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button with Active Badge */}
      <button
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
        }}
        title="Notifications & Payment Alerts"
        className="clay-icon-squircle relative flex h-9.5 w-9.5 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer shadow-2xs focus:outline-none min-h-[38px] min-w-[38px]"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Direct Dropdown (Viewport Safe on Mobile) */}
      {isOpen && (
        <div className="fixed sm:absolute top-18 sm:top-full left-3 sm:left-auto right-3 sm:right-0 mt-1 sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-96 p-4 z-40 bg-white border border-slate-200/90 rounded-2xl shadow-2xl space-y-3 animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Notifications & Alerts
              </h4>
              {unreadCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {unreadCount} New
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  0 New
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {[
              { id: "all", label: "All" },
              { id: "dues", label: "Dues & Overdue" },
              { id: "payments", label: "Payments" },
              { id: "activity", label: "Activity" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.id as any)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                  selectedTab === tab.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/60"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification Items List */}
          {isLoading ? (
            <div className="text-center py-8 space-y-2">
              <Loader2 className="h-6 w-6 mx-auto animate-spin text-emerald-600" />
              <p className="text-xs font-semibold text-slate-500">Loading alerts...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="h-10 w-10 mx-auto rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                <CheckCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">All Caught Up!</p>
                <p className="text-[11px] text-slate-400">Zero alerts in this view.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {notifications.map((notif) => {
                const cleanPhone = notif.clientPhone ? notif.clientPhone.replace(/[^0-9]/g, "") : "";
                const isOverdue = notif.type === "overdue" || notif.type === "invoice_overdue";

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={cn(
                      "p-3 rounded-xl border text-xs transition-all space-y-2 relative group cursor-pointer",
                      notif.isRead
                        ? "bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-100/70"
                        : "bg-emerald-50/30 border-emerald-100 text-slate-900 shadow-2xs hover:bg-emerald-50/60"
                    )}
                  >
                    {/* Dismiss (✕) Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDismissOne(notif.id, e)}
                      title="Delete Notification"
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition-all opacity-70 group-hover:opacity-100 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-start gap-2.5 pr-6">
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200 shrink-0 shadow-2xs">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900 truncate">{notif.title}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                          {notif.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* WhatsApp Reminder for Overdue Alerts */}
                    {isOverdue && cleanPhone && (
                      <div
                        className="pt-1 flex items-center justify-end gap-2 border-t border-slate-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={getWhatsAppReminderUrl({
                            clientPhone: notif.clientPhone || "",
                            clientName: notif.clientName || "Client",
                            balanceDue: notif.amount || 0,
                            invoiceId: notif.actionUrl?.replace("/invoices/", ""),
                            businessName: currentTenant?.businessName,
                            currency: currentTenant?.settings?.defaultCurrency || "INR",
                            customTemplate: currentTenant?.settings?.whatsappReminderTemplate,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="clay-tag inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs transition-colors cursor-pointer"
                        >
                          <MessageSquare className="h-3 w-3 text-amber-600" />
                          <span>1-Click WhatsApp Remind</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer: Web Push Registration Trigger */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestPush}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <Volume2 className="h-3 w-3" />
              <span>Enable Web Push Alerts</span>
            </button>
            {pushStatus && (
              <span className="text-[10px] font-bold text-emerald-600 animate-fade-in">
                {pushStatus}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
