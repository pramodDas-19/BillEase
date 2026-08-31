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

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    type: "overdue",
    title: "Overdue Invoice Alert (₹45,000)",
    message: "Invoice #INV-2026-003 for Apex Tech Solutions is 5 days overdue.",
    timestamp: "10 mins ago",
    isRead: false,
    actionUrl: "/invoices",
    clientPhone: "+919876543210",
    clientName: "Rahul Sharma (Apex Tech)",
    amount: 45000,
  },
  {
    id: "notif-2",
    type: "payment_received",
    title: "Payment Received (₹1,50,000)",
    message: "50% advance logged via UPI for Grand Hyatt Wedding Reception.",
    timestamp: "2 hours ago",
    isRead: false,
    actionUrl: "/payments",
    amount: 150000,
  },
  {
    id: "notif-3",
    type: "due_soon",
    title: "Payment Due Tomorrow (₹28,500)",
    message: "Invoice #INV-2026-008 for Horizon Media is due on 01 Sep 2026.",
    timestamp: "5 hours ago",
    isRead: true,
    actionUrl: "/invoices",
    clientPhone: "+919811122233",
    clientName: "Pooja Verma (Horizon Media)",
    amount: 28500,
  },
];

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
   * Retrieves active notification feed.
   */
  static getNotifications(): AppNotification[] {
    return INITIAL_NOTIFICATIONS;
  }
}
