# BillEase — User Manual & Operational Guide

**Product Version:** 1.0.0 Production Ready  
**Target Audience:** All Indian businesses — Freelancers, Agencies, Service Providers, Consultants, Contractors, Physical Goods Sellers, Retail Shops, and SMBs.  
**Platform Architecture:** Multi-Tenant Web & Mobile PWA with Offline Synchronization  

---

## Table of Contents
1. [Getting Started & Initial Setup](#1-getting-started--initial-setup)
2. [Managing Business Profile & GST Compliance](#2-managing-business-profile--gst-compliance)
3. [Client Management](#3-client-management)
4. [Services & Product Catalog](#4-services--product-catalog)
5. [Quotations & Estimates Lifecycle](#5-quotations--estimates-lifecycle)
6. [Invoicing & GST Auto-Routing](#6-invoicing--gst-auto-routing)
7. [Advance Payments & Receipt Ledger](#7-advance-payments--receipt-ledger)
8. [Dynamic Bharat UPI QR & WhatsApp Collection](#8-dynamic-bharat-upi-qr--whatsapp-collection)
9. [15 Document Formats & Mobile Responsive Preview](#9-15-document-formats--mobile-responsive-preview)
10. [Analytics, Reports & Export](#10-analytics-reports--export)
11. [Offline Resilience & Sync](#11-offline-resilience--sync)
12. [Super-Admin Management](#12-super-admin-management)

---

## 1. Getting Started & Initial Setup

### 1.1 Account Creation & 7-Day Free Trial
* Visit `/signup` to create your business account in 30 seconds.
* **Zero Credit Card Friction**: Every new business receives full, unrestricted access for 7 days with zero upfront payment details required.
* Day-1 Interactive Onboarding Checklist guides you through:
  1. Setting your legal business identity and banking details.
  2. Adding your first client.
  3. Generating your first GST-compliant invoice or estimate.
  4. Testing dynamic UPI QR scanning and WhatsApp receipt sharing.

---

## 2. Managing Business Profile & GST Compliance

Navigate to **Settings** (`/settings`) from the left sidebar to configure your business identity.

### 2.1 Profile & Banking
* **Legal Business Name & Trade Name**: Displayed prominently on invoices and receipts.
* **GSTIN (Goods and Services Tax Identification Number)**:
  * Entering your 15-character GSTIN automatically extracts your home state code (e.g. `27` for Maharashtra, `07` for Delhi).
  * This code determines whether local Intra-State GST (CGST + SGST) or Inter-State GST (IGST) is applied to transactions.
* **Bank Account & IFSC**:
  * Bank Name, Account Number, IFSC Code, and Branch.
  * Embedded automatically into the payment details block of all A4, A5, and thermal bills.
* **UPI VPA (UPI ID)**:
  * Your Virtual Payment Address (e.g. `yourbusiness@okhdfcbank` or `name@upi`).
  * Used to dynamically generate on-invoice Bharat UPI QR codes.

---

## 3. Client Management

Navigate to **Clients** (`/clients`) to maintain an active directory of business relationships.

* **Add Client**: Record Name, Company Name, Contact Phone, Email, Billing Address, and Client GSTIN.
* **Intelligent Place of Supply**:
  * If the client provides a GSTIN, BillEase automatically identifies their state.
  * If the client's state differs from your registered state, the system automatically marks the client as Inter-State for IGST taxation.
* **Real-time Client Financial Ledger**:
  * Track Lifetime Billed, Total Paid, and current Balance Due per client.

---

## 4. Services & Product Catalog

Navigate to **Services & Catalog** (`/services`) to maintain your rate card.

### 4.1 Manual Item Creation
* Add items with Name, Category, Default Rate (₹), Unit (Hours, Days, Nos, Pcs, Sq.Ft, Units), HSN/SAC Code, and default GST rate (0%, 5%, 12%, 18%, 28%).

### 4.2 1-Click Excel / CSV Bulk Importer
* Click **"Import Catalog"** to upload existing inventory or service rate cards.
* Supports `.xlsx`, `.xls`, and `.csv`.
* **Built-in Sample Template**: Click "Download Sample Template" to obtain a pre-formatted Excel template with sample rows and column instructions.
* **Smart Column Mapping**: Automatically recognizes column variations (`Particulars`, `Item Name`, `Price`, `Rate`, `MRP`, `Tax`, `GST %`, `SAC/HSN`).
* **Pre-import Validation Preview**: Inspects your rows before saving to identify any missing fields or incorrect numbers.

---

## 5. Quotations & Estimates Lifecycle

Navigate to **Quotations** (`/quotations`) to generate professional estimates.

### 5.1 Creating an Estimate
1. Select Client or quickly type a new client.
2. Add line items from your catalog or write custom item descriptions with individual discounts and tax rates.
3. Configure optional advance payment terms (e.g., 20% advance or fixed ₹10,000 token).
4. Save as `Draft`, `Sent`, or `Accepted`.

### 5.2 1-Click Quotation-to-Invoice Conversion
* When a client accepts an estimate, click **"Convert to Invoice"**.
* BillEase instantly transfers all client details, line items, pricing, discounts, and advance payment metadata into the invoice builder without manual retyping.
* **Concurrency Protection**: Double-click locks prevent duplicate invoice generation.

---

## 6. Invoicing & GST Auto-Routing

Navigate to **Invoices** (`/invoices`) for tax invoice generation.

### 6.1 Strict Indian GST Rule 46 Compliance
* **Intra-State Transactions** (Supplier & Client in same state):
  * Automatically applies **CGST (50%) + SGST (50%)**.
* **Inter-State Transactions** (Supplier & Client in different states):
  * Automatically applies **IGST (100%)**.
* **HSN/SAC Display**: Rendered alongside line items to ensure input tax credit (ITC) eligibility for your B2B buyers.
* **Commercial Auto Round-Off**: Optional automated rounding adjustment ensuring clean, rounded settlement totals.

---

## 7. Advance Payments & Receipt Ledger

When issuing an invoice with an advance paid by the client:
1. In the **Advance Paid Amount (₹)** field, enter the amount received (e.g., ₹10,000).
2. Choose the **Payment Mode**:
   - **Cash** (Default)
   - **UPI**
   - **Bank Transfer (NEFT/RTGS)**
   - **Cheque**
3. Enter any optional payment reference (e.g., "Cash in hand" or "GPay Ref #98124").
4. Upon clicking **Save Invoice**:
   - The invoice balance due is deducted automatically.
   - An official receipt `#PAY-XXXX` is immediately created in **Payments & Receipts** (`/payments`).
   - Cash and bank ledgers are updated instantly.

---

## 8. Dynamic Bharat UPI QR & WhatsApp Collection

### 8.1 Zero-Fee Bharat UPI QR Code
* Every invoice preview and print document contains an automated vector QR code.
* Encoded with standard NPCI UPI parameters:
  `upi://pay?pa={UPI_ID}&pn={NAME}&am={BALANCE_DUE}&cu=INR`
* Clients open GPay, PhonePe, Paytm, or BHIM, scan the bill, and the exact balance amount is pre-filled without manual typing errors.
* Money credits directly to your bank account with zero gateway commissions or processing delays.

### 8.2 1-Click WhatsApp Reminders
* Click the WhatsApp button on any invoice or quotation.
* Formats a polite, localized payment reminder with invoice number, amount due, and direct payment link.
* Opens WhatsApp Web or WhatsApp Mobile directly.

---

## 9. 15 Document Formats & Mobile Responsive Preview

Configure default formats in **Settings → Document Templates** (`/settings/templates`).

### Available Formats:
* **A4 Formats (5)**: Advanced GST, Tally ERP Classic, Luxury Royal Gold, Modern Minimalist, Classic Billbook.
* **A5 Formats (5)**: A5 Landscape GST, A5 Landscape Billbook, A5 Portrait Challan, A5 Modern Studio, A5 Traditional Bahi-Khata.
* **Thermal POS / Slip Formats (5)**: 80mm Standard POS, 80mm GST Counter Slip, 58mm Mini Pocket Slip, Boutique & Cafe Slip, Supermarket Grocery Slip.

### Responsive Mobile Document Viewer:
* Dynamic paper scaling automatically resizes A4 and A5 sheets to fit mobile phone screens without clipping or horizontal scrollbars.
* Touch toggle allows switching between **"Fit to Screen"** and **"Zoom 100%"**.
* Native vector printing (`Ctrl + P` or "Download PDF") retains 100% full-scale resolution.

---

## 10. Analytics, Reports & Export

Navigate to **Analytics & Reports** (`/reports`).
* **KPI Metric Cards**: Total Revenue, Received Revenue, Pending Due, and Active Invoices Count.
* **GST Summary Report**: Intra-State vs. Inter-State breakdown, Total CGST, Total SGST, and Total IGST for simple GSTR-1 and GSTR-3B filings.
* **Cashflow Analytics**: Monthly revenue trends and settlement modes breakdown (Cash, UPI, Bank Transfer, Cheque).
* **Export Data**: 1-click export of Sales Register, Client List, and Tax Dues as `.csv` files.

---

## 11. Offline Resilience & Sync

* BillEase includes a built-in background IndexedDB mutation queue.
* If internet connectivity is interrupted while creating an invoice or recording a payment, the transaction is saved locally and marked with a pending sync indicator.
* As soon as connection is restored, the sync worker transmits all pending records to Supabase automatically.

---

## 12. Super-Admin Management

Access via `/admin` (Restricted to verified administrators).
* **Zero-Trust Security**: Requires email, salted bcrypt password, and **RFC 6238 TOTP 2FA** code (Google Authenticator / 1Password).
* **Live Operations**:
  * Tenant monitoring and active subscription overview.
  * Impersonation mode for customer support debugging.
  * System-wide broadcast notification engine.
