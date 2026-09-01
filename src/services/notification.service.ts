import { InvoiceService } from "./invoice.service";
import { PaymentService } from "./payment.service";
import { QuotationService } from "./quotation.service";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface AppNotification {
  id: string;
  type: "overdue" | "payment_received" | "quote_accepted" | "due_soon" | "action_created";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  clientPhone?: string;
  clientName?: string;
  amount?: number;
}

const READ_STORAGE_KEY = "billease_read_notifs_v1";
const DISMISSED_STORAGE_KEY = "billease_dismissed_notifs_v1";
const CUSTOM_STORAGE_KEY = "billease_custom_notifs_v1";

export class NotificationService {
  /**
   * Helper to get stored set of string IDs from localStorage
   */
  private static getStoredIds(key: string): Set<string> {
    if (typeof window === "undefined") return new Set();
    try {
      const item = localStorage.getItem(key);
      return item ? new Set(JSON.parse(item)) : new Set();
    } catch {
      return new Set();
    }
  }

  private static saveStoredIds(key: string, ids: Set<string>): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(ids)));
    } catch (err) {
      console.warn("Failed to persist notification state:", err);
    }
  }

  /**
   * Registers browser service worker for push notifications.
   */
  static async registerServiceWorker(): Promise<void> {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch (err) {
        console.warn("ServiceWorker registration error:", err);
      }
    }
  }

  /**
   * Triggers native desktop/mobile HTML5 Push Notification if permission is granted
   */
  static sendNativePush(title: string, body: string, url?: string): void {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          const n = new Notification(`🔔 BillEase: ${title}`, {
            body,
            icon: "/icon.png",
          });
          if (url) {
            n.onclick = () => {
              window.focus();
              window.location.href = url;
            };
          }
        } catch (err) {
          console.warn("Native notification dispatch failed:", err);
        }
      }
    }
  }

  /**
   * Requests native browser notification permission and sends a test alert.
   */
  static async requestPermissionAndSendTest(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      this.sendNativePush(
        "Push Notifications Active!",
        "You will receive instant alerts for payments, quotes, and overdue invoices."
      );
      return true;
    }

    return false;
  }

  /**
   * Records a custom application action event (Invoice created, Quote converted, Payment recorded, etc.)
   */
  static notifyAction(params: {
    type: AppNotification["type"];
    title: string;
    message: string;
    actionUrl?: string;
    clientName?: string;
    amount?: number;
  }): void {
    if (typeof window === "undefined") return;

    try {
      const customItem: AppNotification = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: params.type,
        title: params.title,
        message: params.message,
        timestamp: "Just now",
        isRead: false,
        actionUrl: params.actionUrl,
        clientName: params.clientName,
        amount: params.amount,
      };

      const existingRaw = localStorage.getItem(CUSTOM_STORAGE_KEY);
      const existing: AppNotification[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [customItem, ...existing].slice(0, 30);
      localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(updated));

      // Trigger native desktop push notification if enabled
      this.sendNativePush(params.title, params.message, params.actionUrl);
    } catch (err) {
      console.warn("Failed to record custom notification:", err);
    }
  }

  /**
   * Marks a specific notification ID as read
   */
  static markAsRead(id: string): void {
    const readIds = this.getStoredIds(READ_STORAGE_KEY);
    readIds.add(id);
    this.saveStoredIds(READ_STORAGE_KEY, readIds);
  }

  /**
   * Marks all provided notification IDs as read
   */
  static markAllAsRead(ids: string[]): void {
    const readIds = this.getStoredIds(READ_STORAGE_KEY);
    ids.forEach((id) => readIds.add(id));
    this.saveStoredIds(READ_STORAGE_KEY, readIds);
  }

  /**
   * Dismisses / deletes a notification
   */
  static dismissNotification(id: string): void {
    const dismissedIds = this.getStoredIds(DISMISSED_STORAGE_KEY);
    dismissedIds.add(id);
    this.saveStoredIds(DISMISSED_STORAGE_KEY, dismissedIds);

    // Also remove from custom notifications if present
    try {
      const existingRaw = localStorage.getItem(CUSTOM_STORAGE_KEY);
      if (existingRaw) {
        const existing: AppNotification[] = JSON.parse(existingRaw);
        const filtered = existing.filter((item) => item.id !== id);
        localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch {}
  }

  /**
   * Clears all notifications
   */
  static clearAllNotifications(allIds: string[]): void {
    const dismissedIds = this.getStoredIds(DISMISSED_STORAGE_KEY);
    allIds.forEach((id) => dismissedIds.add(id));
    this.saveStoredIds(DISMISSED_STORAGE_KEY, dismissedIds);
    localStorage.removeItem(CUSTOM_STORAGE_KEY);
  }

  /**
   * Generates dynamic live notifications with persistent read and dismissed tracking.
   */
  static async getLiveNotifications(): Promise<AppNotification[]> {
    try {
      const readIds = this.getStoredIds(READ_STORAGE_KEY);
      const dismissedIds = this.getStoredIds(DISMISSED_STORAGE_KEY);

      const [invoices, payments, quotations] = await Promise.all([
        InvoiceService.getInvoices(),
        PaymentService.getPayments(),
        QuotationService.getQuotations(),
      ]);

      const list: AppNotification[] = [];
      const today = new Date().toISOString().split("T")[0];

      // 1. Overdue Invoices
      (invoices || []).forEach((inv) => {
        if (inv.balanceDue > 0 && inv.dueDate && inv.dueDate < today) {
          const id = `notif-overdue-${inv.id}`;
          if (!dismissedIds.has(id)) {
            list.push({
              id,
              type: "overdue",
              title: `Overdue Invoice (${formatCurrency(inv.balanceDue, inv.currency)})`,
              message: `Invoice #${inv.invoiceNumber} for ${inv.clientName} is past its due date (${formatDate(inv.dueDate)}).`,
              timestamp: "Action Required",
              isRead: readIds.has(id),
              actionUrl: `/invoices/${inv.id}`,
              clientPhone: inv.clientPhone,
              clientName: inv.clientName,
              amount: inv.balanceDue,
            });
          }
        } else if (inv.balanceDue > 0 && inv.dueDate === today) {
          const id = `notif-due-today-${inv.id}`;
          if (!dismissedIds.has(id)) {
            list.push({
              id,
              type: "due_soon",
              title: `Payment Due Today (${formatCurrency(inv.balanceDue, inv.currency)})`,
              message: `Invoice #${inv.invoiceNumber} for ${inv.clientName} is due today.`,
              timestamp: "Due Today",
              isRead: readIds.has(id),
              actionUrl: `/invoices/${inv.id}`,
              clientPhone: inv.clientPhone,
              clientName: inv.clientName,
              amount: inv.balanceDue,
            });
          }
        }
      });

      // 2. Recent Payment Receipts
      (payments || []).slice(0, 5).forEach((p) => {
        const id = `notif-pay-${p.id}`;
        if (!dismissedIds.has(id)) {
          list.push({
            id,
            type: "payment_received",
            title: `Payment Received (${formatCurrency(p.amount, p.currency)})`,
            message: `Receipt #${p.paymentNumber} recorded for ${p.clientName} via ${p.paymentMethod.toUpperCase()}.`,
            timestamp: p.paymentDate ? formatDate(p.paymentDate) : "Recent",
            isRead: readIds.has(id),
            actionUrl: "/payments",
            clientName: p.clientName,
            amount: p.amount,
          });
        }
      });

      // 3. Converted Quotations
      (quotations || [])
        .filter((q) => q.status === "converted" || q.status === "accepted")
        .slice(0, 3)
        .forEach((q) => {
          const id = `notif-quote-conv-${q.id}`;
          if (!dismissedIds.has(id)) {
            list.push({
              id,
              type: "quote_accepted",
              title: `Quotation Converted (${formatCurrency(q.totalAmount, q.currency)})`,
              message: `Quotation #${q.quotationNumber} for ${q.clientName} was converted to an Invoice.`,
              timestamp: "Deal Won",
              isRead: readIds.has(id),
              actionUrl: `/invoices`,
              clientName: q.clientName,
              amount: q.totalAmount,
            });
          }
        });

      // 4. Custom App Actions Recorded
      try {
        const customRaw = localStorage.getItem(CUSTOM_STORAGE_KEY);
        if (customRaw) {
          const customList: AppNotification[] = JSON.parse(customRaw);
          customList.forEach((c) => {
            if (!dismissedIds.has(c.id)) {
              list.push({
                ...c,
                isRead: readIds.has(c.id),
              });
            }
          });
        }
      } catch {}

      return list;
    } catch (err) {
      console.error("Failed to generate live notifications:", err);
      return [];
    }
  }

  static async getNotifications(): Promise<AppNotification[]> {
    return this.getLiveNotifications();
  }
}
