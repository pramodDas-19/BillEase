"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { NotificationService, AppNotification } from "@/services/notification.service";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  X,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pushStatus, setPushStatus] = useState<string>("");

  useEffect(() => {
    setNotifications(NotificationService.getNotifications());
    NotificationService.registerServiceWorker();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleTestPush = async () => {
    const granted = await NotificationService.requestPermissionAndSendTest();
    if (granted) {
      setPushStatus("Push Notifications Enabled ✅");
      setTimeout(() => setPushStatus(""), 3000);
    } else {
      setPushStatus("Permission Denied / Blocked");
      setTimeout(() => setPushStatus(""), 3000);
    }
  };

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      case "payment_received":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "due_soon":
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications & Payment Alerts"
        className="clay-icon-squircle relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer shadow-2xs focus:outline-none"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="clay-card absolute right-0 mt-2.5 w-80 sm:w-96 p-4 z-50 bg-white border border-slate-200/80 rounded-2xl shadow-2xl animate-in fade-in-50 zoom-in-95 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Payment Alerts & Notifications
                </h4>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {unreadCount} New
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification Items List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {notifications.map((notif) => {
                const cleanPhone = notif.clientPhone ? notif.clientPhone.replace(/[^0-9]/g, "") : "";

                return (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border text-xs transition-all space-y-2 ${
                      notif.isRead
                        ? "bg-slate-50/50 border-slate-100 text-slate-600"
                        : "bg-emerald-50/30 border-emerald-100 text-slate-900 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200 shrink-0 shadow-2xs">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900 truncate">{notif.title}</p>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                          {notif.message}
                        </p>
                      </div>
                    </div>

                    {/* Quick WhatsApp Remind Trigger for Overdue alerts */}
                    {notif.type === "overdue" && cleanPhone && (
                      <div className="pt-1 flex items-center justify-end gap-2 border-t border-slate-100">
                        <a
                          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                            `Hello ${notif.clientName || "Client"}, this is a friendly reminder that your balance payment of ₹${(
                              notif.amount || 0
                            ).toLocaleString("en-IN")} is overdue. Kindly arrange for settlement today. Thank you!`
                          )}`}
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

            {/* Test Push Notifications Action Bar */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={handleTestPush}
                className="clay-tag inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-colors cursor-pointer"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>Test Web Push Notification</span>
              </button>

              {pushStatus && (
                <span className="text-[10px] font-bold text-emerald-700 animate-in fade-in">
                  {pushStatus}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
