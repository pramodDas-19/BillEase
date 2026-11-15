# BillEase: Live Inventory & Multi-User RBAC Architecture Plan
**Target Release**: Q4 2026 / Next Major Release  
**Plans Covered**: Pro Plan (Up to 3 Users), Ultra Pro Plan (Up to 10 Users + Full Live Inventory)  
**Workspace Rules Compliance**: Strict multi-tenant data isolation, GST-compliant, all-business inclusivity (services, goods, retail, agencies, SMBs).

---

## 1. Feature 1: Live Inventory Management System

### 1.1 Business Goals
- Support physical goods sellers, retail shops, traders, distributors, contractors, and hybrid service-product businesses (e.g. printing presses selling paper + design, event planners selling rentals + lighting).
- Real-time stock level synchronization: stock automatically decreases when an invoice is issued, and increases when an invoice is cancelled or returned.
- Eliminate overselling with low-stock warnings during quotation and invoice drafting.
- Complete audit trail of every stock change (Purchases, Sales, Manual Adjustments, Returns, Damaged items).

### 1.2 Data Model & Schema

#### A. Enhanced `products` (Inventory Items) Table
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold NUMERIC(12, 2) DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS selling_price NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'PCS';
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_sac_code VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) DEFAULT 18.0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS location_rack VARCHAR(100);
```

#### B. `stock_ledger` (Stock Audit Trail) Table
Every change in inventory creates an immutable ledger entry:
```sql
CREATE TABLE IF NOT EXISTS stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type VARCHAR(50) NOT NULL, -- 'INVOICE_SALE', 'INVOICE_CANCELLED', 'MANUAL_IN', 'MANUAL_OUT', 'PURCHASE_RECEIPT', 'DAMAGED_RETURN'
  quantity_changed NUMERIC(12, 2) NOT NULL, -- e.g. -5.00 or +10.00
  quantity_after NUMERIC(12, 2) NOT NULL,
  reference_id VARCHAR(100), -- invoice_id, purchase_id, etc.
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_ledger_tenant ON stock_ledger(tenant_id, product_id);
```

### 1.3 Core Business Workflows

1. **Auto-Deduction on Billing**:
   - When an invoice status moves to `paid` or `sent`, deduct `item.quantity` from `product.stock_quantity`.
   - Log entry in `stock_ledger` with `movement_type = 'INVOICE_SALE'`.
2. **Reversal on Cancellation**:
   - When an invoice is cancelled or deleted, restore the quantities back into stock with `movement_type = 'INVOICE_CANCELLED'`.
3. **Drafting Warnings**:
   - In the Invoice/Quote builder: If `item.quantity > product.stock_quantity`, show an amber warning pill: *"Only 3 PCS left in stock (Backorder)"* without hard-blocking unless the owner sets strict inventory lock in Settings.
4. **Low Stock Alerts & Dashboard Widget**:
   - Dashboard card surfacing all items where `stock_quantity <= low_stock_threshold`.
   - 1-click WhatsApp/Email supplier reorder message.
5. **Mobile Barcode Scanning**:
   - Web Barcode Detector API (`html5-qrcode` / native mobile camera) to quickly scan SKUs during billing and stock intake.

---

## 2. Feature 2: Multi-User Collaboration & Role-Based Access Control (RBAC)

### 2.1 The Business Need
A business owner needs their team to work together in the same account without sharing one password:
- **3 Inventory Updating Staff**: Updating stock, managing suppliers, recording deliveries.
- **5 Sales Persons**: Creating quotations, sending invoices, collecting payments on the road.
- **1 Accountant**: Exporting GSTR-1, reviewing tax breakdowns, checking bank reconciliations.
- **1 Owner / Admin**: Full permissions, financial visibility, subscription control.

### 2.2 Role Definitions & Permission Matrix

| Permission Area | Owner / Admin | Inventory Staff | Sales Rep | Accountant |
| :--- | :---: | :---: | :---: | :---: |
| **Max Users Supported** | 1 (All plans) | Ultra Pro (up to 10) | Pro (up to 3) / Ultra Pro | Ultra Pro |
| **View Invoices & Quotations** | Full | View Only (Optional) | Full (Own / All) | Full (Read-Only) |
| **Create Invoices & Quotes** | Yes | No | Yes | No |
| **Record Client Payments** | Yes | No | Yes | View Only |
| **View Net Profit & Company Margins** | Yes | No | No | Yes |
| **Manage Catalog & Inventory** | Full | Full (Stock In/Out) | View Only (Stock Qty) | View Only |
| **Stock Adjustments / Audits** | Full | Yes | No | No |
| **GST Reports (GSTR-1, GSTR-3B)** | Full | No | No | Full Export |
| **Subscription & Billing Settings** | Full | No | No | No |
| **Invite / Manage Team Members** | Full | No | No | No |

### 2.3 Multi-User Schema Design

#### `tenant_members` Table
```sql
CREATE TABLE IF NOT EXISTS tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'sales_rep', -- 'owner', 'admin', 'inventory_staff', 'sales_rep', 'accountant'
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_tenant_members ON tenant_members(tenant_id, role);
```

#### `tenant_invitations` Table
```sql
CREATE TABLE IF NOT EXISTS tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  token VARCHAR(100) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 User Onboarding & Invite Flow
1. **Invite Staff**:
   - Owner goes to `Settings > Team Members`.
   - Clicks `+ Invite Team Member`.
   - Enters Name, Email, and selects Role (`Inventory Staff`, `Sales Rep`, `Accountant`).
   - System checks plan limit (e.g. max 3 users on Pro, max 10 users on Ultra Pro).
2. **Joining the Business**:
   - Staff member receives invitation link (`/invite/[token]`).
   - Sets their own secure password.
   - Logs in directly into the business workspace.
3. **Session & Middleware Enforcement**:
   - User JWT stores `app_metadata.tenant_id` and `app_metadata.role`.
   - Next.js middleware and Supabase Row Level Security (RLS) enforce that `Inventory Staff` cannot access financial profit margins or subscription settings, and `Sales Reps` cannot delete stock items.

---

## 3. Phased Implementation Roadmap

### Phase 1: Live Inventory Management (Sprint 1)
- [ ] Add inventory columns to `products` table (`stock_quantity`, `low_stock_threshold`, `track_inventory`, `cost_price`).
- [ ] Create `stock_ledger` table and repository service.
- [ ] Build `/inventory` page:
  - Stock table with live filter: All, In Stock, Low Stock, Out of Stock.
  - Quick Stock In / Stock Out modal (+10, -5, Damaged, Restock).
- [ ] Auto-stock deduction hook when generating an invoice.
- [ ] Low-stock banner widget on main Dashboard.

### Phase 2: Team Members & RBAC (Sprint 2)
- [ ] Create `tenant_members` and `tenant_invitations` tables.
- [ ] Create `src/types/rbac.types.ts` and permission helper (`canUser(role, action)`).
- [ ] Build `Settings > Team Members` UI:
  - Active team list with roles and status.
  - Plan capacity meter (e.g. "3 of 10 Ultra Pro Seats Used").
  - Invite modal with role selector.
- [ ] Invite acceptance page `/invite/[token]`.
- [ ] Role enforcement in dashboard navigation (hide Reports for Sales/Inventory, hide Inventory for pure Sales).

### Phase 3: Mobile & Advanced Workflows (Sprint 3)
- [ ] Camera Barcode scanner integration for instant product selection.
- [ ] Multi-user activity audit logs (shows who created invoice #1001 or updated stock).
- [ ] CSV/Excel bulk inventory import/export.

