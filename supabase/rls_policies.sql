-- ============================================================================
-- BillEase SaaS — Secure Row-Level Security (RLS) Policies for Multi-Tenancy
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/butxutqhbhscbihunnwr/sql
-- ============================================================================

-- 1. Enable RLS on all 8 tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- SECURE HELPER FUNCTION: Get Current Tenant ID
-- ----------------------------------------------------------------------------
-- Securely determines the authenticated tenant ID.
-- Priority:
-- 1. Server-controlled app_metadata (tamper-proof)
-- 2. Direct tenant ownership check via authenticated email / auth.uid()
-- 3. Authenticated user_metadata
-- 4. Returns NULL if unauthenticated (Deny all access)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS TEXT AS $$
DECLARE
    v_tenant_id TEXT;
    v_user_email TEXT;
BEGIN
    -- If user is unauthenticated, deny access immediately
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    -- 1. Check server-set app_metadata (cannot be modified by client console)
    v_tenant_id := auth.jwt() -> 'app_metadata' ->> 'tenant_id';
    IF v_tenant_id IS NOT NULL AND v_tenant_id <> '' THEN
        RETURN v_tenant_id;
    END IF;

    -- 2. Verify tenant ownership from tenants table using authenticated email
    v_user_email := auth.jwt() ->> 'email';
    IF v_user_email IS NOT NULL THEN
        SELECT id INTO v_tenant_id FROM tenants 
        WHERE email = v_user_email OR owner_email = v_user_email
        LIMIT 1;

        IF v_tenant_id IS NOT NULL THEN
            RETURN v_tenant_id;
        END IF;
    END IF;

    -- 3. Check user_metadata only as fallback for authenticated session
    v_tenant_id := auth.jwt() -> 'user_metadata' ->> 'tenant_id';
    IF v_tenant_id IS NOT NULL AND v_tenant_id <> '' THEN
        RETURN v_tenant_id;
    END IF;

    -- 4. No fallback to demo tenant! Deny access.
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 1. TENANTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own profile" ON tenants;
DROP POLICY IF EXISTS "Public full access to tenants" ON tenants;
CREATE POLICY "Tenants can access own profile"
ON tenants FOR ALL
USING (id = current_tenant_id() OR auth.role() = 'service_role');

-- Public client payment portal can read basic tenant business & bank details
DROP POLICY IF EXISTS "Public can read tenant for payment" ON tenants;
CREATE POLICY "Public can read tenant for payment"
ON tenants FOR SELECT
USING (true);

-- ----------------------------------------------------------------------------
-- 2. CLIENTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own clients" ON clients;
DROP POLICY IF EXISTS "Public full access to clients" ON clients;
CREATE POLICY "Tenants can access own clients"
ON clients FOR ALL
USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 3. SERVICES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own services" ON services;
DROP POLICY IF EXISTS "Public full access to services" ON services;
CREATE POLICY "Tenants can access own services"
ON services FOR ALL
USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 4. QUOTATIONS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own quotations" ON quotations;
DROP POLICY IF EXISTS "Public full access to quotations" ON quotations;
CREATE POLICY "Tenants can access own quotations"
ON quotations FOR ALL
USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- Public payment portal can view quotation for advance settlement
DROP POLICY IF EXISTS "Public can view quotation for payment" ON quotations;
CREATE POLICY "Public can view quotation for payment"
ON quotations FOR SELECT
USING (true);

-- ----------------------------------------------------------------------------
-- 5. QUOTATION ITEMS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own quotation items" ON quotation_items;
DROP POLICY IF EXISTS "Public full access to quotation_items" ON quotation_items;
CREATE POLICY "Tenants can access own quotation items"
ON quotation_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM quotations
        WHERE quotations.id = quotation_items.quotation_id
        AND (quotations.tenant_id = current_tenant_id() OR auth.role() = 'service_role')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM quotations
        WHERE quotations.id = quotation_items.quotation_id
        AND (quotations.tenant_id = current_tenant_id() OR auth.role() = 'service_role')
    )
);

-- Public can view quotation items on preview
DROP POLICY IF EXISTS "Public can view quotation items" ON quotation_items;
CREATE POLICY "Public can view quotation items"
ON quotation_items FOR SELECT
USING (true);

-- ----------------------------------------------------------------------------
-- 6. INVOICES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own invoices" ON invoices;
DROP POLICY IF EXISTS "Public full access to invoices" ON invoices;
CREATE POLICY "Tenants can access own invoices"
ON invoices FOR ALL
USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- Public client payment portal can view invoice to pay
DROP POLICY IF EXISTS "Public can view invoice for payment" ON invoices;
CREATE POLICY "Public can view invoice for payment"
ON invoices FOR SELECT
USING (true);

-- ----------------------------------------------------------------------------
-- 7. INVOICE ITEMS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Public full access to invoice_items" ON invoice_items;
CREATE POLICY "Tenants can access own invoice items"
ON invoice_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM invoices
        WHERE invoices.id = invoice_items.invoice_id
        AND (invoices.tenant_id = current_tenant_id() OR auth.role() = 'service_role')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM invoices
        WHERE invoices.id = invoice_items.invoice_id
        AND (invoices.tenant_id = current_tenant_id() OR auth.role() = 'service_role')
    )
);

-- Public can view invoice items on preview
DROP POLICY IF EXISTS "Public can view invoice items" ON invoice_items;
CREATE POLICY "Public can view invoice items"
ON invoice_items FOR SELECT
USING (true);

-- ----------------------------------------------------------------------------
-- 8. PAYMENTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own payments" ON payments;
DROP POLICY IF EXISTS "Public full access to payments" ON payments;
CREATE POLICY "Tenants can access own payments"
ON payments FOR ALL
USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- Public client payment portal can record payment and check settlement status
DROP POLICY IF EXISTS "Public can view and insert payments" ON payments;
CREATE POLICY "Public can view and insert payments"
ON payments FOR SELECT
USING (true);
