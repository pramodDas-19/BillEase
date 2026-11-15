# BillEase Engineering Milestone & Daily Changelog
**Date**: November 15, 2026  
**Author**: Engineering Team  
**Status**: Completed & Verified (`main` branch)

---

## 1. Executive Summary

Today's milestone focused on three major pillars critical for commercial launch and enterprise adoption:
1. **Subscription Pricing & Multi-Tier Architecture Overhaul**: Restructured pricing into **30-Day Free Trial**, **Pro Plan** (₹999/mo, ₹9,999/yr for service SMBs/agencies), and **Ultra Pro Plan** (₹1,899/mo, ₹18,990/yr for inventory businesses with up to 10 users & RBAC).
2. **Mobile Print & "Save as PDF" Engine Overhaul**: Eliminated the ghost blank second page on Android mobile print spoolers, fixed the paper size defaulting to "Foolscap", and eliminated layout squishing.
3. **Direct PDF Download Alignment & Document Template Enhancements**: Resolved `html2canvas` font baseline offsets (text sitting too close to border lines), enabled full rendering of **Detailed Scope / Specifications**, PO numbers, Quotation references, Client PAN, and round-off amounts across all document templates.

---

## 2. Detailed Changelog by Module

### A. Pricing Structure, Tiers & Feature Gates
- **Free Trial (₹0)**:
  - 30-day duration.
  - Limit: 15 invoices and 15 quotations.
  - 10 inventory catalog preview items.
  - 1 user login (Admin).
  - Discreet "Powered by BillEase" branding watermark in document footers.
- **Pro Plan (₹999/mo | ₹9,999/yr — 2 Months Free)**:
  - Unlimited invoices, quotations, and payment receipts.
  - Optimized for agencies, consultancies, freelancers, contractors, and service providers (zero physical inventory needed).
  - Up to 3 users (Admin + Sales Representatives).
  - Custom branding, white-labeled PDFs (zero watermark), multi-format templates (A4, A5, Thermal).
- **Ultra Pro Plan (₹1,899/mo | ₹18,990/yr — 2 Months Free)**:
  - Full live inventory management (Stock levels, low-stock reorder alerts, stock ledger, barcode/SKU scanning).
  - Up to 10 users with full Role-Based Access Control (RBAC):
    - **Admin / Owner**: Full control over settings, billing, reports, users.
    - **Inventory Manager**: Stock in/out, reorder alerts, catalog updates, supplier management.
    - **Sales Representative**: Quotes, invoices, client records, collection logging.
    - **Accountant**: GST reports (GSTR-1, GSTR-3B), payments ledger, expenses, audits.
  - AI OCR automated paper bill and invoice scanning.
- **Files Updated**:
  - `src/types/tenant.types.ts`: Subscription plan types, user limits, and feature flags.
  - `src/app/pricing/page.tsx`: Interactive pricing table with annual/monthly switch (saving ₹1,989 - ₹3,798).
  - `src/components/pricing/upi-checkout-modal.tsx`: Direct instant UPI payment modal with dynamic QR codes.
  - `src/components/layout/paywall-modal.tsx` & `route-paywall-blocker.tsx`: Graceful feature locking and trial usage monitors.
  - `src/app/admin/page.tsx`: Admin tenant management and plan badge updates.

---

### B. Mobile Print & "Save as PDF" Overhaul (Android / iOS)
- **Eliminated Ghost Blank 2nd Page (`2/2`)**:
  - **Root Cause**: An invisible mobile bottom navigation spacer `<div className="h-28 pb-safe lg:hidden pointer-events-none" />` in `dashboard-shell.tsx` was rendered during print, adding 112px (~30mm) of empty space. Coupled with preview container `pb-28` and `print:min-h-[265mm]` in `a4-modern.tsx`, the total vertical height exceeded 297mm (A4 limit), spilling onto page 2.
  - **Fix**: Added `print:hidden` to the spacer, `print:p-0 print:pb-0 print:m-0` to preview containers, and changed `print:min-h-[265mm]` to `print:min-h-0 print:h-auto`.
  - **CSS Break Rules**: Enforced `break-after: avoid !important; page-break-after: avoid !important;` in `globals.css` and dynamic print styles.
- **Standardized Paper Size to A4**:
  - Declared `@page { size: A4; margin: 0; }` in `src/lib/print-page-helper.ts`. Android's print spooler now natively recognizes standard **A4** instead of defaulting to Foolscap.
- **Restored Full-Width 1:1 Scaling**:
  - Removed viewport meta tampering (`width=1024`) that caused mobile Chrome to downscale print layouts to 77%.
  - Normalized `.responsive-sheet-outer` and `.responsive-sheet-inner` with `margin: 0 !important; padding: 0 !important; transform: none !important;` so padding is never multiplied across nested containers.
- **Files Updated**:
  - `src/components/layout/dashboard-shell.tsx`
  - `src/app/(dashboard)/invoices/[id]/preview/page.tsx`
  - `src/app/(dashboard)/quotations/[id]/preview/page.tsx`
  - `src/components/documents/templates/a4/a4-modern.tsx`
  - `src/lib/print-page-helper.ts`
  - `src/app/globals.css`

---

### C. Direct PDF Download Alignment (`downloadElementAsPdf`)
- **Fixed Font Baseline Offset & Text Sinking near Borders**:
  - **Root Cause**: `html2canvas` calculates font metrics differently on Chromium/Android when an off-screen staging div is placed at large negative coordinates (`left: -99999px`), shifting text downward by 4–6px. In addition, Tailwind CSS preflight sets `img { display: block; }`, which creates invisible block gaps.
  - **Fixes Applied**:
    1. Repositioned sandbox to `left: 0; top: 0; opacity: 0; pointer-events: none;`, eliminating sub-pixel coordinate matrix distortion.
    2. Added `@layer base { img { display: inline-block; } }` in `globals.css`.
    3. Injected `letter-spacing: 0.01px !important;` and `line-height: 1.35 !important;` in the staging sandbox.
    4. Added `await document.fonts.ready` to ensure custom and system fonts are 100% loaded before canvas rasterization.
    5. Set `clone.style.minHeight = "0"` and `clone.style.height = "auto"` to guarantee single-page fitting.
    6. Table item rows updated to `align-middle` with `leading-normal` for balanced vertical spacing.
    7. Cleaned up stray punctuation (`.` or `,`) in tenant addresses.
- **Files Updated**:
  - `src/lib/pdf-download-helper.ts`
  - `src/app/globals.css`
  - `src/components/documents/templates/a4/a4-modern.tsx`

---

### D. Comprehensive Document Template Data Rendering
- **Detailed Scope / Specifications**:
  - Mapped `item.detailedNotes` in `src/components/documents/templates/shared/template-adapter.ts`.
  - In all 15 document templates (Modern A4, Advanced GST, Tally, Luxury, Billbook, A5, and Thermal), item specifications (deliverables, paper GSM, dimensions, milestones, scope notes) now render cleanly beneath the item title with `whitespace-pre-line` formatting.
- **PO Number (Purchase Order Reference)**:
  - Document meta now displays client PO number when provided (`PO Number: PO-XXXX`).
- **Quotation Reference on Invoices**:
  - Converted invoices display origin quotation number (`Quotation Ref: #QT-XXXX`).
- **Client PAN**:
  - Displays client PAN number alongside GSTIN in client billing cards.
- **Round-Off Itemization**:
  - When auto round-off is enabled, the calculated difference (`+₹0.40` or `-₹0.60`) is itemized right above the `TOTAL AMOUNT`.
- **Customer Notes & Instructions**:
  - Dedicated rendering blocks added for both **Terms & Conditions** and **Notes / Instructions**.
- **Files Updated**:
  - `src/components/documents/templates/shared/template-adapter.ts`
  - `src/components/documents/templates/a4/a4-modern.tsx`
  - `src/components/documents/templates/a4/a4-advanced-gst.tsx`

---

## 3. Git Commit History for Today

| Commit | Message | Key Changes |
| :--- | :--- | :--- |
| `308488f` | `feat(pricing): update plans to 30-Day Trial, Pro (999/mo) and Ultra Pro (1899/mo)` | Pricing overhaul, plan badges, FAQ, paywalls |
| `5d9672e` | `fix(mobile): resolve mobile print squishing and direct PDF download formatting` | Viewport & sandbox improvements |
| `5fb57d2` | `fix(print): eliminate Android mobile ghost blank 2nd page, fix Foolscap size` | Removed layout spacer in print, `@page` A4 locking |
| `1ef4c45` | `fix(pdf): fix text baseline shift near border lines in direct download` | Sandbox origin (0,0), Tailwind `img` fix, font ready |
| `e932cc2` | `feat(templates): render detailed scope, PO number, quotation ref, client PAN, round-off` | Data mapping in `template-adapter.ts` & templates |

---

## 4. Verification & Testing Status

- **Unit & Integration Tests**: 182 vitest tests passing (`npm run test`).
- **Production Build**: Clean Next.js 15.5 production build (`npm run build`) passing with 0 errors across 53 static & dynamic routes.
- **Repository**: All changes committed and pushed to GitHub `origin/main`.
