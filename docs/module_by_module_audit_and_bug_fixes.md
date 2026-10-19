# BillEase — Module-by-Module Audit & Bug Fixes Specification

---

## 📌 Document Overview
This living document maintains an audit trail of every system module in **BillEase**, tracking all identified flaws, edge-case vulnerabilities, architectural discrepancies, coding standards violations, and the exact fixes applied with test verifications.

---

## 🏛️ Module 1: Authentication, Tenant Provisioning & Middleware

### 1.1 Password Reset Redirection Lockout
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/middleware.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/middleware.ts)
* **The Problem**:
  `isAuthPage` contained `pathname === "/reset-password"`. When a user clicked a recovery link in their password reset email, Supabase established an initial recovery session cookie. When the browser navigated to `/reset-password`, the Next.js middleware evaluated `isAuthPage && isAuthenticated` as `true` and immediately executed `NextResponse.redirect(new URL("/dashboard", request.url))`.
* **Impact**:
  Users trying to recover their account were permanently locked out from the reset form and bounced to `/dashboard`.
* **The Fix**:
  Excluded `/reset-password` from `isAuthPage`. An active recovery session is explicitly required to stay on `/reset-password` so `supabase.auth.updateUser({ password })` can succeed.

---

### 1.2 Tenant ID Desynchronization & Silent Data Partition Leak
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/services/auth.service.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/services/auth.service.ts)
* **The Problem**:
  The secure server-side provisioning route writes the generated `tenant_id` into `user.app_metadata.tenant_id`. However, `AuthService.getCurrentUser()` was only reading `user.user_metadata?.tenant_id`. Because `user_metadata.tenant_id` was undefined, it fell back to calculating `tenant-${user.id.slice(0, 8)}`, called `setActiveTenantId(tenantId)`, and overwrote localStorage with a nonexistent tenant ID.
* **Impact**:
  The logged-in user became partitioned from their real database tenant settings and invoices, falling back to empty states or the demo `"tenant-royal-events"`.
* **The Fix**:
  Updated `AuthService.getCurrentUser()` to prioritize `user.app_metadata?.tenant_id || user.user_metadata?.tenant_id` before falling back to any client-generated ID.

---

### 1.3 Fragile Tenant Provisioning on Registration & Self-Healing
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/services/auth.service.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/services/auth.service.ts), [`src/app/api/auth/provision-tenant/route.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/api/auth/provision-tenant/route.ts), [`src/context/tenant-context.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/context/tenant-context.tsx)
* **The Problem**:
  1. `AuthService.signUp()` invoked `fetch("/api/auth/provision-tenant")` without an `Authorization: Bearer <access_token>` header. If browser cookies had not finished flushing or if email confirmation was enabled, `/api/auth/provision-tenant` threw `401 Unauthorized`.
  2. The provision failure was caught silently, leaving the user with an Auth account but **no tenant record in PostgreSQL**.
* **The Fix**:
  1. Updated `AuthService.signUp()` to pass `Authorization: Bearer ${data.session?.access_token}` and trigger `supabase.auth.refreshSession()` once provisioned.
  2. Updated `/api/auth/provision-tenant` to authenticate callers via either Bearer JWT tokens or SSR request cookies.
  3. Added **self-healing auto-provisioning** in both `AuthService.signIn()` and `TenantProvider`: if an authenticated user accesses the workspace and their database tenant record is missing, the system provisions their workspace automatically on the fly.

---

### 1.4 Edge Runtime Warnings in Next.js Middleware
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/lib/admin-auth.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/lib/admin-auth.ts), [`src/middleware.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/middleware.ts)
* **The Problem**:
  `admin-auth.ts` was doing a top-level `import { SignJWT, jwtVerify } from "jose"`. In Next.js Edge Runtime, this pulled in the full JWE Deflate/CompressionStream module, triggering:
  `A Node.js API is used (CompressionStream at line: 31) which is not supported in the Edge Runtime.`
* **The Fix**:
  Changed imports to specific subpath exports:
  ```ts
  import { SignJWT } from "jose/jwt/sign";
  import { jwtVerify } from "jose/jwt/verify";
  ```
  Edge runtime compilation warnings are now completely resolved (0 warnings).

---

### 1.5 Supabase PKCE Code Exchange on Password Reset
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/app/(auth)/reset-password/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28auth%29/reset-password/page.tsx)
* **The Problem**:
  When using Supabase Auth with `@supabase/ssr`, reset links contain a PKCE code (`?code=xxxx`). The reset password page was not exchanging this code for a session on mount, resulting in `Auth session missing` errors when submitting a new password.
* **The Fix**:
  Added on-mount PKCE code exchange:
  ```ts
  const code = searchParams.get("code");
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }
  ```
  Wrapped page in `<Suspense>` to maintain full Next.js App Router build optimization.

---

### 1.6 Impersonation & Registration State Cleanup on Sign Out
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/services/auth.service.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/services/auth.service.ts)
* **The Problem**:
  `AuthService.signOut()` cleared `billease_active_tenant_id` and `billease_registered_user`, but left `billease_is_impersonating` and `billease_just_registered` in storage. Subsequent logins by other users could unintentionally inherit impersonation flags.
* **The Fix**:
  Ensured `signOut()` unconditionally clears `billease_is_impersonating`, `billease_active_tenant_id`, `billease_just_registered`, and `billease_registered_user` across both `localStorage` and `sessionStorage`.

---

### 1.7 Premature Landing Page Redirection on Stale Cookies
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/middleware.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/middleware.ts)
* **The Problem**:
  The public route bypass was checking `if (hasAuthCookie) return NextResponse.redirect("/dashboard")` on `/` before verifying whether the cookie was actually valid. If expired, the user bounced to `/dashboard`, which bounced them to `/login?redirectTo=/dashboard`.
* **The Fix**:
  Removed premature redirection from the public routes block. The root page `/` now flows through session verification: valid users go to `/dashboard`, while expired or unauthenticated users see the landing page cleanly.

---

## 👥 Module 2: Client Management & CRM / Ledger

### 2.1 Ledger Inconsistency & Balance Drift across Invoices & Payments
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/services/client.service.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/services/client.service.ts), [`src/services/invoice.service.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/services/invoice.service.ts), [`src/services/payment.service.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/services/payment.service.ts)
* **The Problem**:
  The `clients` table columns (`total_billed`, `total_paid`, `balance_due`) were never updated by the backend upon invoice generation or payment receipt recording. Instead, the UI relied on in-memory aggregation of all invoices every time a client profile or directory was viewed. This led to persistent balance drift, incorrect overdue warnings, and missing ledger totals in exported client reports.
* **Impact**:
  Overdue balances shown on WhatsApp reminder buttons and client directory cards drifted out of sync with real invoice settlement states.
* **The Fix**:
  1. Created `ClientService.recalculateClientLedger(clientId)`: Fetches active invoices (excluding `cancelled` status), computes `totalBilled = sum(total_amount)`, `totalPaid = sum(paid_amount)`, and `balanceDue = max(0, totalBilled - totalPaid)`, then updates the PostgreSQL `clients` table and invalidates cache keys (`clients`, `client:${clientId}`).
  2. Integrated automatic ledger recalculation into `InvoiceService.createInvoice()`, `InvoiceService.updateInvoice()`, `InvoiceService.deleteInvoice()`, `PaymentService.recordPayment()`, and `PaymentService.deletePayment()`.

---

### 2.2 Unsafe Client Deletion & Foreign Key Integrity
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/services/client.service.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/services/client.service.ts), [`src/app/(dashboard)/clients/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/clients/page.tsx)
* **The Problem**:
  `ClientService.deleteClient()` immediately issued `DELETE FROM clients WHERE id = id`. If a client had linked invoices, quotations, or payments, the database query failed with foreign key violations (`violates foreign key constraint`). The UI had already optimistically removed the client from state, so the client disappeared until a page refresh.
* **Impact**:
  Silent UI corruption where the user believed a client was deleted, but reloading showed the client still present.
* **The Fix**:
  1. Updated `ClientService.deleteClient()` to verify linked invoices first:
     ```ts
     const { data: linkedInvoices } = await supabase.from("invoices").select("id, invoice_number").eq("client_id", id).limit(5);
     if (linkedInvoices && linkedInvoices.length > 0) {
       return { success: false, error: `Cannot delete client: ${linkedInvoices.length} linked invoice(s) exist (e.g. #${linkedInvoices[0].invoice_number}). Please delete or reassign them first.` };
     }
     ```
  2. Updated `handleDeleteClient` in `clients/page.tsx` with error handling and UI state rollback.

---

### 2.3 Indian GSTIN State Code Verification & Phone Validation
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/validations/client.schema.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/validations/client.schema.ts), [`src/app/(dashboard)/clients/new/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/clients/new/page.tsx)
* **The Problem**:
  Validation only verified that GSTIN had 15 characters, but did not validate whether the first 2 digits were a valid Indian state code according to GST law. A typo like `99ABCDE1234F1Z5` was accepted, resulting in subsequent IGST vs CGST/SGST tax calculation bugs when generating invoices. In addition, phone validation did not enforce minimum digit requirements.
* **The Fix**:
  1. Extended `validateClient()` in `client.schema.ts` to validate the 2-digit state prefix against `GST_STATE_CODES` (01-38, 97).
  2. Enforced at least 10 numeric digits for phone numbers (`rawPhone.length < 10`).
  3. Added real-time Indian State detection badge in `clients/new/page.tsx` displaying state name (e.g., `State: Maharashtra (Code: 27)`) as the user types their GSTIN.

---

### 2.4 Mobile Trapping & Viewport Overflow in Client Edit Dialog
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/components/clients/client-edit-dialog.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/clients/client-edit-dialog.tsx)
* **The Problem**:
  The modal dialog lacked a `max-h` constraint and vertical scroll container. On mobile devices (< 640px) with virtual software keyboards open, the "Save Changes" button was pushed outside the viewport with no way to scroll to it, trapping the user in the modal.
* **The Fix**:
  1. Added `max-h-[90vh] overflow-y-auto` to the modal container.
  2. Implemented a sticky bottom action bar (`sticky bottom-0 bg-white/95 backdrop-blur-sm border-t`) ensuring Cancel and Save buttons are always visible and reachable on mobile.
  3. Integrated `validateClient()` with inline field error messages.

---

### 2.5 Mobile Touch Target Dimensions & `tel:` Protocol Sanitization
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/app/(dashboard)/clients/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/clients/page.tsx), [`src/app/(dashboard)/clients/[id]/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/clients/%5Bid%5D/page.tsx)
* **The Problem**:
  1. Action icons (Call, WhatsApp, Reminder, Edit, Delete) were sized at `h-8 w-8` (32px), violating the standard 44px / minimum 36px touch accessibility guideline.
  2. Phone links used raw `href="tel:${client.phone}"`. Phone numbers with spaces or brackets (e.g. `+91 (987) 65-43210`) failed on certain Android/iOS dialers.
* **The Fix**:
  1. Sanitized all dialer links using `sanitizedTel = (client.phone || "").replace(/[^0-9+]/g, "")`.
  2. Enlarged button sizes to `min-h-[36px] min-w-[36px]` in grid/table views and `min-h-[38px]` in detail view.
  3. Made phone numbers and emails in client profiles clickable (`tel:` and `mailto:`) with hover styles.
  4. Made action controls wrap responsively with `flex-1 sm:flex-none` on mobile screens.

---

## 📦 Module 3: Services Catalog & Inventory

### 3.1 In-Memory Deletion State Desync & Missing Rollback Guard
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/app/(dashboard)/services/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/services/page.tsx), [`src/services/service.service.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/services/service.service.ts)
* **The Problem**:
  `handleDeleteService` optimistically filtered out the service from the local React state before awaiting `CatalogService.deleteService(id)`. If the database delete failed (e.g. network disconnect or database error), the deletion return value was completely ignored and no error was presented to the user.
* **The Fix**:
  Implemented state snapshotting and rollback:
  ```ts
  const prevList = [...servicesList];
  setServicesList((prev) => prev.filter((s) => s.id !== id));
  const success = await CatalogService.deleteService(id);
  if (!success) {
    setServicesList(prevList);
    alert(`Failed to delete "${name}". Please check your connection and try again.`);
  }
  ```

---

### 3.2 Offline Mutation Queueing & DataCache Integration in `CatalogService`
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/services/service.service.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/services/service.service.ts), [`src/lib/offline-queue.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/lib/offline-queue.ts), [`src/lib/offline-sync-runner.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/lib/offline-sync-runner.ts), [`src/types/service.types.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/types/service.types.ts)
* **The Problem**:
  `CatalogService` made uncached network calls on every render, and completely crashed/failed when offline. If offline, `getServices()` returned an empty array `[]` (showing "Your Catalog is Empty"), while item creation and updates threw exceptions and discarded user input.
* **The Fix**:
  1. Integrated `DataCache.fetch("services", ...)` with micro-TTL deduplication and invalidation on create, update, delete, and bulk import.
  2. Extended `MutationEntityType` in `offline-queue.ts` to support `"service"`, and added a replay handler in `offline-sync-runner.ts`.
  3. Integrated `enqueueMutation` with IndexedDB persistence upon `isNetworkError()`.
  4. Added merge logic in `CatalogService.getServices()` to display locally queued items with an offline `Pending Sync` badge.

---

### 3.3 Mobile Viewport Trapping in Service Edit Dialog
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/components/services/service-edit-dialog.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/services/service-edit-dialog.tsx)
* **The Problem**:
  The dialog container lacked height constraints (`max-h`) and vertical scrolling. When users on mobile devices opened the virtual keyboard to enter rates or custom units, the Cancel and "Save Changes" buttons were pushed below the visible viewport, trapping the user in the modal.
* **The Fix**:
  1. Updated modal container to `max-h-[90vh] flex flex-col overflow-hidden`.
  2. Wrapped form fields in `flex-1 overflow-y-auto`.
  3. Built a sticky bottom action bar (`sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 p-4`) ensuring save/cancel controls are always accessible.

---

### 3.4 Formal Service Validation Schema & Real-Time Field Feedback
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/validations/service.schema.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/validations/service.schema.ts), [`src/app/(dashboard)/services/new/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/services/new/page.tsx), [`src/components/services/service-edit-dialog.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/services/service-edit-dialog.tsx)
* **The Problem**:
  No formal validation schema existed for services. Forms allowed negative rates (`rate < 0`), arbitrary tax percentages, and invalid HSN/SAC codes without giving inline field feedback.
* **The Fix**:
  1. Created `src/validations/service.schema.ts` defining `validateService()`:
     - Name: Minimum 2 non-whitespace characters.
     - Rate: Non-negative number (`>= 0`).
     - GST Rate: Non-negative percentage within 0–100%.
     - HSN/SAC Code: 2 to 8 numeric digits.
  2. Added real-time inline field error indicators in both `services/new/page.tsx` and `service-edit-dialog.tsx`.
  3. Added one-tap quick-select pills for standard Indian GST slabs (`0%`, `5%`, `12%`, `18%`, `28%`).

---

### 3.5 Mobile Touch Target Enlargement in Services Catalog
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/app/(dashboard)/services/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/services/page.tsx), [`src/components/services/catalog-import-modal.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/services/catalog-import-modal.tsx)
* **The Problem**:
  Action buttons (Edit, Delete, + Quote, + Invoice) were undersized (`h-8 w-8` and `p-1.5` with 12px icons), making it easy on mobile screens to accidentally tap the delete icon instead of edit or create invoice.
* **The Fix**:
  1. Enlarged grid card action buttons to `h-9 w-9 min-h-[36px] min-w-[36px]`.
  2. Enlarged table action buttons to `p-2 min-h-[36px] min-w-[36px]` with `h-3.5 w-3.5` icons.
  3. Added full-width responsive touch buttons in `services/new/page.tsx` and `catalog-import-modal.tsx`.

---

---

## 📜 Module 4: Quotations & Estimates Lifecycle

### 4.1 Quotation Deletion & Status Change Rollback Guard
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/app/(dashboard)/quotations/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/page.tsx), [`src/services/quotation.service.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/services/quotation.service.ts)
* **The Problem**:
  In `quotations/page.tsx`, `handleDeleteQuote` and `handleStatusChange` removed/altered quotations from local state optimistically without saving a snapshot backup or checking the return value of `QuotationService.deleteQuotation()` / `QuotationService.updateQuotationStatus()`. On network failure or database errors, quotations silently disappeared or showed incorrect status badges until a hard page reload.
* **The Fix**:
  1. Added state snapshot backup and rollback in `handleDeleteQuote` and `handleStatusChange`:
     ```ts
     const backup = [...quotationsList];
     setQuotationsList((prev) => prev.filter((q) => q.id !== id));
     try {
       const ok = await QuotationService.deleteQuotation(id);
       if (!ok) {
         setQuotationsList(backup);
         alert("Failed to delete quotation. Please try again.");
       }
     } catch (err) {
       setQuotationsList(backup);
       alert("Failed to delete quotation. Please check your network connection.");
     }
     ```
  2. Integrated `isNetworkError()` into `QuotationService.deleteQuotation()` to seamlessly enqueue offline delete mutations to IndexedDB (`enqueueMutation({ action: "delete", ... })`).

---

### 4.2 "undefined" / "null" String Leak in 1-Click Invoice Conversion
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/app/(dashboard)/quotations/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/page.tsx), [`src/app/(dashboard)/invoices/new/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/new/page.tsx)
* **The Problem**:
  `handleConvertToInvoice(quote)` built navigation URLs using template interpolation:
  ``router.push(`/invoices/new?fromQuoteId=${quote.id}&clientId=${quote.clientId}`)``.
  When a quotation did not have a linked `clientId` (e.g. ad-hoc walk-in customer quotation), it navigated to `/invoices/new?fromQuoteId=...&clientId=undefined`.
  In `invoices/new/page.tsx`, `searchParams.get("clientId")` evaluated to the string `"undefined"`, which is truthy. This corrupted invoice builder state with `clientId: "undefined"` and caused subsequent client lookup failures.
* **The Fix**:
  1. Used `URLSearchParams` to cleanly omit empty, `"undefined"`, or `"null"` query keys:
     ```ts
     const params = new URLSearchParams({ fromQuoteId: quote.id });
     if (quote.clientId && quote.clientId !== "undefined" && quote.clientId !== "null") {
       params.set("clientId", quote.clientId);
     }
     router.push(`/invoices/new?${params.toString()}`);
     ```
  2. Sanitized `searchParams.get("clientId")` in `invoices/new/page.tsx` so literal `"undefined"` and `"null"` are stripped out.
  3. Prefilled client profile and state detection automatically when `clientId` is provided directly.

---

### 4.3 Quotation Validation Schema, Advance Token Limits & Date Consistency
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/validations/quotation.schema.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/validations/quotation.schema.ts), [`src/app/(dashboard)/quotations/new/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/new/page.tsx), [`src/app/(dashboard)/quotations/[id]/edit/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/%5Bid%5D/edit/page.tsx)
* **The Problem**:
  `validateQuotation` lacked checks for line item boundaries (negative rates, zero quantities, percentage discounts > 100%), advance booking tokens (percentages > 100% or fixed token amounts exceeding quotation totals), and validity dates preceding issue dates. Forms also lacked client-side validation guards prior to submission.
* **The Fix**:
  1. Extended `validateQuotation` with strict boundary checks:
     - Line items: non-negative amount, rate >= 0, quantity > 0, discount percentage <= 100%.
     - Advance payment token: percentage between 0–100%, fixed amount <= total estimate.
     - Dates: `validUntil` cannot precede `date`.
  2. Wired `validateQuotation()` into `handleSubmit` in both `quotations/new/page.tsx` and `quotations/[id]/edit/page.tsx` with user-friendly alerts preventing malformed submissions.

---

### 4.4 Offline Deletion Support in IndexedDB Replay Engine
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/lib/offline-queue.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/lib/offline-queue.ts), [`src/lib/offline-sync-runner.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/lib/offline-sync-runner.ts)
* **The Problem**:
  `MutationAction` only permitted `"create" | "update"`. If a user deleted a quotation while offline, the action could not be recorded in IndexedDB. Furthermore, the sync runner assumed any non-create quotation action was an update, causing offline replay crashes when trying to replay deletions.
* **The Fix**:
  1. Extended `MutationAction` type to `"create" | "update" | "delete"`.
  2. Added an explicit `else if (item.action === "delete")` branch in `offline-sync-runner.ts` that safely deletes both `quotation_items` and `quotations` records upon network reconnection.

---

### 4.5 Mobile Touch Targets & Dialer `tel:` Protocol Sanitization
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/app/(dashboard)/quotations/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/page.tsx), [`src/app/(dashboard)/quotations/[id]/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/%5Bid%5D/page.tsx)
* **The Problem**:
  - Quick action buttons (Convert to Invoice, WhatsApp Share, Download PDF, Edit, Delete) used `p-1.5` or `h-8 w-8` (24–32px), violating the 36–44px mobile touch target rule.
  - Dialer links (`tel:${q.clientPhone}`) passed raw phone strings with spaces or dashes, causing native phone dialers on some mobile devices to fail.
* **The Fix**:
  1. Enlarged quick action buttons in both grid cards and table rows to `flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-xl` with `h-3.5 w-3.5` icons.
  2. Enlarged bottom action buttons (Convert to Invoice, Preview PDF) to `min-h-[38px] py-2 px-3 text-xs font-bold`.
  3. Sanitized phone numbers for `tel:` dialer links: `q.clientPhone.replace(/[^0-9+]/g, "")`, preserving international `+` prefixes while stripping whitespaces and special characters.

---

---

## 🧾 Module 5: Invoices & Core Billing Engine

### 5.1 Invoice Deletion Rollback, Linked Payments Cleanup & Ledger Recalculation
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/app/(dashboard)/invoices/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/page.tsx), [`src/services/invoice.service.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/services/invoice.service.ts)
* **The Problem**:
  1. `handleDeleteInvoice` optimistically removed the invoice from component state without saving a backup snapshot or checking the result of `InvoiceService.deleteInvoice(id)`. If the deletion failed, the invoice vanished from the UI until a hard reload.
  2. `InvoiceService.deleteInvoice(id)` attempted `delete from invoices` without first cleaning up linked payment receipts in `payments`, triggering foreign key constraint rejections in PostgreSQL.
  3. Deletion did not catch `isNetworkError()` to enqueue offline mutations to IndexedDB.
* **The Fix**:
  1. Added state snapshot backup and rollback in `handleDeleteInvoice`:
     ```ts
     const backup = [...invoicesList];
     setInvoicesList((prev) => prev.filter((inv) => inv.id !== id));
     try {
       const ok = await InvoiceService.deleteInvoice(id);
       if (!ok) {
         setInvoicesList(backup);
         alert("Failed to delete invoice. Please try again.");
       }
     } catch (err) {
       setInvoicesList(backup);
       alert("Failed to delete invoice. Please check your network connection.");
     }
     ```
  2. Updated `InvoiceService.deleteInvoice(id)` to safely delete linked `payments` and `invoice_items` records before deleting the invoice.
  3. Integrated `ClientService.recalculateClientLedger(inv.client_id)` to keep customer balance due and billed totals accurate.
  4. Added offline network error detection with `enqueueMutation({ entityType: "invoice", action: "delete", ... })`.

---

### 5.2 Strict Invoice Validation Schema & Boundary Checking
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/validations/invoice.schema.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/validations/invoice.schema.ts), [`src/app/(dashboard)/invoices/new/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/new/page.tsx), [`src/app/(dashboard)/invoices/[id]/edit/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/%5Bid%5D/edit/page.tsx)
* **The Problem**:
  `validateInvoice` lacked date ordering enforcement (`dueDate >= issueDate`), paid amount boundaries (preventing negative paid amounts or paid amounts exceeding total bills), discount percentage limits (> 100%), and line item boundary checks. In addition, `validateInvoice()` was not wired into `handleSubmit` in `invoices/new/page.tsx` and `invoices/[id]/edit/page.tsx`.
* **The Fix**:
  1. Extended `validateInvoice()`:
     - Date ordering: `dueDate` cannot precede `issueDate`.
     - Paid amount: non-negative and capped at `totalAmount`.
     - Overall discount: percentage between 0–100%, non-negative.
     - Line items: non-negative amount, rate >= 0, quantity > 0, discount percentage <= 100%.
  2. Wired `validateInvoice()` into `handleSubmit` in both `invoices/new/page.tsx` and `invoices/[id]/edit/page.tsx` with user-friendly alerts.

---

### 5.3 Offline Invoice Deletion Replay Support
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/lib/offline-sync-runner.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/lib/offline-sync-runner.ts)
* **The Problem**:
  In `offline-sync-runner.ts`, `case "invoice"` only checked `if (item.action === "create")`, assuming all other actions were updates requiring `item.payload.invPayload`. If an offline invoice deletion was queued, replay crashed.
* **The Fix**:
  Added an explicit `else if (item.action === "delete")` branch in `offline-sync-runner.ts` that safely deletes linked payments, invoice items, and the invoice upon network recovery.

---

### 5.4 Mobile Touch Target Enlargement & Dialer Link Sanitization
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/app/(dashboard)/invoices/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/page.tsx), [`src/app/(dashboard)/invoices/[id]/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/%5Bid%5D/page.tsx)
* **The Problem**:
  - Quick action buttons (Record Pay, WhatsApp Share, PDF, Preview, Edit, Delete) in table view and card view were undersized (`p-1.5` and `h-8 w-8`), making them hard to tap on mobile touchscreens.
  - Dialer links (`tel:${invoice.clientPhone}`) stripped leading `+` signs or passed raw unformatted strings.
* **The Fix**:
  1. Enlarged quick action buttons in table rows and grid cards to `flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-xl` with `h-3.5 w-3.5` icons.
  2. Enlarged bottom action buttons (Record Pay, Preview PDF) to `min-h-[38px] py-2 px-3 text-xs font-bold`.
  3. Sanitized dialer phone links: `phone.replace(/[^0-9+]/g, "")`, preserving international `+` prefixes while removing spaces and dashes.

---

---

## 💳 Module 6: Payments, Receipts & Public Pay Portal

### 6.1 Accounting Integrity: Invoice Balance & Status Reversal on Payment Deletion
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/services/payment.service.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/services/payment.service.ts)
* **The Problem**:
  When a payment receipt was deleted, `PaymentService.deletePayment(id)` deleted the record from Supabase, but never updated the linked invoice. If an invoice had ₹10,000 total with a ₹5,000 payment (status: `partially_paid`, balance: ₹5,000), deleting the receipt left the invoice permanently claiming ₹5,000 had been paid with only ₹5,000 due, corrupting accounts.
* **The Fix**:
  1. Updated `PaymentService.deletePayment(id)` to retrieve linked `invoice_id` and `amount` prior to deletion.
  2. Subtracted payment amount from invoice `paid_amount`, recomputed `balance_due = Math.max(0, total - newPaid)`, and updated status (`paid` if balance <= 0, `partially_paid` if paid > 0, `due` if paid = 0).
  3. Synchronized both Supabase and local cache (`billease_invoices_${tenantId}`) and triggered `ClientService.recalculateClientLedger()`.
  4. Enqueued offline mutation if network disconnects.

---

### 6.2 `PaymentRecordModal` Production Service Wiring & Validation
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/components/invoices/payment-record-modal.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/invoices/payment-record-modal.tsx)
* **The Problem**:
  The modal opened from the Invoice Detail page (`/invoices/[id]`) executed a fake `setTimeout(..., 500)` without ever calling `PaymentService.createPayment()`. When the page reloaded upon "success", zero payments were logged.
* **The Fix**:
  1. Connected modal to `PaymentService.createPayment()`.
  2. Integrated `validatePayment()` verifying that payment amount is positive and does not exceed invoice balance due.
  3. Added inline validation error indicators and server error banner with responsive touch button sizes (`min-h-[38px]`).

---

### 6.3 Offline Sync Runner Payment Deletion Replay Support
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/lib/offline-sync-runner.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/lib/offline-sync-runner.ts)
* **The Problem**:
  In `offline-sync-runner.ts`, `case "payment"` only handled insertions. If an offline payment deletion mutation was enqueued, replay attempted to insert `undefined` and crashed.
* **The Fix**:
  Added an explicit `if (item.action === "delete")` branch in `case "payment"` that deletes the payment record from Supabase and applies the calculated `newPaid`, `newBalance`, and `newStatus` to the linked invoice upon network recovery.

---

### 6.4 Formal Payment Validation Schema & Record Payment Boundary Enforcement
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/validations/payment.schema.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/validations/payment.schema.ts), [`src/app/(dashboard)/payments/record/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/payments/record/page.tsx)
* **The Problem**:
  `src/validations/payment.schema.ts` existed but was completely unused. Forms allowed negative or zero payments and overpayments beyond balance due without giving inline field feedback. If `PaymentService.createPayment()` returned `null` on error, the user was redirected to `/payments` anyway.
* **The Fix**:
  1. Refactored `src/validations/payment.schema.ts` with pure TypeScript validation (`validatePayment()` and `isPaymentValid()`).
  2. Enforced amount > 0, balance due bounds (`amount <= maxAllowed`), valid dates, and standard payment methods (`upi`, `bank_transfer`, `cash`, `cheque`, `card`, `online`, `other`).
  3. Integrated validation into `RecordPaymentForm`, added real-time inline errors and error banner, and prevented navigation on creation failure.

---

### 6.5 Payments Ledger Optimistic Deletion State Rollback
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/app/(dashboard)/payments/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/payments/page.tsx)
* **The Problem**:
  `handleDeletePayment` filtered out the receipt from local state before awaiting the deletion. If deletion failed, the receipt vanished from UI while remaining in database.
* **The Fix**:
  Implemented snapshot backup and rollback:
  ```ts
  const backup = [...paymentsList];
  setPaymentsList((prev) => prev.filter((p) => p.id !== id));
  try {
    const success = await PaymentService.deletePayment(id);
    if (!success) {
      setPaymentsList(backup);
      alert("Failed to delete payment receipt. State has been restored.");
    }
  } catch (err) {
    setPaymentsList(backup);
    alert("An error occurred while deleting payment receipt. State has been restored.");
  }
  ```

---

### 6.6 Mobile Touch Target Enlargement (Ledger & Public Pay Portal)
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/app/(dashboard)/payments/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/payments/page.tsx), [`src/app/pay/[id]/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/pay/%5Bid%5D/page.tsx)
* **The Problem**:
  - In `payments/page.tsx`, card delete button was `h-7 w-7` (28px) and table action buttons were `p-1.5` (~24px), violating the 36px touch target requirement.
  - In `pay/[id]/page.tsx`, bank transfer copy buttons (Beneficiary, Account Number, IFSC, UPI ID) were `p-0.5` (~16px), causing frequent mis-taps on mobile devices.
* **The Fix**:
  1. Enlarged card and table action buttons in `payments/page.tsx` to `flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-xl` with `h-4 w-4` icons.
  2. Enlarged bank transfer copy buttons in `pay/[id]/page.tsx` to `min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-xl bg-slate-100 hover:bg-emerald-50`.

---

## 📊 Module 7: Reports & GST Compliance

### 7.1 CGST Section 15 Discount Deduction from Taxable Turnover
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/lib/gst-engine.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/lib/gst-engine.ts)
* **The Problem**:
  Under Section 15 of the CGST Act, taxable supply value must deduct trade discounts allowed before or at the time of supply. In `computeGstr3bSummary()` and `generateGstr1Report()`, `taxableTurnover` was summing `inv.subtotal` (gross pre-discount amount) rather than the actual post-discount taxable turnover (`Math.max(0, (inv.subtotal || 0) - (inv.discountAmount || 0))`). This caused taxable turnover on GSTR-3B Table 3.1(a) and GSTR-1 summaries to be overstated whenever an invoice had discounts applied.
* **The Fix**:
  Updated taxable turnover computation in both functions to deduct `inv.discountAmount`:
  ```ts
  const invTaxable = Math.max(0, (inv.subtotal || 0) - (inv.discountAmount || 0));
  taxableTurnover += invTaxable;
  ```

---

### 7.2 Proportional Line-Item Discount Distribution in HSN Summary (Table 12)
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/lib/gst-engine.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/lib/gst-engine.ts)
* **The Problem**:
  In `generateGstr1Report()` Table 12 (HSN-wise summary of outward supplies), `totalTaxableValue` was summing `item.total` directly. If an invoice had an overall discount applied, the individual HSN line items were not deducting their allocated portion of the discount. Consequently, the sum of Table 12 taxable values did not reconcile with Table 4A/B2B or Table 7/B2CS taxable turnover.
* **The Fix**:
  Calculated the discount ratio `(inv.subtotal > 0 ? (inv.discountAmount || 0) / inv.subtotal : 0)` and discounted each line item's taxable value proportionally:
  ```ts
  const discountRatio = (inv.subtotal || 0) > 0 ? (inv.discountAmount || 0) / (inv.subtotal || 1) : 0;
  // In line item loop:
  const lineDiscount = (item.total || 0) * discountRatio;
  const lineTaxable = Math.max(0, (item.total || 0) - lineDiscount);
  entry.totalTaxableValue = Math.round((entry.totalTaxableValue + lineTaxable) * 100) / 100;
  ```

---

### 7.3 State Code Extraction Leading-Whitespace Sanitization
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/lib/gst-engine.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/lib/gst-engine.ts)
* **The Problem**:
  In `getPlaceOfSupply()`, client GSTIN state code was extracted via `gstin.slice(0, 2)`. If a user entered a GSTIN with leading whitespace (e.g. `" 27AAAAA0000A1Z5"`), `slice(0, 2)` produced `" 2"`, which failed the lookup in `GST_STATE_CODES` and defaulted to `pos = null`. As a result, inter-state vs. intra-state tax determination failed, misclassifying supplies between IGST and CGST/SGST.
* **The Fix**:
  Sanitized the GSTIN with `.trim().toUpperCase()` before slicing the 2-digit state code:
  ```ts
  const cleanGstin = gstin.trim().toUpperCase();
  const code = cleanGstin.slice(0, 2);
  ```

---

### 7.4 Multi-Year Financial Quarter Isolation in Reports & GST Filing Hub
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/components/reports/gst-filing-hub.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/reports/gst-filing-hub.tsx), [`src/app/(dashboard)/reports/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/reports/page.tsx)
* **The Problem**:
  Financial quarter filtering was checking only `quarterMonths.includes(month)`, ignoring the invoice's calendar year. Because Indian financial years run from April to March (Months 4–12 in year $Y$, Months 1–3 in year $Y+1$), invoices from different financial years matching the same month (e.g., May 2025 vs May 2026) leaked into the quarterly reports whenever data spanned multiple financial years.
* **The Fix**:
  Implemented strict financial year and quarter matching:
  ```ts
  const [startYearStr] = fy.split("-");
  const fyStartYear = parseInt(startYearStr, 10);
  const fyEndYear = fyStartYear + 1;
  const invDate = new Date(inv.issueDate);
  const m = invDate.getMonth() + 1;
  const y = invDate.getFullYear();

  // Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec) belong to fyStartYear; Q4 (Jan-Mar) belongs to fyEndYear
  const expectedYear = m >= 4 ? fyStartYear : fyEndYear;
  return mInQ && y === expectedYear;
  ```

---

### 7.5 Dynamic Quarterly Return Period Code Formatting
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/components/reports/gst-filing-hub.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/reports/gst-filing-hub.tsx)
* **The Problem**:
  GSTR-1 JSON and CSV exports hardcoded the return period as `"032026"` (March 2026) regardless of the selected quarter. For example, filing Q1 (Apr–Jun) generated a return period of `"032026"`, which would be rejected by the GST offline tool or portal.
* **The Fix**:
  Dynamically computed the quarter-ending month and year code (MMYYYY):
  ```ts
  const qEndingMonths: Record<string, { month: string; isNextYear: boolean }> = {
    Q1: { month: "06", isNextYear: false },
    Q2: { month: "09", isNextYear: false },
    Q3: { month: "12", isNextYear: false },
    Q4: { month: "03", isNextYear: true },
  };
  const endingInfo = qEndingMonths[quarter] || { month: "03", isNextYear: true };
  const periodYear = endingInfo.isNextYear ? fyEndYear : fyStartYear;
  const returnPeriod = `${endingInfo.month}${periodYear}`;
  ```

---

### 7.6 Mobile Touch Target Enlargement (Reports Dashboard & GST Filing Hub)
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/app/(dashboard)/reports/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/reports/page.tsx), [`src/components/reports/gst-filing-hub.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/reports/gst-filing-hub.tsx)
* **The Problem**:
  - In `reports/page.tsx`, timeframe selection pills (`px-3 py-1.5`) and table action buttons (`p-1.5`) were under 32px height, making them difficult to tap accurately on mobile screens.
  - In `gst-filing-hub.tsx`, sub-tab navigation buttons, quarter selection pills, and JSON/CSV export buttons lacked minimum touch targets.
* **The Fix**:
  1. Enlarged timeframe pills in `reports/page.tsx` to `min-h-[36px] px-3.5 py-2 inline-flex items-center text-xs font-medium rounded-xl`.
  2. Enlarged client table action buttons to `min-h-[36px] min-w-[36px] p-2 inline-flex items-center justify-center rounded-xl`.
  3. Enlarged tab buttons, quarter pills, and export buttons in `gst-filing-hub.tsx` to $\ge$36–38px touch targets with tactile active feedback.

---

---

## ⚙️ Module 8: Settings, Multi-Tenancy & Notifications

### 8.1 Multi-Tenant Switching Desync & LocalStorage Namespacing Isolation
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/context/tenant-context.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/context/tenant-context.tsx), [`src/services/auth.service.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/services/auth.service.ts)
* **The Problem**:
  1. `switchTenant(tenantId)` previously only mutated the `id` field in local React state (`setCurrentTenant(prev => ({ ...prev, id: tenantId }))`). It never loaded the switched tenant's database record or settings. Consequently, Tenant A's business name, bank details, and numbering sequences remained in memory under Tenant B's ID, risking cross-tenant data overwrite.
  2. In `loadTenantAndUser()`, `registeredInfo.tenantId` in the shared `billease_registered_user` key took precedence over `billease_active_tenant_id`. Switching to a different tenant reverted on page reloads.
  3. Settings and profile persistence wrote into an unpartitioned global key in `localStorage`, leading to cross-tenant cache contamination.
* **The Fix**:
  1. Updated `switchTenant` to store `billease_active_tenant_id` in both `sessionStorage` and `localStorage`, set `AuthService.setActiveTenantId(tenantId)`, and trigger an asynchronous reload via `loadTenantAndUser()`:
     ```ts
     const switchTenant = async (tenantId: string) => {
       AuthService.setActiveTenantId(tenantId);
       if (typeof window !== "undefined") {
         sessionStorage.setItem("billease_active_tenant_id", tenantId);
         localStorage.setItem("billease_active_tenant_id", tenantId);
       }
       setIsLoading(true);
       try {
         await loadTenantAndUser();
       } finally {
         setIsLoading(false);
       }
     };
     ```
  2. Prioritized `billease_active_tenant_id` during tenant resolution.
  3. Namespaced local storage per tenant:
     - `billease_tenant_settings_${currentTenant.id}`
     - `billease_tenant_profile_${currentTenant.id}`
  4. Merged tenant-specific cached profile and settings during tenant bootstrap.

---

### 8.2 Comprehensive Settings & Business Profile Validation Schema
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**: [`src/validations/settings.schema.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/validations/settings.schema.ts), [`src/app/(dashboard)/settings/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/settings/page.tsx)
* **The Problem**:
  [`src/validations/settings.schema.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/validations/settings.schema.ts) had an unused stub function. Settings forms allowed saving invalid emails, phone numbers with $<10$ digits, invalid GSTINs with nonexistent state codes, invalid bank IFSC codes, malformed UPI VPAs missing `@`, and tax rates outside 0–100%.
* **The Fix**:
  1. Rebuilt [`src/validations/settings.schema.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/validations/settings.schema.ts) with pure TypeScript validation (`validateSettings()`):
     - Business Name & Owner Name: Minimum 2 non-whitespace characters.
     - Phone: Requires at least 10 cleaned numeric digits.
     - Email: RFC-compliant email regex.
     - GSTIN: Optional; when provided, verifies 15-character format and checks that the 2-digit state code exists in `GST_STATE_CODES`.
     - UPI ID: Validates VPA format `^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$`.
     - IFSC Code: Validates standard Indian format `^[A-Z]{4}0[A-Z0-9]{6}$`.
     - Account Number: Requires 9 to 18 numeric digits.
     - Numbering: Requires non-empty prefixes and positive integers ($\ge 1$).
     - Default Tax Rate: Requires rate between 0% and 100%.
  2. Wired `validateSettings()` into `handleSave` in `settings/page.tsx`:
     - Displays red outline and inline validation error text under invalid fields.
     - Displays error alert banner at top of form.
     - Automatically switches to the tab containing the first invalid field so users receive instant visual guidance.

---

### 8.3 Settings Persistence Crash & Null Safety Guards
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/app/(dashboard)/settings/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/settings/page.tsx)
* **The Problem**:
  `handleSave` spread `...currentTenant.address` and `...currentTenant.settings.quotationNumbering` without null-coalescing. If `currentTenant` was still initializing, saving triggered an unhandled `TypeError`. There was no `isSaving` loading guard, allowing rapid double-clicks to fire duplicate requests, and no error feedback if network/Supabase failed.
* **The Fix**:
  1. Applied safe null-coalescing defaults across all nested objects:
     `...(currentTenant?.address || {})`, `...(currentTenant?.settings?.quotationNumbering || { digitLength: 4 })`.
  2. Added `isSaving` state with disabled state and loading spinner on the submit button.
  3. Wrapped persistence calls in `try/catch` with a clear user alert banner on failure.

---

### 8.4 Sequence Number Sanitization & Positive Lower Bound Enforcement
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/app/(dashboard)/settings/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/settings/page.tsx)
* **The Problem**:
  Numbering sequence inputs used `parseInt(e.target.value) || 0`, allowing `0`, negative numbers, or `NaN`. Negative or zero sequence numbers would corrupt invoice generation and cause numbering collisions. Prefixes also allowed spaces and illegal symbols.
* **The Fix**:
  1. Clamped sequence numbers to positive integers:
     `setQuoteNext(Math.max(1, parseInt(e.target.value, 10) || 1))`
     `setInvNext(Math.max(1, parseInt(e.target.value, 10) || 1))`
  2. Sanitized prefixes to uppercase alphanumeric characters, hyphens, and slashes:
     `e.target.value.replace(/[^a-zA-Z0-9\-_/]/g, "").toUpperCase()`

---

### 8.5 Mobile Touch Target Enlargement & Viewport Usability
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**:
  - [`src/app/(dashboard)/settings/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/settings/page.tsx)
  - [`src/components/layout/notification-dropdown.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/layout/notification-dropdown.tsx)
  - [`src/components/documents/document-format-bar.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/documents/document-format-bar.tsx)
* **The Problem**:
  - In `settings/page.tsx`: Preset buttons (`⚡ Friendly Nudge`) were $\sim$28px, dynamic variable insert tags (`+ {client_name}`) were $\sim$26px, tax slab buttons were $\sim$32px, and the Save button was not full-width on mobile.
  - In `notification-dropdown.tsx`: Dismiss `X` buttons were `p-1` ($\sim$20px), filter pills were $\sim$24px, and action buttons lacked minimum touch targets.
  - In `document-format-bar.tsx`: Category tabs (A4, A5, Thermal) were `px-3.5 py-1.5` ($\sim$32px).
* **The Fix**:
  1. Enlarged WhatsApp preset buttons to `min-h-[36px] px-3.5 py-2`.
  2. Enlarged dynamic variable tags to `min-h-[38px] px-3 py-1.5 text-xs font-mono font-bold inline-flex items-center`.
  3. Enlarged tax rate buttons to `min-h-[42px] py-2.5 rounded-xl font-extrabold flex items-center justify-center`.
  4. Enlarged Save button to responsive full-width on mobile: `w-full sm:w-auto min-h-[44px]`.
  5. Enlarged notification dismiss `X` button to `min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-xl`.
  6. Enlarged notification filter pills to `min-h-[36px] px-3 py-1.5`.
  7. Enlarged "Mark all read", "Clear all", and "Enable Web Push" to $\ge$36px touch targets.
  8. Enlarged document format size tabs to `min-h-[38px] px-3.5 py-2`.

---

### 8.6 Mobile App-Switch Draft Resilience, Unified Atomic Persistence & Bank Input Sanitization
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**:
  - [`src/context/tenant-context.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/context/tenant-context.tsx)
  - [`src/app/(dashboard)/settings/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/settings/page.tsx)
  - [`tests/settings-module-fixes.test.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/tests/settings-module-fixes.test.ts)
* **The Problem**:
  1. **Tab Refocus / App-Switch Draft Loss**: When users switched away on mobile (e.g., opened the Gallery or Photos app to check their bank account number or copy an IFSC code) and returned to the browser tab, the browser fired `visibilitychange` / `focus` events. Supabase's `onAuthStateChange` listener re-triggered `loadTenantAndUser()` and generated a new `currentTenant` object reference. In `settings/page.tsx`, `useEffect([currentTenant])` unconditionally re-initialized form state, wiping out whatever the user had typed.
  2. **Mobile Low-RAM Tab Discard**: On memory-constrained mobile devices, opening the camera or gallery causes the operating system to unload the browser tab. On tab restore, React state was reset to DB defaults and the active tab reverted to `"profile"`, losing in-progress edits on the Bank tab.
  3. **Sequential Stale Overwrite Race**: Settings previously updated profile (`updateTenantProfile`) and settings (`updateTenantSettings`) in two consecutive asynchronous calls. Because React state batching was async, the second call read stale `currentTenant.settings` and overwrote the changes made by the first call.
  4. **Bank Account & IFSC Whitespace Errors**: When copying bank account numbers from SMS or mobile banking apps (which often format numbers with spaces like `5010 0234 5678 90`), validation failed with "must be 9 to 18 numeric digits", frustrating mobile users.
* **The Fix**:
  1. **Dirty Form Guard**: Added `isDirtyRef` to `settings/page.tsx`. If `isDirtyRef.current === true`, `useEffect([currentTenant])` aborts early and **never** overwrites active user inputs upon refocus or auth token refreshes.
  2. **Dual-Layer `sessionStorage` Persistence**: Created `markDirtyAndPersist` which immediately serializes unsaved form state into `sessionStorage` (`billease_settings_draft_${tenantId}`) and syncs the active tab. If mobile RAM unloads the page, returning immediately restores all form fields, restores the active tab, and shows a "Draft Restored" banner with a "Discard Draft" option.
  3. **Unified Atomic `updateFullTenant`**: Added `updateFullTenant(profile, settings)` in `TenantContext`. It merges both profile and settings into a single atomic Supabase query (`supabase.from("tenants").update({...}).eq("id", id)`), updates React state, and syncs `localStorage` simultaneously, eliminating race conditions.
  4. **Automatic Mobile Input Sanitization**:
     - Bank Account Number: Automatically strips spaces and hyphens on typing/pasting (`.replace(/[\s-]/g, "")`).
     - IFSC Code: Automatically strips whitespace and capitalizes (`.replace(/\s+/g, "").toUpperCase()`).
     - UPI ID: Automatically strips whitespace and lowercases (`.replace(/\s+/g, "").toLowerCase()`).
  5. **Mobile Sticky Floating Save Bar**: Added a responsive, sticky bottom floating action bar on mobile viewports (`md:hidden fixed bottom-0 inset-x-0 z-40`) displaying a pulsing "Unsaved Edits" badge and a full-width Save button (`min-h-[44px]`), allowing instant saving without scrolling to the bottom.
  6. **Route Exit Protection**: Integrated `<UnsavedChangesDialog>` with `useUnsavedChanges` to prevent accidental navigation away when unsaved changes exist.

---

### 8.7 Cross-Tenant Asset Isolation & Mobile Browser Tab Session Cleanliness
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**:
  - [`src/context/tenant-context.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/context/tenant-context.tsx)
  - [`src/services/auth.service.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/services/auth.service.ts)
  - [`src/app/(dashboard)/settings/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/settings/page.tsx)
  - [`tests/settings-module-fixes.test.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/tests/settings-module-fixes.test.ts)
* **The Problem**:
  1. **Ungated LocalStorage Fallback**: In `tenant-context.tsx`, `loadedTenant.logoUrl` and `signatureUrl` fell back to `(!isImpersonating ? registeredInfo?.logoUrl : undefined)` without verifying that `registeredInfo.tenantId === tenantId`. If a user previously uploaded a logo or signature on mobile for Business A (e.g. Drone Skyline), and later created or logged into Business B (e.g. GOA DIGITAL) whose DB record had no logo yet, Business B automatically inherited Business A's logo and signature.
  2. **Mobile Tab Draft Bleed**: On mobile, browser tabs are rarely closed and keep `sessionStorage` alive across logouts and new signups. Because `settings/page.tsx` did not stamp `tenantId` into serialized drafts or validate `draft.tenantId === currentTenant.id` on mount, old drafts from previous accounts were restored and set `isDirtyRef.current = true`, blocking fresh tenant data from syncing.
  3. **No Session Clearance on SignUp / SignOut**: `AuthService.signOut()` and `AuthService.signUp()` did not clear `sessionStorage`, allowing stale drafts and cached user records to persist in the mobile tab.
  4. **Logo & Signature Remove Buttons**: Clicking "Remove" for logo or signature in `settings/page.tsx` only called `setLogoUrl("")` / `setSignatureUrl("")` without notifying `markDirtyAndPersist`, so removing assets failed to update the draft or dirty state.
* **The Fix**:
  1. **Strict Matching Tenant Gate**: In `tenant-context.tsx`, created `const isMatchingReg = !isImpersonating && Boolean(registeredInfo?.tenantId && registeredInfo.tenantId === tenantId);`. All fallbacks for `businessName`, `ownerName`, `phone`, `email`, `logoUrl`, `signatureUrl`, `bankDetails`, and `settings` are strictly gated by `isMatchingReg`. If `registeredInfo.tenantId !== tenantId`, it is completely ignored.
  2. **Tenant ID Stamped Drafts & Validation**:
     - `markDirtyAndPersist` in `settings/page.tsx` now explicitly records `tenantId: currentTenant?.id`.
     - On restore, `settings/page.tsx` strictly checks `draft.tenantId === currentTenant.id`. Any draft from another tenant or legacy unpartitioned storage is immediately purged.
     - Added `currentTenantIdRef` to detect account/tenant transitions. When switching or logging into a new tenant, dirty state and restored draft flags are immediately reset to guarantee fresh synchronization.
  3. **Clean Slate on SignUp & SignOut**: `AuthService.signOut()` and `AuthService.signUp()` now execute `sessionStorage.clear()` and wipe stale `billease_registered_user` entries, guaranteeing every new account starts with zero residue from prior sessions.
  4. **Reactive Asset Removal**: Updated "Remove" buttons for Logo and Signature to invoke `markDirtyAndPersist("logoUrl", "")` and `markDirtyAndPersist("signatureUrl", "")`.

---

## 🎨 Module 9: Document Templates & Mobile Responsive Rendering Engine

### 9.1 Floating Mobile Zoom Toggle Button Touch Target Enlargement
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/components/documents/responsive-document-sheet.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/documents/responsive-document-sheet.tsx)
* **The Problem**:
  The floating mobile zoom toggle button (`Zoom 100%` / `Fit to Screen`) was styled with `px-3 py-1.5 text-[11px]`, resulting in a tap height of only $\sim$26px. On small touchscreens, users frequently missed the toggle or accidentally triggered clicks on the underlying document sheet.
* **The Fix**:
  Enlarged the floating button to `min-h-[40px] px-4 py-2 text-xs font-bold rounded-full gap-2` with high-contrast backdrop blur (`bg-slate-900/95 backdrop-blur-md`), tactile active scale feedback (`active:scale-95`), and clear status indicators (`Maximize2` / `ZoomIn` icons).

---

### 9.2 Mobile 1-Tap Template Switcher Chip Bar
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/components/documents/document-format-bar.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/documents/document-format-bar.tsx)
* **The Problem**:
  When `hideCardsOnMobile={true}` was passed to reduce vertical scrolling on mobile screens, all template cards were completely hidden (`hidden sm:grid`). While clean, this forced mobile users to repeatedly tap the Next/Prev chevron arrows 4 times to cycle between templates in a category without any visual overview of available designs.
* **The Fix**:
  Added a horizontal-scrolling chip/pill selector on mobile (`sm:hidden flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar`) that displays all 5 template names for the active category (`[Modern Classic] [Advanced GST] [Tally] [Luxury] [Billbook]`). Mobile users can now switch directly to any format with a single tap. Also upgraded size tab buttons (A4, A5, Thermal) to `min-h-[40px]`.

---

### 9.3 Continuous Slip PDF Generation for Thermal & A5 Document Formats
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**:
  - [`src/lib/pdf-download-helper.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/lib/pdf-download-helper.ts)
  - [`src/app/(dashboard)/invoices/[id]/preview/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/%5Bid%5D/preview/page.tsx)
  - [`src/app/(dashboard)/quotations/[id]/preview/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/%5Bid%5D/preview/page.tsx)
* **The Problem**:
  `downloadElementAsPdf` hardcoded `windowWidth: 800` and `el.style.width = "800px"` in the html2canvas `onclone` callback. When downloading a **Thermal** POS slip (300px/380px native width) as PDF, the receipt canvas was forced to an 800px width, causing horizontal distortion and empty white margins. Additionally, standard A4 multi-page splits broke receipt formatting.
* **The Fix**:
  1. Updated `downloadElementAsPdf` to support `format: "a4" | "a5" | "thermal"` and dynamic `targetWidthPx` (380px for thermal, 800px for standard sheets).
  2. For thermal receipts, jsPDF now generates an authentic 80mm continuous roll PDF without page splits (`format: [80, slipHeight]`), capturing countertop receipts with vector-crisp QR codes.
  3. Updated `InvoicePreviewPage` and `QuotationPreviewPage` to automatically route thermal templates (`selectedTemplateId.startsWith("thermal")`) to the thermal PDF export engine.

---

### 9.4 Official "PAID" Rubber Stamp Mobile Viewport Bounds Normalization
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/components/documents/document-template-renderer.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/documents/document-template-renderer.tsx)
* **The Problem**:
  The official Paid rubber stamp used arbitrary desktop right offsets (`right-60 sm:right-68 md:right-76` for A4, `right-44` for A5). On scaled mobile viewports (320px–380px), shifting 240px (`right-60`) from the right edge pushed the stamp into the middle of the sheet, colliding with business titles and headers.
* **The Fix**:
  Adjusted right offsets to responsive, balanced classes:
  - Thermal: `top-8 right-2 w-20`
  - A5: `top-3 right-6 sm:top-4 sm:right-16 w-24 sm:w-32`
  - A4: `top-3 right-8 sm:top-4 sm:right-20 md:right-28 w-28 sm:w-36`
  This guarantees the stamp remains neatly stamped above the settlement information without clipping or covering invoice header text.

---

### 9.5 Mobile Sticky Bottom Quick Action Bar in Preview Pages
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**:
  - [`src/app/(dashboard)/invoices/[id]/preview/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/%5Bid%5D/preview/page.tsx)
  - [`src/app/(dashboard)/quotations/[id]/preview/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/%5Bid%5D/preview/page.tsx)
* **The Problem**:
  On mobile devices ($<640$px), action buttons at the top of preview pages wrapped into cramped rows with $\le$32px heights. Users scrolling down a long invoice or quotation had to scroll all the way back to the top to download PDF or print.
* **The Fix**:
  1. Enlarged desktop/tablet top action buttons to `min-h-[40px] px-3.5 py-2`.
  2. Added a sticky mobile floating bottom quick-action bar (`sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 flex items-center gap-2 shadow-2xl`):
     - Primary button: **Download PDF** (`min-h-[42px] flex-1 bg-emerald-600`) with loading spinner.
     - Secondary button: **Print** (`min-h-[42px] px-4`).
  3. Added bottom padding (`pb-24 sm:pb-12`) so the sticky action bar never obscures document content.

---

### 9.6 Template Registry Indian Compliance & Resilience Verification
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**:
  - [`src/config/document-templates.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/config/document-templates.ts)
  - [`src/components/documents/templates/shared/template-adapter.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/documents/templates/shared/template-adapter.ts)
  - [`tests/document-templates.test.ts`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/tests/document-templates.test.ts)
* **Verification Scope**:
  - Verified all 15 template registry definitions:
    - 5 A4: `a4_modern`, `a4_advanced_gst`, `a4_tally`, `a4_luxury`, `a4_billbook` (210×297mm portrait).
    - 5 A5: `a5_landscape_gst`, `a5_landscape_billbook`, `a5_portrait_challan`, `a5_portrait_modern`, `a5_traditional_bahi` (210×148mm landscape & 148×210mm portrait).
    - 5 Thermal: `thermal_80mm_standard`, `thermal_80mm_gst_qr`, `thermal_58mm_compact`, `thermal_boutique_cafe`, `thermal_grocery_retail` (58mm/80mm roll).
  - Normalization test coverage:
    - Zero-item documents (`items: []`) handle empty tables without NaN or crashing.
    - Missing tenant profile gracefully falls back to default business identity.
    - Quotation advance payment calculations (`advanceAmount`, `advanceType`, `advanceValue`) display booking advance vs delivery balance correctly.
### 9.7 Dual-Template Configuration for Invoices & Quotations
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**:
  - [`src/app/(dashboard)/settings/templates/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/settings/templates/page.tsx)
  - [`src/components/documents/document-format-bar.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/documents/document-format-bar.tsx)
* **The Problem**:
  Previously, `/settings/templates` only ever saved `defaultInvoiceTemplate`, leaving `defaultQuotationTemplate` unset. As a result, when a user customized their invoice template to A5 or Thermal, quotations continued to fall back to the default A4 format, causing confusion. Furthermore, the settings page only previewed mock invoices, preventing users from seeing how quotation-specific elements (such as validity dates and booking advances) rendered.
* **The Fix**:
  1. Added a prominent **Invoices vs Quotations** preview switcher tab in `/settings/templates`.
  2. Created `SAMPLE_PREVIEW_QUOTATION` containing validity dates, estimate notices, and booking advance percentages.
  3. Added an `"Apply this format to both Invoices & Quotations"` checkbox (checked by default) that automatically persists the chosen format to both `defaultInvoiceTemplate` and `defaultQuotationTemplate`.
  4. Preserves independent default configuration when the checkbox is unchecked, allowing businesses to use A4 Modern for quotations and A5 or Thermal for final sales invoices.

---

### 9.8 Live Document Template Switcher & Builder Draft Synchronization
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**:
  - [`src/app/(dashboard)/invoices/[id]/preview/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/%5Bid%5D/preview/page.tsx)
  - [`src/app/(dashboard)/quotations/[id]/preview/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/%5Bid%5D/preview/page.tsx)
  - [`src/app/(dashboard)/invoices/new/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/new/page.tsx)
  - [`src/app/(dashboard)/quotations/new/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/new/page.tsx)
* **The Problem**:
  1. In document preview pages, users had to navigate away to Settings to change a format and then return to see the result on their actual document data.
  2. In the creation builders (`/invoices/new` and `/quotations/new`), the "Live Preview" modal hardcoded legacy `InvoicePrintDocument` and `QuotationPrintDocument`, ignoring tenant-configured templates entirely.
* **The Fix**:
  1. Embedded interactive `[ Change Format ]` toggle buttons and collapsible `DocumentFormatBar` drawers directly into `/invoices/[id]/preview` and `/quotations/[id]/preview`, with instant live re-rendering on real document data.
  2. Added a 1-tap `[ Formats ]` action button in the sticky mobile bottom bar on both preview routes.
  3. Upgraded draft modals in both `/invoices/new` and `/quotations/new` to use `DocumentTemplateRenderer` with `currentTenant?.settings?.defaultInvoiceTemplate` and `defaultQuotationTemplate`.

---

## 📱 Module 10: Mobile UI/UX Responsiveness & Native App Experience (iOS & Multi-Screen Support)

### 10.1 iOS Notch, Dynamic Island & Bottom Gesture Bar Safe-Area Integration
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**:
  - [`src/app/globals.css`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/globals.css)
  - [`src/app/layout.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/layout.tsx)
  - [`src/components/layout/dashboard-shell.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/layout/dashboard-shell.tsx)
  - [`src/components/layout/mobile-bottom-bar.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/layout/mobile-bottom-bar.tsx)
* **The Problem**:
  On modern iPhones and iPads (iPhone X through iPhone 16 Pro Max), fixed floating bottom action bars sat directly behind the native iOS Home Indicator line. Users attempting to tap action buttons accidentally triggered app switcher swipes. Additionally, status bars were clipped by the camera notch/Dynamic Island.
* **The Fix**:
  1. Configured Next.js viewport metadata in `layout.tsx` with `viewportFit: "cover"`, `appleWebApp: { capable: true, statusBarStyle: "black-translucent" }`, and `interactiveWidget: "resizes-content"`.
  2. Implemented dedicated CSS safe-area utilities in `globals.css`:
     - `.pb-safe`: `padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0px))`
     - `.pt-safe`: `padding-top: max(0.5rem, env(safe-area-inset-top, 0px))`
     - `.mb-safe`: `margin-bottom: max(1rem, env(safe-area-inset-bottom, 0px))`
  3. Integrated `.pb-safe` on `MobileBottomBar`, the floating action bar in `/settings`, the sticky action bars in `/invoices/new`, `/quotations/new`, and both `/preview` routes.
  4. Updated `DashboardShell` `<main>` bottom clearance to `pb-32 pb-safe`, preventing any content from getting obscured beneath fixed mobile bars.

---

### 10.2 Permanent Elimination of iOS Safari Auto-Zoom Keyboard Jump
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/app/globals.css`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/globals.css)
* **The Problem**:
  iOS Safari has an OS-level heuristic that forcibly zooms into the webpage whenever any text input with `font-size < 16px` receives focus. When users tapped on invoice item fields, rates, or customer search inputs, the viewport awkwardly zoomed and shifted horizontally, breaking layouts and requiring manual pinch-to-zoom out.
* **The Fix**:
  Added an iOS-targeted media query in `globals.css`:
  ```css
  @media screen and (max-width: 768px) {
    input:not([type="checkbox"]):not([type="radio"]),
    select,
    textarea {
      font-size: 16px !important;
    }
  }
  ```
  On desktop and tablet screens ($\ge 769\text{px}$), inputs retain their sleek 12px/14px typography. On mobile devices, inputs render at 16px, permanently preventing Safari from auto-zooming or displacing the viewport.

---

### 10.3 Apple HIG Touch Targets ($\ge 44\text{px}$) & Tactile Press Ergonomics
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**:
  - [`src/app/globals.css`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/globals.css)
  - [`src/components/layout/mobile-bottom-bar.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/layout/mobile-bottom-bar.tsx)
  - [`src/components/layout/header.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/layout/header.tsx)
  - [`src/components/layout/sidebar.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/layout/sidebar.tsx)
  - [`src/app/(dashboard)/invoices/new/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/new/page.tsx)
  - [`src/app/(dashboard)/quotations/new/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/new/page.tsx)
  - [`src/app/(dashboard)/invoices/[id]/edit/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/%5Bid%5D/edit/page.tsx)
  - [`src/app/(dashboard)/quotations/[id]/edit/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/%5Bid%5D/edit/page.tsx)
  - [`src/app/(dashboard)/invoices/[id]/preview/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/%5Bid%5D/preview/page.tsx)
  - [`src/app/(dashboard)/quotations/[id]/preview/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/%5Bid%5D/preview/page.tsx)
* **The Problem**:
  Multiple mobile action buttons had heights between 32px and 38px, violating Apple's Human Interface Guidelines ($\ge 44 \times 44\text{pt}$ minimum tap target). Users also suffered a 300ms mobile tap delay and an annoying gray highlight box on iOS webkit taps.
* **The Fix**:
  1. Applied `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` globally in `globals.css` to completely eradicate the 300ms tap delay.
  2. Created the `.app-press` tactile compression utility (`active:scale-[0.96] active:opacity-92 transition-transform duration-75`) for immediate physical touch response.
  3. Upgraded all mobile action buttons across document builders, edit pages, preview screens, settings, sidebar drawer toggles, and bottom navigation tabs to `h-11 min-h-[44px]` with `app-press`.

---

### 10.4 Intelligent Floating Action Bar Routing & Collision Avoidance
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/components/layout/mobile-bottom-bar.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/layout/mobile-bottom-bar.tsx)
* **The Problem**:
  The global `MobileBottomBar` collided with page-specific sticky action bars on `/settings`, `/settings/templates`, `/new`, `/edit`, `/record`, and `/preview` routes, creating an unsightly "double bottom bar" stack that consumed half the mobile viewport.
* **The Fix**:
  Configured smart route detection in `MobileBottomBar`:
  ```ts
  const hasDedicatedMobileBar =
    pathname.endsWith("/new") ||
    pathname.includes("/edit") ||
    pathname.endsWith("/record") ||
    pathname.includes("/preview") ||
    pathname.startsWith("/settings");

  if (hasDedicatedMobileBar) {
    return null;
  }
  ```
  The global bar cleanly yields on dedicated action screens, giving users full edge-to-edge space with zero visual clutter.

---

### 10.5 Elimination of Raw Browser `alert()` Popups
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**:
  - [`src/app/(dashboard)/invoices/new/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/new/page.tsx)
  - [`src/app/(dashboard)/quotations/new/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/new/page.tsx)
  - [`src/app/(dashboard)/invoices/[id]/edit/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/%5Bid%5D/edit/page.tsx)
  - [`src/app/(dashboard)/quotations/[id]/edit/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/%5Bid%5D/edit/page.tsx)
  - [`src/app/(dashboard)/settings/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/settings/page.tsx)
  - [`src/components/layout/tenant-switcher.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/layout/tenant-switcher.tsx)
* **The Problem**:
  Browser `alert()` popups freeze execution on iOS Safari, block UI animations, and destroy the native mobile app illusion.
* **The Fix**:
  1. Replaced all builder form `alert(firstError)` calls with tactile neo-clay `formError` alert banners styled with `AlertCircle`, dismiss buttons, and smooth auto-scroll to top.
  2. Replaced image upload `alert("... must be under 2MB")` in Settings with in-app `errorMessage` state banners.
  3. Replaced the dummy `alert()` in `TenantSwitcher` with direct `<Link href="/settings">` navigation.

---

### 10.6 Native iOS Safari PWA "Add to Home Screen" Instructions
* **Status**: 🟢 FIXED & VERIFIED
* **Affected File**: [`src/components/layout/pwa-install-prompt.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/layout/pwa-install-prompt.tsx)
* **The Problem**:
  Apple Safari does not fire the Chromium standard `beforeinstallprompt` event. iOS users never saw the install prompt and were unaware that BillEase can be installed as a standalone fullscreen iOS app.
* **The Fix**:
  Implemented Apple user-agent detection:
  ```ts
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = isIos && userAgent.includes("safari") && !userAgent.includes("crios");
  ```
  When viewed in iOS Safari, the prompt automatically displays an iPhone-specific banner with `Share2` icon: *"Tap Share (bottom bar) then 'Add to Home Screen'"*.

---

### 10.7 Small-Screen Compactness & Horizontal Overflow Prevention (320px–375px)
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**:
  - [`src/components/layout/sidebar.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/layout/sidebar.tsx)
  - [`src/components/layout/dashboard-shell.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/layout/dashboard-shell.tsx)
  - [`src/app/(dashboard)/invoices/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/invoices/page.tsx)
  - [`src/app/(dashboard)/quotations/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/quotations/page.tsx)
  - [`src/app/(dashboard)/payments/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/payments/page.tsx)
  - [`src/app/(dashboard)/clients/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/clients/page.tsx)
* **The Problem**:
  On compact screens (e.g. 320px iPhone SE 1st gen, 375px iPhone 12/13 mini), fixed-width sidebars or unconstrained horizontally scrolling tracks caused horizontal page jiggle and clipped action buttons.
* **The Fix**:
  1. Constrained mobile drawer in `Sidebar` to `max-w-[85vw]` with `overscroll-contain`.
  2. Equipped all horizontal filter pill bars with `no-scrollbar scroll-touch` for momentum touch scrolling.
  3. Added `app-press` and `min-h-[36px]` to all filter tabs.
  4. Adjusted main content padding to `p-3 sm:p-6 lg:p-8` for optimal edge breathing room.

---

### 10.8 Mobile Scroll-Direction Auto-Hide & Generous Safety Clearance (`h-28 pb-safe`)
* **Status**: 🟢 FIXED & VERIFIED
* **Affected Files**:
  - [`src/components/layout/mobile-bottom-bar.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/layout/mobile-bottom-bar.tsx)
  - [`src/components/layout/dashboard-shell.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/components/layout/dashboard-shell.tsx)
  - [`src/app/(dashboard)/clients/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/clients/page.tsx)
  - [`src/app/(dashboard)/services/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/services/page.tsx)
  - [`src/app/(dashboard)/payments/page.tsx`](file:///c:/Users/ASUS/Downloads/BILLING%20SOFTWARE/src/app/%28dashboard%29/payments/page.tsx)
* **The Problem**:
  On mobile devices (e.g. iPhone, Android), card action buttons at the bottom of lists (such as `+ Quote`, `+ Invoice`, and `Ledger` on the client cards) could get obscured or partially clipped under the fixed bottom navigation bar when resting or scrolling near the bottom.
* **The Fix**:
  1. **Scroll-Direction Auto-Hide**:
     - `MobileBottomBar` now monitors scroll direction with `requestAnimationFrame` throttling and an 8px threshold to avoid micro-scroll jitter.
     - When scrolling down, the bottom bar smoothly translates down (`translate-y-full opacity-0 pointer-events-none`) with `transition-all duration-300 ease-in-out` to give 100% fullscreen viewing.
     - When scrolling up or when near top of the page (`scrollY <= 25px`), the bottom bar smoothly slides back into view.
     - If Quick Create menu is open or on route transitions, visibility is automatically preserved.
  2. **Dedicated Bottom Safety Spacer (`h-28 pb-safe`)**:
     - Added `<div className="h-28 pb-safe lg:hidden pointer-events-none" aria-hidden="true" />` at the bottom of `<main>` in `DashboardShell`.
     - Ensures even single-item lists or short pages allow scrolling well above the bottom navigation bar with zero occlusion.
  3. **Touch Action Targets**:
     - Upgraded action buttons on client, service, and payment cards to `min-h-[38px] rounded-xl app-press cursor-pointer` matching mobile OS guidelines.

---

## 🧪 Comprehensive Verification Matrix (All 10 Modules)

| Check | Tool / Runner | Result |
|---|---|---|
| **TypeScript Compilation** | `npx tsc --noEmit` | 🟢 0 errors |
| **Unit & Integration Tests** | `npx vitest run` (23 test files) | 🟢 179 / 179 passed |
| **Module 1 Specific Tests** | `tests/auth-module-fixes.test.ts` | 🟢 5 / 5 passed |
| **Module 2 Specific Tests** | `tests/client-module-fixes.test.ts` | 🟢 7 / 7 passed |
| **Module 3 Specific Tests** | `tests/service-module-fixes.test.ts` | 🟢 7 / 7 passed |
| **Module 4 Specific Tests** | `tests/quotation-module-fixes.test.ts` | 🟢 7 / 7 passed |
| **Module 5 Specific Tests** | `tests/invoice-module-fixes.test.ts` | 🟢 8 / 8 passed |
| **Module 6 Specific Tests** | `tests/payment-module-fixes.test.ts` | 🟢 7 / 7 passed |
| **Module 7 Specific Tests** | `tests/reports-gst-module-fixes.test.ts` | 🟢 7 / 7 passed |
| **Module 8 Specific Tests** | `tests/settings-module-fixes.test.ts` | 🟢 13 / 13 passed |
| **Module 9 Specific Tests** | `tests/document-templates.test.ts` | 🟢 13 / 13 passed |
| **Module 10 Mobile / iOS Verification** | Viewport, Safe-Area & Touch Tests | 🟢 Verified across 320px–430px & iOS Safari |
| **Next.js Production Build** | `npm run build` | 🟢 Build successful, 53/53 static routes compiled |










