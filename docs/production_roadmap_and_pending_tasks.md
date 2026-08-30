# BillEase — Production Roadmap & Remaining Tasks Specification

---

## 📌 Executive Status & Summary

As of today, **Phase 1 (UI/UX Design, Front-End Architecture, PostgreSQL Schema, and Database Services)** is 100% complete and verified with **0 TypeScript and Build errors**.

This document outlines the **6 Remaining Pillars** required to take BillEase from a functional prototype to a secure, enterprise-grade production platform.

```mermaid
graph TD
    subgraph PHASE 1: ACCOMPLISHED TODAY
        A1["Neo-Clay Tactile UI/UX (All Screens)"]
        A2["PostgreSQL Database Schema (8 Tables)"]
        A3["Supabase SDK & CRUD Services"]
        A4["Deterministic Accounting Engine"]
        A5["Vercel Build Ready (30 Routes)"]
    end

    subgraph PHASE 2: PRODUCTION HARDENING (TOMORROW)
        P1["1. Auth & JWT Sessions (Supabase Auth)"]
        P2["2. PostgreSQL Row-Level Security (RLS)"]
        P3["3. End-to-End Flow Verification & Audit"]
        P4["4. Payment Gateway & Dynamic UPI QR Webhooks"]
        P5["5. Push & WhatsApp Notification Engine"]
        P6["6. Automated Testing (API, Unit & E2E)"]
    end

    A1 & A2 & A3 & A4 & A5 --> P1
    P1 --> P2 --> P3 --> P4 --> P5 --> P6
```

---

## 🏛️ The 6 Remaining Production Pillars

---

### 🔐 Pillar 1: Authentication, JWT Sessions & Route Guards
* **Objective**: Ensure only authenticated business owners and staff can access business ledgers and customer data.
* **Technical Deliverables**:
  1. **Supabase Auth Integration**:
     - Email & Password Login (`/login`) and Registration (`/signup`).
     - Password Reset & Magic Link flow (`/forgot-password`, `/reset-password`).
  2. **Next.js Server-Side Middleware (`src/middleware.ts`)**:
     - Protect all `/(dashboard)/*` routes.
     - Automatically redirect unauthenticated users to `/login` with `returnUrl` preservation.
  3. **Secure Cookie Session Management (`@supabase/ssr`)**:
     - Store cryptographically signed JWT session tokens in `httpOnly`, `Secure` cookies.
     - Automatic token refresh on active sessions.
  4. **Multi-Tenant User Profile Binding**:
     - Link authenticated `auth.users.id` to specific `tenant_id` in database.

---

### 🛡️ Pillar 2: Data Security & PostgreSQL Row-Level Security (RLS)
* **Objective**: Guarantee zero data leaks between different businesses/tenants, even against raw API injection attempts.
* **Technical Deliverables**:
  1. **Enable RLS on All Tables**:
     - `ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;`
     - `ALTER TABLE clients ENABLE ROW LEVEL SECURITY;`
     - `ALTER TABLE services ENABLE ROW LEVEL SECURITY;`
     - `ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;`
     - `ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;`
     - `ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;`
     - `ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;`
     - `ALTER TABLE payments ENABLE ROW LEVEL SECURITY;`
  2. **Multi-Tenant Tenant Isolation Policies**:
     - Create SQL policies:
       ```sql
       CREATE POLICY "Tenants can only access their own data"
       ON clients FOR ALL
       USING (tenant_id = auth.jwt() ->> 'tenant_id');
       ```
  3. **API Rate Limiting & Input Sanitization**:
     - Protect Next.js API routes against brute-force and payload injection.

---

### 🔄 Pillar 3: End-to-End Accounting Flow Verification & Edge Cases
* **Objective**: Stress-test the full accounting lifecycle across all 8 real-world business scenarios.
* **Technical Deliverables**:
  1. **Lifecycle Verification**:
     - `Quotation (QT-xxxx)` ➔ 1-Click Convert ➔ `Invoice (INV-xxxx)` ➔ Advance Receipt (`RCP-xxxx`) ➔ Milestone Receipt ➔ Settlement ➔ Ledger Sync.
  2. **Edge Case Handling**:
     - Unequal advance deposits (e.g. 20% instead of 50%).
     - Mid-project scope modifications and supplementary billings.
     - Cancellations & partial refund adjustment receipts.
     - Automated overdue tagging upon expiry of due dates.
  3. **Ledger Consistency Checks**:
     - Verify `balance_due = total_amount - sum(payments)` across all active invoices and client profiles.

---

### 💳 Pillar 4: Payment Gateway, Webhooks & Dynamic QR Codes
* **Objective**: Support both manual payment recording and instant automated payment link settlements.
* **Technical Deliverables**:
  1. **Payment Architecture**:
     - Mode A: Instant Manual Logging (3-second Cash / Personal UPI logging).
     - Mode B: Dynamic UPI QR Code generated on customer invoices.
     - Mode C: Payment Gateway Integration (Razorpay / Cashfree).
  2. **Webhook Listener (`/api/webhooks/payments`)**:
     - Secure webhook receiver with HMAC signature verification.
     - Automatically marks invoice as `Paid` and decrements balance upon bank payment confirmation without manual clicks.
  3. **Idempotency & Double-Payment Prevention**:
     - Unique transaction reference locking to prevent duplicate receipt generation.

---

### 🔔 Pillar 5: Notification Engine & Automated Reminders
* **Objective**: Dispatch proactive alerts to business owners and automated payment reminders to clients.
* **Technical Deliverables**:
  1. **Web Push Notifications (Service Worker)**:
     - Register `sw.js` for browser push alerts.
     - Notify owner when an invoice becomes overdue or when a payment is received.
  2. **1-Click WhatsApp API Dispatch**:
     - Dynamic message template rendering with `{client_name}`, `{invoice_num}`, `{balance_due}`.
     - Direct WhatsApp web / mobile intent dispatch.
  3. **Scheduled Automated Reminder Rules**:
     - Configure cron / background alerts (e.g. reminder 3 days before due date, on due date, and 5 days overdue).

---

### 🧪 Pillar 6: Automated Testing & Quality Assurance
* **Objective**: Ensure complete software stability, performance, and regression prevention.
* **Technical Deliverables**:
  1. **Unit Tests (Jest / Vitest)**:
     - Test mathematical calculation formulas (Subtotals, Discounts, 18% GST, Balance Due).
  2. **API & Service Integration Tests**:
     - Test CRUD operations for Clients, Catalog Services, Quotations, Invoices, and Payments.
     - Test RLS security policy enforcement (unauthorized tenant access rejection).
  3. **End-to-End UI Tests (Playwright)**:
     - Full automated browser journey: Create Quote ➔ Convert to Invoice ➔ Record Payment ➔ Verify Dashboard Metrics.

---

## 📅 Action Plan for Tomorrow:

| Step | Action Item | Target Pillar |
| :---: | :--- | :---: |
| **1** | Wire Supabase Authentication (`/login`, `/signup`, `@supabase/ssr` middleware) | **Pillar 1** |
| **2** | Apply Row-Level Security (RLS) SQL Policies across all 8 tables | **Pillar 2** |
| **3** | Execute End-to-End Accounting Lifecycle verification | **Pillar 3** |
| **4** | Discuss and implement Payment Gateway / Webhook handler | **Pillar 4** |
| **5** | Build Notification Engine (Service Worker & WhatsApp Scheduler) | **Pillar 5** |
| **6** | Implement automated test suite (Unit & API tests) | **Pillar 6** |

---
*Specification Version: 1.0 • BillEase Production Roadmap*
