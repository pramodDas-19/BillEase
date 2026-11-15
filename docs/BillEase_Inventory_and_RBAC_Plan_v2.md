# BillEase: Live Inventory & Multi-User RBAC Plan (v2, corrected)

**Target release:** Q4 2026
**Plans covered:** Pro (up to 3 seats) and Ultra Pro (up to 10 seats + full live inventory)
**Rules:** strict multi-tenant isolation, GST-compliant, works for services, goods and hybrid businesses.

This version replaces the first draft. It fixes the issues found in review: missing RLS, UI-only role checks, double stock deduction, race conditions, cost-price leakage, tenant ID type mismatch, loose invite rules, and a late `created_by`.

---

## 0. Decisions locked before building

| # | Decision | Value |
|---|---|---|
| D1 | Seat count includes the owner | Yes. Pro = owner + 2 staff. Ultra Pro = owner + 9 staff. |
| D2 | Users per tenant | One tenant per user in v1 (`app_metadata.tenant_id` holds a single value). |
| D3 | Roles | `owner`, `inventory_staff`, `sales_rep`, `accountant`. No separate `admin` in v1 (owner only). |
| D4 | Sales rep visibility | Setting per tenant: "Own records only" (default) or "All records". |
| D5 | Stock deduction moment | Once, when an invoice leaves draft (becomes issued). Never on `paid`. Quotations never deduct. |
| D6 | Negative stock | Allowed by default (backorder warning). Optional strict mode blocks it. |
| D7 | Reversals | Cancelling an issued invoice or a credit note restores stock. Issued invoices are never hard-deleted. |
| D8 | Source of truth for stock | `stock_ledger` (append-only). `products.stock_quantity` is a cached running total updated only by database functions. |
| D9 | Cost price | Stored in a separate restricted table, never on `products`. |
| D10 | Out of scope | Purchase GST and input tax credit, multi-warehouse, batch/expiry tracking, full purchase orders. |

**Verify first (blockers):**

1. The real type of `tenants.id`. Your `provision-tenant` route creates IDs like `tenant-<slug>-<4 digits>`, which is text, not UUID. Every `tenant_id` column below uses `TEXT`. Change it to match whatever `tenants.id` really is.
2. How invoice line items are stored (a table, or JSON inside `invoices`). The stock function in Phase 2 must read the real structure.
3. The name of the existing products/catalog table. This plan calls it `products`.

---

## 1. Build order

| Phase | Name | Why this order |
|---|---|---|
| 0 | Foundation | RLS helpers and `created_by` must exist before anything else uses them. |
| 1 | Team & RBAC | Changes the security foundation. Doing inventory first would mean writing its policies twice. |
| 2 | Live Inventory | Built on the role system. |
| 3 | Advanced | Barcode, audit log UI, bulk import. |

Do the audit items from `BillEase_Full_Audit` (push notifications, rate limiters, payment atomicity, GSTIN/state fallback) before or alongside Phase 0. They are independent of this plan.

---

## 2. Phase 0: Foundation

### 2.1 Add `created_by` everywhere (Sprint 0)

```sql
ALTER TABLE invoices    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE quotations  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE payments    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE clients     ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
```

- Existing rows stay `NULL` (treated as "owner-created").
- Services must set `created_by = auth.uid()` on every insert.
- Needed for "own records only" and for the audit log.

### 2.2 Team tables

```sql
CREATE TABLE IF NOT EXISTS tenant_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,  -- match tenants.id type
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('owner','inventory_staff','sales_rep','accountant')),
  display_name  TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  invited_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email),
  UNIQUE (user_id)                       -- D2: one tenant per user
);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members (tenant_id, role);

-- One owner per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_one_owner
  ON tenant_members (tenant_id) WHERE role = 'owner';

CREATE TABLE IF NOT EXISTS tenant_invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('inventory_staff','sales_rep','accountant')),
  token_hash    TEXT NOT NULL UNIQUE,    -- SHA-256 of the token; the raw token is only in the email link
  expires_at    TIMESTAMPTZ NOT NULL,    -- now() + 72 hours
  accepted_at   TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  invited_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON tenant_invitations (tenant_id);
```

### 2.3 Backfill owners (required)

Every existing tenant needs an `owner` row, or the new RLS will lock owners out.

```sql
-- Adapt column names to your tenants table
INSERT INTO tenant_members (tenant_id, user_id, role, display_name, email)
SELECT t.id, u.id, 'owner', COALESCE(t.owner_name, u.email), u.email
FROM tenants t
JOIN auth.users u ON u.email = t.owner_email   -- or however ownership is stored today
ON CONFLICT DO NOTHING;
```

Run it, then check: `SELECT count(*) FROM tenants` must equal the number of `owner` rows.

### 2.4 RLS helper functions

```sql
-- Active role of the current user inside their current tenant (NULL if none)
CREATE OR REPLACE FUNCTION current_member_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.role
  FROM tenant_members m
  WHERE m.user_id = auth.uid()
    AND m.tenant_id = current_tenant_id()
    AND m.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION has_role(VARIADIC allowed TEXT[])
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_member_role() = ANY (allowed), false);
$$;
```

Why this reads the table and not only the JWT: if staff are deactivated or their role changes, access changes on the very next request. A JWT-only check stays valid until the token refreshes.

### 2.5 Fix `current_tenant_id()`

- Keep reading `app_metadata.tenant_id` (set by the server only).
- Remove or restrict the email-ownership fallback so it can never resolve a tenant for someone who is not an active row in `tenant_members`.
- Never read `user_metadata`.

### 2.6 RLS on the new tables

```sql
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;

-- Members: everyone in the tenant can see the team list; only owner changes it
CREATE POLICY members_select ON tenant_members FOR SELECT
  USING (tenant_id = current_tenant_id());
CREATE POLICY members_write ON tenant_members FOR ALL
  USING (tenant_id = current_tenant_id() AND has_role('owner'))
  WITH CHECK (tenant_id = current_tenant_id() AND has_role('owner'));

-- Invitations: owner only
CREATE POLICY invites_owner ON tenant_invitations FOR ALL
  USING (tenant_id = current_tenant_id() AND has_role('owner'))
  WITH CHECK (tenant_id = current_tenant_id() AND has_role('owner'));
```

### 2.7 Role-aware policies on existing tables

Apply the matrix in section 4 to `invoices`, `quotations`, `payments`, `clients`, `products`, reports. Pattern:

```sql
-- Example: invoices read for sales_rep respects the "own only" setting
CREATE POLICY invoices_select ON invoices FOR SELECT USING (
  tenant_id = current_tenant_id()
  AND (
    has_role('owner','accountant')
    OR (has_role('sales_rep') AND (created_by = auth.uid() OR tenant_sales_see_all()))
    OR has_role('inventory_staff') AND false   -- inventory staff: no invoice access by default
  )
);

CREATE POLICY invoices_insert ON invoices FOR INSERT WITH CHECK (
  tenant_id = current_tenant_id() AND has_role('owner','sales_rep') AND created_by = auth.uid()
);
```

`tenant_sales_see_all()` reads the tenant setting from D4.

### 2.8 Server-side permission helper

```ts
// src/lib/rbac.ts
export type Role = "owner" | "inventory_staff" | "sales_rep" | "accountant";

export type Action =
  | "invoice:view" | "invoice:create" | "payment:record"
  | "inventory:view" | "inventory:manage" | "stock:adjust"
  | "costs:view" | "reports:gst" | "settings:billing" | "team:manage";

const PERMISSIONS: Record<Role, Action[]> = {
  owner: ["invoice:view","invoice:create","payment:record","inventory:view","inventory:manage",
          "stock:adjust","costs:view","reports:gst","settings:billing","team:manage"],
  inventory_staff: ["inventory:view","inventory:manage","stock:adjust","costs:view"],
  sales_rep: ["invoice:view","invoice:create","payment:record","inventory:view"],
  accountant: ["invoice:view","inventory:view","costs:view","reports:gst"],
};

export const canUser = (role: Role | null, action: Action) =>
  !!role && PERMISSIONS[role].includes(action);
```

Rules:

- Every API route that mutates data or returns restricted data calls `canUser` using the role read from the database (`tenant_members`), not from client input.
- Navigation hiding is cosmetic only. RLS and API checks are the real enforcement.

### Phase 0 acceptance criteria

- [ ] An owner of every existing tenant has a `tenant_members` row and can still use the app.
- [ ] A user with no active membership gets zero rows from every tenant table.
- [ ] Deactivating a member blocks them on the next request, without waiting for token refresh.
- [ ] `created_by` is set on all new invoices, quotations, payments and clients.

---

## 3. Phase 1: Team Members & RBAC

### 3.1 Invite flow

1. Owner opens **Settings > Team** and clicks **Invite**.
2. Owner enters name, email, role.
3. Server (service role) checks seats: `active members + pending unexpired invites < plan limit`. Pro = 3, Ultra Pro = 10.
4. Server generates a random 32-byte token, stores only its SHA-256 in `token_hash`, emails the link `/invite/<token>`.
5. Invitee opens the link. Server hashes the token and finds the invitation. It must be unexpired, not accepted, not revoked.
6. Invitee signs up or signs in. **The email must match the invitation.**
7. Server re-checks the seat limit, then in one transaction: creates the `tenant_members` row, marks the invitation accepted, and sets `app_metadata.tenant_id` (service role only).
8. Invitee lands in the business workspace.

Rules:

- Tokens are single-use and expire after 72 hours. Owner can revoke a pending invite.
- A user who already belongs to another tenant cannot accept (D2). Show a clear message.
- Owner cannot be removed or demoted. Ownership transfer is a later feature.

### 3.2 Plan enforcement

| Event | Behaviour |
|---|---|
| Invite beyond seat limit | Blocked with "Upgrade to add more team members". |
| Downgrade Ultra Pro to Pro | Extra members are set `is_active = false` (not deleted). Owner picks who stays. |
| Trial expires | Same as the paywall spec: staff are read-only or locked per plan state. |

### 3.3 UI

- [ ] **Settings > Team**: member list (name, role, status), seat meter ("3 of 10 seats used"), invite modal, deactivate and change-role actions, revoke pending invite.
- [ ] `/invite/[token]` acceptance page.
- [ ] Navigation shows only what the role can use (cosmetic).
- [ ] Setting: "Sales reps can see: own records / all records".

### 3.4 Phase 1 tasks

- [ ] Team members service and API routes (all permission-checked with `canUser`).
- [ ] Invite create, revoke, accept routes (service role, hashed tokens).
- [ ] Invite email template.
- [ ] Settings > Team UI and invite page.
- [ ] Role-aware navigation.
- [ ] Tests (see section 7).

### Phase 1 acceptance criteria

- [ ] Each role can do exactly what the matrix in section 4 allows, verified through the API, not just the UI.
- [ ] A reused, expired or revoked token fails.
- [ ] An invite for a different email fails.
- [ ] Seat limit holds even when two invites are accepted at the same moment.
- [ ] A sales rep cannot see another rep's invoices when "own only" is on.

---

## 4. Permission matrix

| Area | Owner | Inventory Staff | Sales Rep | Accountant |
|---|:---:|:---:|:---:|:---:|
| View invoices and quotations | Full | No | Own or all (setting) | Full, read-only |
| Create invoices and quotations | Yes | No | Yes | No |
| Record client payments | Yes | No | Yes | View only |
| View net profit and margins | Yes | No | No | Yes |
| View product cost price | Yes | Yes | No | Yes |
| Manage products and inventory | Full | Full | View only (stock quantity) | View only |
| Stock adjustments and audits | Yes | Yes | No | No |
| GST reports (GSTR-1, 3B) | Full | No | No | Full export |
| Subscription and billing | Yes | No | No | No |
| Invite and manage team | Yes | No | No | No |

---

## 5. Phase 2: Live Inventory

### 5.1 Schema

```sql
-- Catalog columns (selling-side only; no cost here)
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku                 TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode             TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity      NUMERIC(14,3) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold NUMERIC(14,3) NOT NULL DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit                TEXT NOT NULL DEFAULT 'PCS';
ALTER TABLE products ADD COLUMN IF NOT EXISTS location_rack       TEXT;
-- selling price, hsn_sac_code and tax_rate: reuse the existing columns if present

CREATE UNIQUE INDEX IF NOT EXISTS uq_products_sku
  ON products (tenant_id, sku) WHERE sku IS NOT NULL;

-- Restricted cost table (D9)
CREATE TABLE IF NOT EXISTS product_costs (
  product_id  UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cost_price  NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE product_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY costs_rw ON product_costs FOR ALL
  USING (tenant_id = current_tenant_id() AND has_role('owner','inventory_staff','accountant'))
  WITH CHECK (tenant_id = current_tenant_id() AND has_role('owner','inventory_staff'));

-- Append-only ledger (D8)
CREATE TABLE IF NOT EXISTS stock_ledger (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type    TEXT NOT NULL CHECK (movement_type IN
                     ('INVOICE_SALE','INVOICE_CANCELLED','CREDIT_NOTE','MANUAL_IN','MANUAL_OUT',
                      'OPENING_STOCK','DAMAGED','SYNC_ADJUSTMENT')),
  quantity_changed NUMERIC(14,3) NOT NULL,      -- negative = stock out
  quantity_after   NUMERIC(14,3) NOT NULL,
  reference_id     TEXT,                         -- invoice id etc.
  notes            TEXT,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_product ON stock_ledger (tenant_id, product_id, created_at DESC);

-- Idempotency: one INVOICE_SALE / INVOICE_CANCELLED row per invoice and product
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_ledger_invoice_once
  ON stock_ledger (tenant_id, reference_id, product_id, movement_type)
  WHERE movement_type IN ('INVOICE_SALE','INVOICE_CANCELLED');

ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY ledger_select ON stock_ledger FOR SELECT
  USING (tenant_id = current_tenant_id() AND has_role('owner','inventory_staff','accountant'));
-- No INSERT/UPDATE/DELETE policies: writes happen only inside SECURITY DEFINER functions
REVOKE UPDATE, DELETE ON stock_ledger FROM authenticated, anon;
```

Quantities use 3 decimals so kg, litres and metres work.

### 5.2 Stock functions (atomic)

All stock changes go through these functions. The API never updates `products.stock_quantity` directly.

```sql
-- Manual stock in/out/adjust (inventory staff, owner)
CREATE OR REPLACE FUNCTION record_stock_movement(
  p_product_id UUID, p_type TEXT, p_qty NUMERIC, p_notes TEXT
) RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tenant TEXT := current_tenant_id(); v_after NUMERIC;
BEGIN
  IF NOT has_role('owner','inventory_staff') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE products SET stock_quantity = stock_quantity + p_qty
   WHERE id = p_product_id AND tenant_id = v_tenant
   RETURNING stock_quantity INTO v_after;
  IF NOT FOUND THEN RAISE EXCEPTION 'product not found'; END IF;
  INSERT INTO stock_ledger (tenant_id, product_id, movement_type, quantity_changed, quantity_after, notes, created_by)
  VALUES (v_tenant, p_product_id, p_type, p_qty, v_after, p_notes, auth.uid());
  RETURN v_after;
END $$;

-- Deduct stock for an issued invoice, once, atomically
CREATE OR REPLACE FUNCTION apply_invoice_stock(p_invoice_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tenant TEXT := current_tenant_id(); r RECORD; v_after NUMERIC; v_strict BOOLEAN;
BEGIN
  SELECT COALESCE(strict_inventory,false) INTO v_strict FROM tenants WHERE id = v_tenant;
  -- ADAPT: aggregate lines per product from however invoice items are stored
  FOR r IN
    SELECT product_id, SUM(quantity) AS qty
    FROM invoice_items
    WHERE invoice_id = p_invoice_id AND product_id IS NOT NULL
    GROUP BY product_id
  LOOP
    CONTINUE WHEN NOT EXISTS (SELECT 1 FROM products WHERE id = r.product_id AND tenant_id = v_tenant AND track_inventory);
    UPDATE products SET stock_quantity = stock_quantity - r.qty
     WHERE id = r.product_id AND tenant_id = v_tenant
     RETURNING stock_quantity INTO v_after;
    IF v_strict AND v_after < 0 THEN RAISE EXCEPTION 'insufficient stock for product %', r.product_id; END IF;
    INSERT INTO stock_ledger (tenant_id, product_id, movement_type, quantity_changed, quantity_after, reference_id, created_by)
    VALUES (v_tenant, r.product_id, 'INVOICE_SALE', -r.qty, v_after, p_invoice_id, auth.uid())
    ON CONFLICT DO NOTHING;   -- idempotent: a repeat call changes nothing
  END LOOP;
END $$;
```

Notes:

- If the ledger insert is skipped by `ON CONFLICT`, the stock update above it must also be skipped. In the real version, check for the existing ledger row first and `CONTINUE`, so a repeat call never deducts twice. Write a test for exactly this.
- Call `apply_invoice_stock` inside the same transaction that issues the invoice (a single RPC for "issue invoice"), so a failure rolls both back.
- Write `reverse_invoice_stock(p_invoice_id)` the same way, using `INVOICE_CANCELLED` and positive quantities, called on cancellation or credit note.
- Editing an issued invoice: apply only the quantity difference per product, with a `SYNC_ADJUSTMENT` or `INVOICE_SALE` row referencing the invoice.

### 5.3 Billing behaviour

- [ ] Quotation builder: show stock level next to tracked items, never deduct.
- [ ] Invoice builder: if `quantity > stock_quantity`, show an amber pill "Only 3 PCS in stock (backorder)". Block only when strict mode is on (D6).
- [ ] Issue invoice calls the single RPC (create + deduct).
- [ ] Cancel invoice or issue credit note restores stock.
- [ ] Offline invoices (IndexedDB queue): on sync, never fail the invoice because of stock. Allow negative stock and flag it in the low-stock widget as "oversold after offline sync".

### 5.4 Inventory UI

- [ ] `/inventory` page: filters All, In stock, Low stock, Out of stock. Search by name, SKU, barcode.
- [ ] Stock in / stock out / damaged modal (calls `record_stock_movement`).
- [ ] Product page: stock history from the ledger.
- [ ] Cost price field visible only to roles allowed in the matrix.
- [ ] Dashboard low-stock card and a "reorder via WhatsApp" link.
- [ ] Opening stock entry per product (creates `OPENING_STOCK` ledger row).

### 5.5 Suppliers (minimal, optional for v1)

The first draft mentioned suppliers without a table. For v1, keep one simple table or skip it.

```sql
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, phone TEXT, email TEXT, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: owner and inventory_staff read/write
```

Purchase orders and purchase GST are out of scope (D10).

### Phase 2 acceptance criteria

- [ ] Issuing an invoice deducts stock exactly once, even if the call is repeated.
- [ ] Two invoices issued at the same instant for the last unit produce correct totals (no lost update).
- [ ] Marking an invoice paid does not change stock.
- [ ] Cancelling restores stock once.
- [ ] A sales rep calling the API directly cannot read `product_costs` or the ledger.
- [ ] Strict mode blocks overselling; default mode warns only.
- [ ] Ledger rows cannot be edited or deleted by any app user.

---

## 6. Phase 3: Advanced

- [ ] Camera barcode scanning using `html5-qrcode` or ZXing. Do not rely on the browser Barcode Detector API (not supported on iOS Safari).
- [ ] Activity log UI: who created invoice #1001, who adjusted stock (uses `created_by` and ledger).
- [ ] CSV/Excel bulk import and export of products and opening stock, with a dry-run preview and row-level errors.
- [ ] Optional: ownership transfer, per-role custom permissions.

---

## 7. Test plan (vitest)

Add role-based tests before shipping each phase.

| Area | Tests |
|---|---|
| RLS isolation | Tenant A user reads zero rows of tenant B in every table. |
| Roles | For each role, each action in the matrix is allowed or denied through the API. |
| Deactivation | Deactivated member is denied immediately. |
| Invites | Expired, reused, revoked, wrong-email tokens all fail. Seat limit holds under two simultaneous accepts. |
| Stock idempotency | Calling `apply_invoice_stock` twice deducts once. |
| Stock concurrency | Parallel issues of the same product give the correct final quantity and ledger sum. |
| Ledger integrity | Sum of ledger `quantity_changed` per product equals `stock_quantity`. |
| Cost privacy | Sales rep and anonymous requests cannot read `product_costs`. |
| Mocking | Mock network calls (the current `quotations.test.ts` hits the network and times out). |

---

## 8. Rollout safety

1. Take a Supabase backup before each migration.
2. Run migrations manually in the production SQL Editor, in order, and confirm each succeeded before the code that depends on it is deployed (a previous migration was missed this way).
3. Phase 0 backfill check: owner rows equal tenant count.
4. Test on a staging project with at least two tenants and one user per role.
5. Ship behind a feature flag per tenant so Ultra Pro can be enabled gradually.
6. Update the pricing page, the Terms and the plan-limit copy for the new Ultra Pro tier.

---

## 9. Master checklist

**Phase 0:** `created_by` columns, team tables, owner backfill, `current_member_role` and `has_role`, `current_tenant_id` fix, RLS on new tables, role-aware policies on existing tables, `canUser` helper.

**Phase 1:** invite create/revoke/accept (hashed tokens), seat enforcement, team settings UI, invite page, role-aware navigation, sales-visibility setting, tests.

**Phase 2:** inventory columns, `product_costs`, `stock_ledger`, atomic stock functions, issue/cancel integration, billing warnings, offline-sync handling, inventory page, low-stock widget, opening stock, tests.

**Phase 3:** barcode scanning, activity log UI, bulk import/export.

---

## 10. Open questions to confirm

1. Do you want a separate Admin role later, or is owner-only enough?
2. Should sales reps default to "own records only"? (Recommended: yes.)
3. Should strict inventory mode (block overselling) be available at launch?
4. What are the exact Pro and Ultra Pro prices and Founding-10 treatment for Ultra Pro?
