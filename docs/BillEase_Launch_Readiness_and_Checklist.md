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
  - [x] Admin console guarded by session cookie and super-admin validation.
- [x] **Environment Variable & Secrets Hygiene**:
  - [x] Confirmed `.env*.local` and `.env` are strictly excluded in `.gitignore`.
  - [x] `.env.example` documents all required production keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).

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
  - [ ] Connect production repository branch to hosting platform (Vercel).
  - [ ] Configure custom production domain (e.g., `app.billease.in` or Vercel production URL).
  - [ ] Configure production environment variables in Vercel project settings:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
    - `VAPID_PRIVATE_KEY`
- [ ] **Database Connection Pooling**:
  - [ ] Ensure Supabase Transaction Pooler (port 6543) is used for serverless connection stability.

---

## 7. Launch Execution Countdown Summary

### Architecture, Quality & Security Lock
- [x] Full automated test suite passes (79 tests across GST, templates, UPI, offline queue, notifications, trial lifecycle, onboarding, WhatsApp).
- [x] Next.js production bundle build successfully compiles with zero TypeScript / lint warnings.
- [x] Row Level Security (RLS) policies audited and verified across all 11 database tables.
- [x] WhatsApp direct messaging and Indian phone normalization verified.

### Remaining Deployment Steps for Go-Live 🚀
1. Push latest commits to GitHub repository.
2. Link project to Vercel (or preferred host) and set production environment variables.
3. Apply Supabase migrations (`supabase/schema.sql`, `supabase/rls_policies.sql`, `supabase/migrations/20260915_notifications_and_web_push.sql`) on your production database.
4. Run a live smoke test invoice on production domain.
5. Open registration & celebrate launch!

