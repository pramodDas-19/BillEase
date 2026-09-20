# BillEase — Official Launch Readiness & Execution Checklist

**Target Launch Date:** Saturday, September 19, 2026  
**Platform:** BillEase (Multi-Tenant Indian Invoicing, Quotations & GST Billing SaaS)  
**Primary Brand Color:** `#0C9484`  
**Status:** In Final Verification & Pre-Launch Hardening  

---

## Executive Summary
This document serves as the master launch checklist and operational playbook for deploying BillEase to production by Saturday. It covers security verification, core billing workflows, Indian GST compliance, multi-tenant isolation, deployment infrastructure, and launch-day operations.

---

## 1. Security, Authentication & Multi-Tenancy

- [x] **Row Level Security (RLS) Audit**:
  - [x] Ensure RLS is enabled on all tables in Supabase production (`tenants`, `invoices`, `payments`, `quotations`, `clients`, `notifications`, `push_subscriptions`, `notification_preferences`). *(Verified in `supabase/rls_policies.sql` & `supabase/migrations/20260915_notifications_and_web_push.sql`)*
  - [x] Verify that every query enforces `tenant_id = auth.uid()` or matches authenticated tenant membership via `current_tenant_id()`.
  - [x] Multi-tenant storage isolation: confirmed localStorage & service caches are tenant-keyed (`billease_payments_${tenantId}`, `billease_invoices_${tenantId}`).
- [x] **Authentication & Access Control**:
  - [x] Verify email/password login and signup flows with Supabase Auth.
  - [x] Route protection enforced via `src/middleware.ts` for all `/dashboard`, `/clients`, `/invoices`, `/quotations`, `/payments`, `/reports`, `/settings` routes.
  - [x] **Super-Admin Zero-Trust Cryptographic Authentication & 2FA** *(Hardened & Verified)*:
    - [x] **Complete elimination of forgeable client-side cookies**: Replaced `billease_admin_session=true` and `localStorage`/`sessionStorage` flags with server-verified cryptographic JWT (`billease_admin_token`).
    - [x] **12-Hour Signed JWT**: Generated with `jose` (HS256) and delivered via `HttpOnly; SameSite=Strict; Secure; Path=/` cookie.
    - [x] **Mandatory RFC 6238 TOTP 2FA**: Validated with `otplib` including a `[-30s, +30s]` clock-drift tolerance window.
    - [x] **Salted Bcrypt Password Hashing**: Server-side comparison with robust string normalization (`s.split("\\$").join("$")` and `cleanEnv`) ensuring seamless support across `.env.local` and Vercel Dashboard.
    - [x] **Brute-Force Rate Limiting**: Max 5 failed attempts per 15 minutes per IP address.
    - [x] **Structured Security Audit Logging**: Timestamped logging of `LOGIN_SUCCESS`, `LOGIN_FAILED`, `SESSION_VERIFICATION_FAILED`, and `LOGOUT` events with client IP.
    - [x] **Centralized Server Verification**: `verifyAdminSession(request)` enforced at the top of `src/middleware.ts` and all `/api/admin/*` routes (`tenants`, `impersonate`, `broadcast`, `export`).
- [x] **Environment Variable & Secrets Hygiene**:
  - [x] Confirmed `.env*.local` and `.env` are strictly excluded in `.gitignore`.
  - [x] `.env.example` documents all required production keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET`, `ADMIN_SESSION_SECRET`).

---

## 2. Core Billing, Quotations & Indian Compliance

- [x] **Indian GST Calculation Engine**:
  - [x] **Intra-State**: Equal 50/50 split into CGST and SGST (e.g., 9% CGST + 9% SGST for 18% tax rate). *(Verified in `tests/gst-engine.test.ts`)*
  - [x] **Inter-State**: 100% IGST allocation (e.g., 18% IGST). *(Verified in `tests/gst-engine.test.ts`)*
  - [x] **HSN / SAC Codes**: HSN/SAC numbers display accurately on bill line items.
  - [x] **Rounding & Precision**: Currency formatting in Indian Rupee format (`₹`, Lakhs and Crores comma separation: `₹ 1,00,000.00`). *(Verified in `tests/calculation.test.ts`)*
- [x] **Document Templates & Print Previews**:
  - [x] All 15 document templates registered and tested across formats: *(Verified in `tests/document-templates.test.ts`)*
    - 5 A4 templates (Advanced GST, Tally ERP Classic, Luxury Royal Gold, Modern Minimalist, Classic Billbook)
    - 5 A5 templates (A5 Landscape GST, A5 Landscape Billbook, A5 Portrait Challan, A5 Modern Studio, A5 Traditional Bahi-Khata)
    - 5 Thermal / Small Bill formats (80mm Standard POS, 80mm GST Counter Slip, 58mm Mini Pocket Slip, Boutique & Cafe Slip, Supermarket Grocery Slip)
  - [x] Company logo, GSTIN, signature, and bank details render cleanly in print dialog (`Ctrl + P`) and PDF preview.
- [x] **Quotation to Invoice Conversion**:
  - [x] One-click conversion from accepted quotation into active invoice verified in `src/app/(dashboard)/invoices/new/page.tsx` (`fromQuoteId` query prefilling client, items, rates, taxes, and state detection).

---

## 3. Payments, UPI & Collection Tracking

- [x] **UPI QR & Intent Links**:
  - [x] Dynamic UPI QR code generation (`upi://pay?pa=...&pn=...&am=...&cu=INR`).
  - [x] Scan-and-pay flow and client payment portal at `/pay/[token]`.
- [x] **UPI Collection Tracker (Dashboard)**:
  - [x] ₹1,00,000 monthly reference threshold tracker on the dashboard. *(Verified in `tests/upi-collection-tracker.test.ts`)*
  - [x] Calendar-month filtering automatically handles current month.
  - [x] Visual progress bar clamps at 100% and informational MDR disclaimer displays accurately.
- [x] **Manual & Bank Settlements**:
  - [x] Recording payments via Cash, Bank Transfer (NEFT/RTGS/IMPS), and Cheque.
  - [x] Invoice balance automatically deducts upon recording partial or full payment in `PaymentService`.

---

## 4. WhatsApp Sharing & Notifications

- [x] **WhatsApp Direct Share**:
  - [x] WhatsApp click-to-chat URL format (`https://wa.me/91XXXXXXXXXX?text=...`). *(Verified in `tests/whatsapp.test.ts`)*
  - [x] Phone number formatting automatically handles +91 prefix and leading 0 stripping.
  - [x] Invoice links and payment receipt messages include company name, payment reference, and balance amounts.
- [x] **In-App & Push Notifications**:
  - [x] Notifications architecture, persistent table, and deduplication verified. *(Verified in `tests/notifications.test.ts`)*
  - [x] Web Push service worker (`public/sw.js`) registers cleanly.

---

## 5. Mobile Responsiveness & Offline PWA

- [x] **Mobile & Tablet Navigation**:
  - [x] Tactile mobile bottom bar, responsive header, and drawer navigation on mobile viewports.
  - [x] Form inputs, comboboxes, and modals sized to prevent unintended viewport zoom or horizontal scrolling.
- [x] **Offline Queue & Reconnection**:
  - [x] Offline transaction queueing via IndexedDB and automatic sync runner. *(Verified in `tests/offline-queue.test.ts`)*

---

## 6. Production Infrastructure & Deployment Pipeline

- [x] **Build Validation**:
  - [x] Executed `npm run build` locally: **0 errors, 49/49 pages & APIs compiled cleanly**.
  - [x] Executed `vitest run`: **9/9 test files, 79/79 tests passing**.
- [ ] **Hosting & CDN Configuration (Final Step)**:
  - [x] Connected production repository branch to hosting platform (Vercel).
  - [ ] Configure custom production domain (e.g., `app.billease.in` or Vercel production URL).
  - [x] Configure production environment variables in Vercel project settings:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
    - `VAPID_PRIVATE_KEY`
    - `ADMIN_EMAIL`
    - `ADMIN_PASSWORD_HASH`
    - `ADMIN_TOTP_SECRET`
    - `ADMIN_SESSION_SECRET`
- [ ] **Database Connection Pooling**:
  - [ ] Ensure Supabase Transaction Pooler (port 6543) is used for serverless connection stability.

---

## 7. Launch Execution Countdown Summary

### Architecture, Quality & Security Lock
- [x] Full automated test suite passes: **89/89 tests across all 11 test suites** (GST, templates, UPI, offline queue, notifications, trial lifecycle, onboarding, WhatsApp, dashboard summary & ISO dates, admin security).
- [x] Next.js production bundle build successfully compiles with zero TypeScript (`npx tsc --noEmit` code: 0).
- [x] **Dashboard Integrity & Verification**:
  - [x] **Revenue Overview Graph**: Calendar date aggregation across 7D, 30D, 3M, 6M, 1Y with zero-activity empty state & create invoice CTA.
  - [x] **Due Date Filtering**: ISO timestamp parsing (`dueDate.split("T")[0] <= today`) in both Dashboard Header and Payment Attention Radar.
  - [x] **Responsive Layouts**: Added `xs: 480px` screen breakpoint to `tailwind.config.ts` for all mobile views.
  - [x] **Rule 1 Compliance**: Removed all niche assumptions (e.g. "events or printing") to support any business model.
  - [x] **Cancelled Transaction Filtering**: Cancelled invoices and failed/refunded payments excluded from active summaries.
  - [x] **Phone Fallback**: Graceful navigation to invoice preview when client phone number is missing.
- [x] **Clients & Directory Verification**:
  - [x] **Phone Normalization**: Applied `formatWhatsAppPhoneNumber` across both Grid and Table views so 10-digit Indian numbers open WhatsApp without error.
  - [x] **Overdue 1-Click Reminder**: Added direct `BellRing` reminder button on Grid view cards for clients with unpaid balances.
- [x] **Services & Catalog Verification**:
  - [x] **Rule 1 Compliance**: Replaced hardcoded niche category styles with dynamic `getCategoryInfo` supporting all business models (Services, Products/Goods, Consulting, Tech, Retail, Maintenance, Creative, etc.).
  - [x] **Standard Business Categories**: Provided curated standard categories in `/services/new` and `ServiceEditDialog` alongside custom categories.
  - [x] **Mobile Pricing Strip & Filter Pills**: Responsive touch-scrolling filter tabs and flex-wrapping price blocks.
  - [x] **Builder Integration**: Verified 1-click `+ Quote` and `+ Invoice` pre-filling selected item, unit, rate, and tax rate.
- [x] Row Level Security (RLS) policies audited and verified across all database tables.
- [x] Super-Admin security locked down with server-verified JWT and mandatory RFC 6238 TOTP 2FA.
- [x] WhatsApp direct messaging and Indian phone normalization verified.

---

## 8. Tomorrow's Pre-Launch Final Execution Action Plan 🚀

This is the focused sprint roadmap to complete before the official public launch:

### 1. 📱 Mobile View & Responsiveness (Top Priority)
- [ ] **Viewport & Layouts**: Audit mobile screen viewports (360px - 430px) across iOS Safari & Android Chrome.
- [ ] **Forms & Inputs**: Ensure quotation/invoice creation inputs, numeric fields, and sticky action buttons don't clip, jitter, or trigger auto-zoom.
- [ ] **Tables to Cards**: Transform wide desktop tables into tactile mobile cards on small screens.
- [ ] **Navigation & Drawers**: Ensure sidebar slide-out drawer, bottom nav, and modals feel snappy and touch-friendly.

### 2. 🧾 Document Templates Perfection
- [ ] **1-to-1 Live Preview Fidelity**: Verify that on-screen Live Preview matches the actual Print / PDF dialog output (`Ctrl + P`).
- [ ] **Template Switching**: Confirm all 15 formats (A4, A5, Thermal POS) render taxes, HSN/SAC, bank details, and UPI QR cleanly without overlap.
- [ ] **Print Margins**: Clean page breaks and margins for multi-page bills.

### 3. 🔔 Notification System Polish
- [ ] **In-App Notification Bell**: Real-time unread count badge, marking read, and deduplication.
- [ ] **WhatsApp & Email Triggers**: Instant dispatch on invoice generation, quote acceptance, and payment recording.
- [ ] **Subscription & Trial Alerts**: Grace period and expiration countdown banners.

### 4. 💎 Pricing Page & Upgrade Journey
- [ ] **Plan Presentation**: Clean, high-converting tier breakdown (7-Day Trial, Pro Monthly ₹1,499, Pro Annual).
- [ ] **Feature Matrix**: Visual comparison (GST compliance, DPDP Act readiness, unlimited bills, multi-device).
- [ ] **Razorpay Checkout Flow**: End-to-end subscription upgrade verification.

### 5. 🔄 Complete End-to-End Flow Smoke Test
- [ ] **Step 1**: New user registration & business onboarding setup.
- [ ] **Step 2**: Add Client & Catalog Service item.
- [ ] **Step 3**: Generate Quotation & test WhatsApp share.
- [ ] **Step 4**: Convert Quotation to Invoice.
- [ ] **Step 5**: Record Payment (UPI / Cash / Bank) & verify balance zeroing.
- [ ] **Step 6**: Super-Admin panel inspection & audit trail verification.


