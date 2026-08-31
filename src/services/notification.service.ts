import { InvoiceService } from "./invoice.service";
import { PaymentService } from "./payment.service";
import { QuotationService } from "./quotation.service";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface AppNotification {
  id: string;
  type: "overdue" | "payment_received" | "quote_accepted" | "due_soon";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  clientPhone?: string;
  clientName?: string;
  amount?: number;
}

export class NotificationService {
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
   * Requests native browser notification permission and sends a test alert.
   */
  static async requestPermissionAndSendTest(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("🔔 BillEase Payment Alert", {
        body: "Web Push Notifications are active! You will receive instant alerts for payments and overdue invoices.",
        icon: "/assets/logo/favicon.png",
      });
      return true;
    }

    return false;
  }

  /**
   * Generates REAL dynamic notifications directly from Supabase invoices, payments, and quotations.
   */
  static async getLiveNotifications(): Promise<AppNotification[]> {
    try {
      const [invoices, payments, quotations] = await Promise.all([
        InvoiceService.getInvoices(),
        PaymentService.getPayments(),
        QuotationService.getQuotations(),
      ]);

      const notifications: AppNotification[] = [];
      const today = new Date().toISOString().split("T")[0];

      // 1. Check for real Overdue Invoices
      (invoices || []).forEach((inv) => {
        if (inv.balanceDue > 0 && inv.dueDate && inv.dueDate < today) {
          notifications.push({
            id: `notif-overdue-${inv.id}`,
            type: "overdue",
            title: `Overdue Invoice (${formatCurrency(inv.balanceDue, inv.currency)})`,
            message: `Invoice #${inv.invoiceNumber} for ${inv.clientName} is past its due date (${formatDate(inv.dueDate)}).`,
            timestamp: "Action Required",
            isRead: false,
            actionUrl: `/invoices/${inv.id}/preview`,
            clientPhone: inv.clientPhone,
            clientName: inv.clientName,
            amount: inv.balanceDue,
          });
        } else if (inv.balanceDue > 0 && inv.dueDate === today) {
          notifications.push({
            id: `notif-due-today-${inv.id}`,
            type: "due_soon",
            title: `Payment Due Today (${formatCurrency(inv.balanceDue, inv.currency)})`,
            message: `Invoice #${inv.invoiceNumber} for ${inv.clientName} is due today.`,
            timestamp: "Due Today",
            isRead: false,
            actionUrl: `/invoices/${inv.id}/preview`,
            clientPhone: inv.clientPhone,
            clientName: inv.clientName,
            amount: inv.balanceDue,
          });
        }
      });

      // 2. Add Recent Payment Receipts (up to 3)
      (payments || []).slice(0, 3).forEach((p) => {
        notifications.push({
          id: `notif-pay-${p.id}`,
          type: "payment_received",
          title: `Payment Received (${formatCurrency(p.amount, p.currency)})`,
          message: `Receipt #${p.paymentNumber} recorded for ${p.clientName} via ${p.paymentMethod.toUpperCase()}.`,
          timestamp: p.paymentDate ? formatDate(p.paymentDate) : "Recent",
          isRead: false,
          actionUrl: "/payments",
          clientName: p.clientName,
          amount: p.amount,
        });
      });

      // 3. Add Converted Quotation Alerts (up to 2)
      (quotations || [])
        .filter((q) => q.status === "converted" || q.status === "accepted")
        .slice(0, 2)
        .forEach((q) => {
          notifications.push({
            id: `notif-quote-conv-${q.id}`,
            type: "quote_accepted",
            title: `Quotation Converted (${formatCurrency(q.totalAmount, q.currency)})`,
            message: `Quotation #${q.quotationNumber} for ${q.clientName} has been converted into a Tax Invoice.`,
            timestamp: "Deal Won",
            isRead: false,
            actionUrl: "/invoices",
            clientName: q.clientName,
            amount: q.totalAmount,
          });
        });

      return notifications;
    } catch (err) {
      console.error("Failed to generate live notifications:", err);
      return [];
    }
  }

  static async getNotifications(): Promise<AppNotification[]> {
    return this.getLiveNotifications();
  }
}
