// ============================================================================
// BILLEASE SAAS — CLIENT NOTIFICATION SERVICE
// Connects UI components to the persistent multi-tenant backend API
// ============================================================================

import { AppNotification, NotificationRecord } from "@/types/notification.types";
import { registerPushSubscription, requestPermissionAndSubscribe } from "@/lib/push-client";

export type { AppNotification };

const LEGACY_READ_KEY = "billease_read_notifs_v1";
const LEGACY_DISMISSED_KEY = "billease_dismissed_notifs_v1";
const LEGACY_CUSTOM_KEY = "billease_custom_notifs_v1";

export class NotificationService {
  private static isSyncingDues = false;

  /**
   * Registers browser service worker for push notifications (idempotent).
   */
  static async registerServiceWorker(): Promise<void> {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch (err) {
        console.warn("[NotificationService] ServiceWorker registration error:", err);
      }
    }
  }

  /**
   * Requests native push notification permission and persists subscription to backend
   */
  static async requestPermissionAndSendTest(): Promise<boolean> {
    const result = await requestPermissionAndSubscribe();
    return result.granted;
  }

  /**
   * Dispatches a custom business action event to the persistent backend.
   * Asynchronously triggers real Web Push notifications.
   */
  static async notifyAction(params: {
    type: AppNotification["type"];
    title: string;
    message: string;
    actionUrl?: string;
    clientName?: string;
    clientPhone?: string;
    amount?: number;
    entityType?: "invoice" | "payment" | "quotation" | "client" | "system";
    entityId?: string;
  }): Promise<void> {
    try {
      if (typeof window === "undefined") return;

      // Dispatch to backend API
      fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: params.type,
          title: params.title,
          message: params.message,
          actionUrl: params.actionUrl,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: {
            clientName: params.clientName,
            clientPhone: params.clientPhone,
            amount: params.amount,
          },
          sendPush: true,
        }),
      }).catch((err) => {
        console.warn("[NotificationService] notifyAction fetch warning:", err);
      });
    } catch (err) {
      console.warn("[NotificationService] Failed to notifyAction:", err);
    }
  }

  /**
   * Marks a specific notification as read in the backend.
   */
  static async markAsRead(id: string): Promise<void> {
    try {
      fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
      }).catch((err) => {
        console.warn("[NotificationService] markAsRead error:", err);
      });
    } catch {}
  }

  /**
   * Marks all notifications as read in the backend.
   */
  static async markAllAsRead(ids: string[] = []): Promise<void> {
    try {
      fetch("/api/notifications/read-all", {
        method: "POST",
      }).catch((err) => {
        console.warn("[NotificationService] markAllAsRead error:", err);
      });
    } catch {}
  }

  /**
   * Dismisses / deletes a notification in the backend.
   */
  static async dismissNotification(id: string): Promise<void> {
    try {
      fetch(`/api/notifications/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }).catch((err) => {
        console.warn("[NotificationService] dismissNotification error:", err);
      });
    } catch {}
  }

  /**
   * Clears all notifications in the backend.
   */
  static async clearAllNotifications(allIds: string[] = []): Promise<void> {
    try {
      fetch("/api/notifications/clear-all", {
        method: "POST",
      }).catch((err) => {
        console.warn("[NotificationService] clearAllNotifications error:", err);
      });
    } catch {}
  }

  /**
   * Formats relative timestamp
   */
  private static formatRelativeTime(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recently";
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHour = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHour / 24);

      if (diffMin < 2) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString();
    } catch {
      return "Recently";
    }
  }

  /**
   * One-time legacy localStorage data migration / cleanup
   */
  private static migrateLegacyStorageOnce(): void {
    if (typeof window === "undefined") return;
    try {
      const legacyCustom = localStorage.getItem(LEGACY_CUSTOM_KEY);
      if (legacyCustom) {
        localStorage.removeItem(LEGACY_CUSTOM_KEY);
      }
      localStorage.removeItem(LEGACY_READ_KEY);
      localStorage.removeItem(LEGACY_DISMISSED_KEY);
    } catch {}
  }

  /**
   * Fetches unread count quickly from the server.
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const json = await res.json();
        return json.unreadCount || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Loads notifications from the persistent multi-tenant backend API.
   */
  static async getNotifications(tab: string = "all"): Promise<AppNotification[]> {
    try {
      // 1. One-time legacy cleanup
      this.migrateLegacyStorageOnce();

      // 2. Trigger non-blocking due/overdue sync if not already syncing
      if (!this.isSyncingDues) {
        this.isSyncingDues = true;
        fetch("/api/notifications/sync-dues", { method: "POST" })
          .catch(() => {})
          .finally(() => {
            this.isSyncingDues = false;
          });
      }

      // 3. Fetch notifications from backend
      const res = await fetch(`/api/notifications?limit=40&tab=${encodeURIComponent(tab)}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        console.warn("[NotificationService] API returned status:", res.status);
        return [];
      }

      const json = await res.json();
      const records: NotificationRecord[] = json.notifications || [];

      return records.map((r): AppNotification => {
        const meta = r.metadata || {};
        return {
          id: r.id,
          type: r.type,
          title: r.title,
          message: r.message,
          timestamp: this.formatRelativeTime(r.created_at),
          isRead: r.is_read,
          actionUrl: r.action_url || undefined,
          clientName: meta.clientName || undefined,
          clientPhone: meta.clientPhone || undefined,
          amount: meta.amount !== undefined ? Number(meta.amount) : undefined,
          entityType: r.entity_type || undefined,
          entityId: r.entity_id || undefined,
        };
      });
    } catch (err: any) {
      console.warn("[NotificationService] Failed to load notifications:", err?.message);
      return [];
    }
  }

  static async getLiveNotifications(tab: string = "all"): Promise<AppNotification[]> {
    return this.getNotifications(tab);
  }
}
