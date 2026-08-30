# BillEase — Multi-Tenant Billing & Invoicing SaaS Platform

A production-ready SaaS application for **Billing, Quotation, Invoice, Payment Tracking, and Client Management** designed specifically for **Event Planners, Graphic Designers, and Printing Businesses** (including unified businesses running both event and printing operations under one account).

---

## 🚀 Key Architectural Highlights

1. **True Multi-Tenancy**:
   - Every business/tenant account has isolated clients, quotations, invoices, payments, and settings.
   - Unified accounts support both event management & printing workflows under a single dashboard.
   - Ready for database-level tenant filtering (`tenantId`).

2. **Flexible Quotation & Invoicing Rules ("Simple by default, Powerful when needed")**:
   - **Line Items**: Description is always available and editable. Quantity, Unit, and Rate are optional. Amount is always present.
   - **Event Planners**: Can issue quotes with simple `Description + Amount` packages.
   - **Print Businesses**: Can use detailed `Description + Quantity + Unit + Rate + Amount` calculations.
   - **GST & Taxes**: Completely optional. Businesses can create quotes/invoices without entering a GSTIN.

3. **Dual Design System Separation**:
   - **SaaS Application UI**: Sleek, modern 2026 SaaS dashboard aesthetic with soft cards, subtle borders, and clean typography.
   - **Printable Documents**: Clean, professional, printable documents (`QuotationPrintDocument`, `InvoicePrintDocument`) ready for direct client sharing, window printing, and PDF exports.

4. **Quotation-to-Invoice Conversion**:
   - One-click seamless transformation of accepted quotations into billed invoices with carried line items, terms, and payment balance tracking.

---

## 🛠 Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Architecture**: Modular Domain-Driven Architecture (Routes, Components, Services, Hooks, Validations, Types)

---

## 📁 Project Directory Structure

```text
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
├── tsconfig.json
└── src/
    ├── app/
    │   ├── (auth)/                         # Authentication Route Group
    │   │   ├── layout.tsx
    │   │   ├── login/page.tsx
    │   │   ├── signup/page.tsx
    │   │   ├── forgot-password/page.tsx
    │   │   └── reset-password/page.tsx
    │   ├── (dashboard)/                    # Dashboard & Application Route Group
    │   │   ├── layout.tsx
    │   │   ├── dashboard/page.tsx          # Overview, billing metrics & activity
    │   │   ├── clients/                    # Client CRM & history
    │   │   │   ├── page.tsx
    │   │   │   ├── [id]/page.tsx
    │   │   │   └── new/page.tsx
    │   │   ├── quotations/                 # Flexible Quotation & Estimate Builder
    │   │   │   ├── page.tsx
    │   │   │   ├── new/page.tsx
    │   │   │   └── [id]/
    │   │   │       ├── page.tsx
    │   │   │       ├── edit/page.tsx
    │   │   │       └── preview/page.tsx    # Print / PDF preview
    │   │   ├── invoices/                   # Invoicing & Payment Tracking
    │   │   │   ├── page.tsx
    │   │   │   ├── new/page.tsx            # Manual or from quotation
    │   │   │   └── [id]/
    │   │   │       ├── page.tsx
    │   │   │       ├── edit/page.tsx
    │   │   │       └── preview/page.tsx
    │   │   ├── payments/                   # Payment Ledger & Settlements
    │   │   │   ├── page.tsx
    │   │   │   └── record/page.tsx
    │   │   ├── services/                   # Product & Service catalog
    │   │   │   ├── page.tsx
    │   │   │   └── new/page.tsx
    │   │   ├── reports/                    # Financial & Conversion Reports
    │   │   │   └── page.tsx
    │   │   └── settings/                   # Business Profile, GST, Numbering & Terms
    │   │       ├── page.tsx
    │   │       ├── profile/page.tsx
    │   │       ├── numbering/page.tsx
    │   │       ├── templates/page.tsx
    │   │       └── reminders/page.tsx
    │   ├── api/                            # Future REST/Serverless API Endpoints
    │   │   ├── clients/route.ts
    │   │   ├── quotations/route.ts
    │   │   ├── invoices/route.ts
    │   │   ├── payments/route.ts
    │   │   └── tenants/route.ts
    │   ├── error.tsx
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── not-found.tsx
    │   └── page.tsx
    ├── components/
    │   ├── ui/                             # Reusable UI Primitives (Button, Input, Card, Badge, Modal, Table)
    │   ├── layout/                         # Sidebar, Header, TenantSwitcher, UserNav
    │   ├── dashboard/                      # MetricCard, RecentQuotationsTable, RecentInvoicesTable
    │   ├── quotations/                     # QuotationItemRow, QuotationSummary, QuotationStatusBadge
    │   ├── invoices/                       # InvoiceStatusBadge, PaymentRecordModal
    │   └── documents/                      # Professional Printable Documents & Headers/Footers
    ├── config/
    │   ├── app.config.ts                   # Application metadata & branding
    │   ├── nav.config.ts                   # Dashboard navigation items & groups
    │   └── document.config.ts              # Document numbering presets & tax rates
    ├── constants/
    │   ├── currencies.ts                   # Currency definitions (INR, USD, EUR, etc.)
    │   ├── payment-methods.ts              # UPI, Bank Transfer, Cheque, Cash, etc.
    │   ├── status-types.ts                 # Status badge visual mappings
    │   └── service-categories.ts           # Event, Print, Design, Custom categories
    ├── context/
    │   └── tenant-context.tsx              # Multi-tenant state and switcher context
    ├── hooks/
    │   ├── use-tenant.ts                   # Hook for current tenant context
    │   ├── use-quotation-builder.ts        # Reactive hook for quote creation & item math
    │   ├── use-invoice-builder.ts          # Reactive hook for invoice creation
    │   ├── use-debounce.ts
    │   └── use-media-query.ts
    ├── lib/
    │   ├── utils.ts                        # Styling (cn) and formatting helpers
    │   ├── calculation.ts                  # Calculation engine (subtotals, discounts, taxes)
    │   ├── number-to-words.ts              # Currency amount-to-words for Indian/International formats
    │   └── pdf-generator.ts                # PDF export, WhatsApp & Email share URL helpers
    ├── mock/                               # Realistic mock datasets
    │   ├── tenants.mock.ts
    │   ├── clients.mock.ts
    │   ├── quotations.mock.ts
    │   ├── invoices.mock.ts
    │   ├── payments.mock.ts
    │   └── services.mock.ts
    ├── services/                           # Domain services ready for DB integration
    │   ├── tenant.service.ts
    │   ├── client.service.ts
    │   ├── quotation.service.ts
    │   ├── invoice.service.ts
    │   ├── payment.service.ts
    │   ├── service.service.ts
    │   └── report.service.ts
    ├── types/                              # Strict TypeScript models
    │   ├── common.types.ts
    │   ├── tenant.types.ts
    │   ├── client.types.ts
    │   ├── quotation.types.ts
    │   ├── invoice.types.ts
    │   ├── payment.types.ts
    │   ├── service.types.ts
    │   ├── report.types.ts
    │   └── index.ts
    └── validations/                        # Validation schemas & helpers
        ├── auth.schema.ts
        ├── client.schema.ts
        ├── quotation.schema.ts
        ├── invoice.schema.ts
        ├── payment.schema.ts
        └── settings.schema.ts
```

---

## 🏃‍♂️ Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Visit `http://localhost:3000` to view the application.
