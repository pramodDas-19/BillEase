// ============================================================================
// BILLEASE SAAS — SERVER-SIDE NOTIFICATION & WEB PUSH SERVICE
// Production-ready, multi-tenant notification engine.
// ============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  NotificationRecord,
  NotificationType,
  NotificationEntityType,
  PushSubscriptionData,
} from "@/types/notification.types";
import {
  sendWebPushNotification,
  PushNotificationPayload,
} from "@/lib/web-push";

/**
 * Creates an authorized Supabase admin client for server operations
 */
function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export interface CreateNotificationParams {
  tenantId: string;
  userId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
  metadata?: Record<string, any> | null;
  dedupKey?: string;
  sendPush?: boolean;
}

export interface GetNotificationsOptions {
  page?: number;
  limit?: number;
  tab?: "all" | "dues" | "payments" | "activity";
  isRead?: boolean;
}

export class ServerNotificationService {
  /**
   * Creates and persists a notification with optional deduplication and Web Push delivery.
   * Guaranteed to be non-blocking and safe: will not throw errors to caller.
   */
  static async createNotification(
    params: CreateNotificationParams
  ): Promise<NotificationRecord | null> {
    try {
      if (!params.tenantId) {
        console.warn("[NotificationService] createNotification called without tenantId.");
        return null;
      }

      const supabase = getSupabaseAdmin();
      const metadata = { ...(params.metadata || {}) };

      if (params.dedupKey) {
        metadata.dedup_key = params.dedupKey;

        // Check for existing deduplicated notification for this tenant
        const { data: existing } = await supabase
          .from("notifications")
          .select("id, tenant_id, type, title, message, is_read, created_at")
          .eq("tenant_id", params.tenantId)
          .eq("metadata->>dedup_key", params.dedupKey)
          .maybeSingle();

        if (existing) {
          return existing as NotificationRecord;
        }
      }

      const newRecord = {
        tenant_id: params.tenantId,
        user_id: params.userId || null,
        type: params.type,
        title: params.title,
        message: params.message,
        action_url: params.actionUrl || null,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        is_read: false,
        metadata,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("notifications")
        .insert(newRecord)
        .select()
        .single();

      if (error) {
        console.warn("[NotificationService] Insert notification error:", error.message);
        return null;
      }

      // Best-effort non-blocking Web Push dispatch
      if (params.sendPush !== false) {
        this.sendPushToTenant(
          params.tenantId,
          {
            title: params.title,
            body: params.message,
            url: params.actionUrl || "/dashboard",
          },
          params.userId
        ).catch((pushErr) => {
          console.warn("[NotificationService] Web Push background dispatch warning:", pushErr);
        });
      }

      return data as NotificationRecord;
    } catch (err: any) {
      console.warn("[NotificationService] Failed to create notification:", err?.message);
      return null;
    }
  }

  /**
   * Retrieves paginated, tab-filtered notifications for a specific tenant.
   */
  static async getNotifications(
    tenantId: string,
    options: GetNotificationsOptions = {}
  ): Promise<{ notifications: NotificationRecord[]; unreadCount: number; total: number }> {
    try {
      if (!tenantId) {
        return { notifications: [], unreadCount: 0, total: 0 };
      }

      const supabase = getSupabaseAdmin();
      const limit = Math.min(options.limit || 30, 100);
      const page = Math.max(options.page || 1, 1);
      const offset = (page - 1) * limit;

      let query = supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("tenant_id", tenantId);

      // Tab filtering
      if (options.tab === "dues") {
        query = query.in("type", [
          "invoice_overdue",
          "invoice_due_soon",
          "overdue",
          "due_soon",
        ]);
      } else if (options.tab === "payments") {
        query = query.in("type", ["payment_received", "payment_failed"]);
      } else if (options.tab === "activity") {
        query = query.in("type", [
          "quote_accepted",
          "quotation_accepted",
          "quotation_converted",
          "action_created",
          "invoice_created",
          "quotation_created",
          "client_created",
        ]);
      }

      if (typeof options.isRead === "boolean") {
        query = query.eq("is_read", options.isRead);
      }

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.warn("[NotificationService] getNotifications error:", error.message);
        return { notifications: [], unreadCount: 0, total: 0 };
      }

      // Fast unread count query
      const { count: unreadCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_read", false);

      return {
        notifications: (data || []) as NotificationRecord[],
        unreadCount: unreadCount || 0,
        total: count || 0,
      };
    } catch (err: any) {
      console.warn("[NotificationService] getNotifications exception:", err?.message);
      return { notifications: [], unreadCount: 0, total: 0 };
    }
  }

  /**
   * Fast unread count query for the notification bell badge.
   */
  static async getUnreadCount(tenantId: string): Promise<number> {
    try {
      if (!tenantId) return 0;
      const supabase = getSupabaseAdmin();
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_read", false);

      if (error) {
        console.warn("[NotificationService] getUnreadCount error:", error.message);
        return 0;
      }
      return count || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Marks a specific notification as read.
   */
  static async markAsRead(tenantId: string, notificationId: string): Promise<boolean> {
    try {
      if (!tenantId || !notificationId) return false;
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId)
        .eq("tenant_id", tenantId);

      if (error) {
        console.warn("[NotificationService] markAsRead error:", error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn("[NotificationService] markAsRead exception:", err?.message);
      return false;
    }
  }

  /**
   * Marks all notifications for a tenant as read.
   */
  static async markAllAsRead(tenantId: string): Promise<boolean> {
    try {
      if (!tenantId) return false;
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenantId)
        .eq("is_read", false);

      if (error) {
        console.warn("[NotificationService] markAllAsRead error:", error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn("[NotificationService] markAllAsRead exception:", err?.message);
      return false;
    }
  }

  /**
   * Dismisses (deletes) a specific notification.
   */
  static async dismissNotification(
    tenantId: string,
    notificationId: string
  ): Promise<boolean> {
    try {
      if (!tenantId || !notificationId) return false;
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("tenant_id", tenantId);

      if (error) {
        console.warn("[NotificationService] dismissNotification error:", error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn("[NotificationService] dismissNotification exception:", err?.message);
      return false;
    }
  }

  /**
   * Clears all notifications for a tenant.
   */
  static async clearAllNotifications(tenantId: string): Promise<boolean> {
    try {
      if (!tenantId) return false;
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("tenant_id", tenantId);

      if (error) {
        console.warn("[NotificationService] clearAllNotifications error:", error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn("[NotificationService] clearAllNotifications exception:", err?.message);
      return false;
    }
  }

  /**
   * Scans invoices deterministically for due-soon and overdue items and generates deduplicated alerts.
   */
  static async syncDueNotifications(tenantId: string): Promise<{ createdCount: number }> {
    try {
      if (!tenantId) return { createdCount: 0 };
      const supabase = getSupabaseAdmin();

      const today = new Date().toISOString().split("T")[0];
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrow = tomorrowDate.toISOString().split("T")[0];

      // Fetch active unpaid invoices
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, client_name, client_phone, balance_due, due_date, currency")
        .eq("tenant_id", tenantId)
        .gt("balance_due", 0);

      if (error || !invoices) {
        return { createdCount: 0 };
      }

      let createdCount = 0;

      for (const inv of invoices) {
        const dueDate = inv.due_date;
        if (!dueDate) continue;

        const curr = inv.currency || "₹";
        const bal = inv.balance_due || 0;

        if (dueDate < today) {
          // Overdue invoice alert (1 deterministic alert per date)
          const dedupKey = `invoice_overdue:${inv.id}:${today}`;
          const res = await this.createNotification({
            tenantId,
            type: "invoice_overdue",
            title: `Overdue Invoice (${curr}${bal})`,
            message: `Invoice #${inv.invoice_number} for ${inv.client_name} is overdue (due ${dueDate}).`,
            actionUrl: `/invoices/${inv.id}`,
            entityType: "invoice",
            entityId: inv.id,
            dedupKey,
            metadata: {
              clientName: inv.client_name,
              clientPhone: inv.client_phone,
              amount: bal,
              invoiceNumber: inv.invoice_number,
              dueDate,
            },
            sendPush: false, // Don't spam push on background sync
          });
          if (res) createdCount++;
        } else if (dueDate === today) {
          // Due Today alert
          const dedupKey = `invoice_due_today:${inv.id}:${today}`;
          const res = await this.createNotification({
            tenantId,
            type: "invoice_due_soon",
            title: `Payment Due Today (${curr}${bal})`,
            message: `Invoice #${inv.invoice_number} for ${inv.client_name} is due today.`,
            actionUrl: `/invoices/${inv.id}`,
            entityType: "invoice",
            entityId: inv.id,
            dedupKey,
            metadata: {
              clientName: inv.client_name,
              clientPhone: inv.client_phone,
              amount: bal,
              invoiceNumber: inv.invoice_number,
              dueDate,
            },
            sendPush: false,
          });
          if (res) createdCount++;
        } else if (dueDate === tomorrow) {
          // Due Tomorrow alert
          const dedupKey = `invoice_due_soon:${inv.id}:${tomorrow}`;
          const res = await this.createNotification({
            tenantId,
            type: "invoice_due_soon",
            title: `Payment Due Tomorrow (${curr}${bal})`,
            message: `Invoice #${inv.invoice_number} for ${inv.client_name} is due tomorrow.`,
            actionUrl: `/invoices/${inv.id}`,
            entityType: "invoice",
            entityId: inv.id,
            dedupKey,
            metadata: {
              clientName: inv.client_name,
              clientPhone: inv.client_phone,
              amount: bal,
              invoiceNumber: inv.invoice_number,
              dueDate,
            },
            sendPush: false,
          });
          if (res) createdCount++;
        }
      }

      return { createdCount };
    } catch (err: any) {
      console.warn("[NotificationService] syncDueNotifications exception:", err?.message);
      return { createdCount: 0 };
    }
  }

  /**
   * Persists or updates a push subscription in the push_subscriptions table.
   */
  static async registerPushSubscription(params: {
    tenantId: string;
    userId?: string | null;
    subscription: PushSubscriptionData;
    userAgent?: string | null;
  }): Promise<boolean> {
    try {
      if (!params.tenantId || !params.subscription?.endpoint) {
        return false;
      }

      const supabase = getSupabaseAdmin();
      const { endpoint, keys } = params.subscription;

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          tenant_id: params.tenantId,
          user_id: params.userId || null,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: params.userAgent || null,
          is_active: true,
          updated_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );

      if (error) {
        console.warn("[NotificationService] registerPushSubscription error:", error.message);
        return false;
      }

      return true;
    } catch (err: any) {
      console.warn("[NotificationService] registerPushSubscription exception:", err?.message);
      return false;
    }
  }

  /**
   * Unregisters/deactivates a push subscription.
   */
  static async unregisterPushSubscription(
    tenantId: string,
    endpoint: string
  ): Promise<boolean> {
    try {
      if (!tenantId || !endpoint) return false;
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from("push_subscriptions")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("endpoint", endpoint)
        .eq("tenant_id", tenantId);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Sends a Web Push notification to all active devices registered under the tenant.
   * Cleans up dead/expired subscriptions (HTTP 404/410) automatically.
   */
  static async sendPushToTenant(
    tenantId: string,
    payload: PushNotificationPayload,
    targetUserId?: string | null
  ): Promise<{ sent: number; failed: number }> {
    try {
      if (!tenantId) return { sent: 0, failed: 0 };
      const supabase = getSupabaseAdmin();

      let query = supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      if (targetUserId) {
        query = query.eq("user_id", targetUserId);
      }

      const { data: subscriptions, error } = await query;
      if (error || !subscriptions || subscriptions.length === 0) {
        return { sent: 0, failed: 0 };
      }

      let sent = 0;
      let failed = 0;
      const deadEndpoints: string[] = [];

      for (const sub of subscriptions) {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const result = await sendWebPushNotification(pushSub as any, payload);
        if (result.success) {
          sent++;
        } else {
          failed++;
          if (result.isDead) {
            deadEndpoints.push(sub.endpoint);
          }
        }
      }

      // Deactivate dead endpoints to keep the database healthy
      if (deadEndpoints.length > 0) {
        await supabase
          .from("push_subscriptions")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in("endpoint", deadEndpoints);
      }

      return { sent, failed };
    } catch (err: any) {
      console.warn("[NotificationService] sendPushToTenant exception:", err?.message);
      return { sent: 0, failed: 0 };
    }
  }
}
