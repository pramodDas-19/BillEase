-- ============================================================================
-- BILLEASE POSTGRESQL MASTER DATABASE SCHEMA
-- Multi-Tenant SMB Billing & Invoicing Platform
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS TABLE (Business Profiles & Configurations)
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    gstin TEXT,
    website TEXT,
    address JSONB DEFAULT '{"street": "", "city": "", "state": "", "pincode": ""}'::jsonb,
    bank_details JSONB DEFAULT '{"bankName": "HDFC Bank", "accountNumber": "", "ifscCode": "", "upiId": ""}'::jsonb,
    settings JSONB DEFAULT '{"quotationPrefix": "QT-", "invoicePrefix": "INV-", "enableGstByDefault": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLIENTS TABLE (Customer Directory & Ledgers)
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY DEFAULT ('client-' || substr(md5(random()::text), 1, 8)),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company_name TEXT,
    email TEXT,
    phone TEXT NOT NULL,
    gstin TEXT,
    address TEXT,
    segment_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    total_billed NUMERIC(12, 2) DEFAULT 0.00,
    total_paid NUMERIC(12, 2) DEFAULT 0.00,
    balance_due NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SERVICES TABLE (Pricing & Catalog Items)
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY DEFAULT ('srv-' || substr(md5(random()::text), 1, 8)),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    rate NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'pcs',
    hsn_sac TEXT,
    gst_rate NUMERIC(5, 2) DEFAULT 18.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. QUOTATIONS TABLE
CREATE TABLE IF NOT EXISTS quotations (
    id TEXT PRIMARY KEY DEFAULT ('qt-' || substr(md5(random()::text), 1, 8)),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    quotation_number TEXT NOT NULL,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    client_gstin TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, accepted, rejected, expired, converted
    currency TEXT NOT NULL DEFAULT 'INR',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_type TEXT DEFAULT 'percentage',
    discount_value NUMERIC(10, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    is_tax_enabled BOOLEAN DEFAULT TRUE,
    total_tax NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    terms_and_conditions TEXT,
    notes TEXT,
    converted_to_invoice_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. QUOTATION ITEMS TABLE
CREATE TABLE IF NOT EXISTS quotation_items (
    id TEXT PRIMARY KEY DEFAULT ('item-' || substr(md5(random()::text), 1, 8)),
    quotation_id TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    detailed_notes TEXT,
    quantity NUMERIC(10, 2) DEFAULT 1,
    unit TEXT DEFAULT 'pcs',
    rate NUMERIC(10, 2) DEFAULT 0.00,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- 6. INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY DEFAULT ('inv-' || substr(md5(random()::text), 1, 8)),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    quotation_id TEXT REFERENCES quotations(id) ON DELETE SET NULL,
    quotation_number TEXT,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    client_gstin TEXT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'due', -- draft, sent, due, partially_paid, paid, overdue, cancelled
    currency TEXT NOT NULL DEFAULT 'INR',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_type TEXT DEFAULT 'percentage',
    discount_value NUMERIC(10, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    is_tax_enabled BOOLEAN DEFAULT TRUE,
    total_tax NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    terms_and_conditions TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INVOICE ITEMS TABLE
CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY DEFAULT ('inv-item-' || substr(md5(random()::text), 1, 8)),
    invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    detailed_notes TEXT,
    quantity NUMERIC(10, 2) DEFAULT 1,
    unit TEXT DEFAULT 'pcs',
    rate NUMERIC(10, 2) DEFAULT 0.00,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- 8. PAYMENTS TABLE (Receipts Ledger)
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY DEFAULT ('pay-' || substr(md5(random()::text), 1, 8)),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payment_number TEXT NOT NULL,
    invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL, -- upi, bank_transfer, cash, cheque, card, online, other
    transaction_reference TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR INSTANT RETRIEVAL & HIGH PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotations_tenant ON quotations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- ============================================================================
-- SEED INITIAL BUSINESS RECORD (Royal Events & Creative Prints)
-- ============================================================================
INSERT INTO tenants (
    id,
    business_name,
    owner_name,
    email,
    phone,
    gstin,
    website,
    address,
    bank_details,
    settings
) VALUES (
    'tenant-royal-events',
    'Royal Events & Creative Prints',
    'Pramod Das',
    'pramod@royalevents.example.com',
    '+91 98201 22334',
    '27AAACS1429B1Z5',
    'https://royalevents.example.com',
    '{"street": "Level 3, Royal Square, MG Road", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}'::jsonb,
    '{"bankName": "HDFC Bank Ltd", "accountNumber": "50200088991122", "ifscCode": "HDFC0001234", "upiId": "royalevents@okhdfcbank"}'::jsonb,
    '{"quotationPrefix": "QT-", "invoicePrefix": "INV-", "enableGstByDefault": true}'::jsonb
) ON CONFLICT (id) DO NOTHING;
