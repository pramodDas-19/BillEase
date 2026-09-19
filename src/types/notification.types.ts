// ============================================================================
// BILLEASE SAAS — NOTIFICATION & WEB PUSH TYPES
// ============================================================================

export type NotificationType =
  | "invoice_created"
  | "invoice_sent"
  | "invoice_due_soon"
  | "invoice_overdue"
  | "payment_received"
  | "payment_failed"
  | "quotation_created"
  | "quotation_accepted"
  | "quotation_rejected"
  | "quotation_converted"
  | "quotation_expiring"
  | "client_created"
  | "action_created"
  | "system"
  | "overdue"
  | "due_soon"
  | "quote_accepted";

export type NotificationEntityType =
  | "invoice"
  | "payment"
  | "quotation"
  | "client"
  | "system";

export interface NotificationRecord {
  id: string;
  tenant_id: string;
  user_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  action_url?: string | null;
  entity_type?: NotificationEntityType | null;
  entity_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  expires_at?: string | null;
  metadata?: Record<string, any> | null;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  clientPhone?: string;
  clientName?: string;
  amount?: number;
  entityType?: NotificationEntityType;
  entityId?: string;
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export interface PushSubscriptionRecord {
  id: string;
  tenant_id: string;
  user_id?: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

export interface NotificationPreferences {
  inAppEnabled: boolean;
  webPushEnabled: boolean;
  invoiceAlerts: boolean;
  paymentAlerts: boolean;
  quotationAlerts: boolean;
  overdueReminders: boolean;
  systemAlerts: boolean;
}
