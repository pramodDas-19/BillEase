-- ==============================================================================
-- FIX SUPABASE PERMISSIONS & ACCESS POLICIES
-- Run this in your Supabase SQL Editor: (https://supabase.com/dashboard/project/butxutqhbhscbihunnwr/sql)
-- ==============================================================================

-- 1. Grant table access to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Alter default privileges so any future tables automatically have access
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 3. Ensure RLS allows reads, inserts, updates, and deletes
DROP POLICY IF EXISTS "Public full access to tenants" ON tenants;
DROP POLICY IF EXISTS "Public full access to clients" ON clients;
DROP POLICY IF EXISTS "Public full access to services" ON services;
DROP POLICY IF EXISTS "Public full access to quotations" ON quotations;
DROP POLICY IF EXISTS "Public full access to quotation_items" ON quotation_items;
DROP POLICY IF EXISTS "Public full access to invoices" ON invoices;
DROP POLICY IF EXISTS "Public full access to invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "Public full access to payments" ON payments;

CREATE POLICY "Public full access to tenants" ON tenants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to services" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to quotations" ON quotations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to quotation_items" ON quotation_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to invoice_items" ON invoice_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to payments" ON payments FOR ALL USING (true) WITH CHECK (true);
