-- ==============================================================================
-- MIGRATION: Add Secure Unguessable UUID public_token to Invoices & Quotations
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/butxutqhbhscbihunnwr/sql
-- ==============================================================================

-- 1. Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Add public_token to invoices with unique index
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS public_token UUID NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_public_token ON invoices(public_token);

-- 3. Add public_token to quotations with unique index
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS public_token UUID NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotations_public_token ON quotations(public_token);
