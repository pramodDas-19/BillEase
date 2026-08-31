-- ============================================================================
-- BillEase SaaS — Row-Level Security (RLS) Policies for Multi-Tenancy
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/butxutqhbhscbihunnwr/sql
-- ============================================================================

-- Enable RLS on all 8 tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- HELPER FUNCTION: Get Current Tenant ID from JWT or Default Demo
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS TEXT AS $$
BEGIN
    -- 1. Check if authenticated user has a tenant_id in JWT user_metadata
    IF (auth.jwt() -> 'user_metadata' ->> 'tenant_id') IS NOT NULL THEN
        RETURN (auth.jwt() -> 'user_metadata' ->> 'tenant_id');
    END IF;

    -- 2. Fallback to default demo tenant for local dev / unauthenticated demo
    RETURN 'tenant-royal-events';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 1. TENANTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own profile" ON tenants;
CREATE POLICY "Tenants can access own profile"
ON tenants FOR ALL
USING (id = current_tenant_id() OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 2. CLIENTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own clients" ON clients;
CREATE POLICY "Tenants can access own clients"
ON clients FOR ALL
USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 3. SERVICES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own services" ON services;
CREATE POLICY "Tenants can access own services"
ON services FOR ALL
USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 4. QUOTATIONS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own quotations" ON quotations;
CREATE POLICY "Tenants can access own quotations"
ON quotations FOR ALL
USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 5. QUOTATION ITEMS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own quotation items" ON quotation_items;
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

-- ----------------------------------------------------------------------------
-- 6. INVOICES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own invoices" ON invoices;
CREATE POLICY "Tenants can access own invoices"
ON invoices FOR ALL
USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 7. INVOICE ITEMS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own invoice items" ON invoice_items;
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

-- ----------------------------------------------------------------------------
-- 8. PAYMENTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants can access own payments" ON payments;
CREATE POLICY "Tenants can access own payments"
ON payments FOR ALL
USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');
