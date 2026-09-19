-- ============================================================================
-- BILLEASE SAAS — NOTIFICATIONS & WEB PUSH PERSISTENCE SCHEMA
-- Migration: 20260915_notifications_and_web_push.sql
-- ============================================================================

-- 1. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    entity_type TEXT,
    entity_id TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    web_push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    invoice_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    payment_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    quotation_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    overdue_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    system_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_user_prefs UNIQUE (tenant_id, user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE & FAST RETRIEVAL
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user_created 
    ON notifications(tenant_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_read 
    ON notifications(tenant_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_created 
    ON notifications(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_entity 
    ON notifications(entity_type, entity_id);

-- Deterministic Deduplication Unique Index (prevents multiple overdue/due-soon notifications on the same day)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup 
    ON notifications(tenant_id, (metadata->>'dedup_key')) 
    WHERE (metadata->>'dedup_key') IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_tenant_user 
    ON push_subscriptions(tenant_id, user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
    ON push_subscriptions(endpoint);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
DROP POLICY IF EXISTS "Tenants can access own notifications" ON notifications;
CREATE POLICY "Tenants can access own notifications"
ON notifications FOR ALL
USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- Push Subscriptions Policies
DROP POLICY IF EXISTS "Tenants can access own push subscriptions" ON push_subscriptions;
CREATE POLICY "Tenants can access own push subscriptions"
ON push_subscriptions FOR ALL
USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- Notification Preferences Policies
DROP POLICY IF EXISTS "Tenants can access own notification preferences" ON notification_preferences;
CREATE POLICY "Tenants can access own notification preferences"
ON notification_preferences FOR ALL
USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');
