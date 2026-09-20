# BillEase — Post-Launch Roadmap & Continuous Improvement Plan

**Status:** Active Release Roadmap  
**Target Release Phase:** v1.0 Launch → v1.1 Continuous Enhancements  

---

## 1. Operating Philosophy

BillEase is built for long-term scalability. Following the initial public launch, we will continuously:
1. **Fix Bugs Rapidly**: Immediate turnaround on any edge-case bugs reported by early adopters.
2. **Collect Real User Feedback**: Monitor which templates, payment methods, and workflows businesses use most frequently.
3. **Ship Iterative Improvements**: Release weekly/bi-weekly updates without breaking existing data or workflows.

---

## 2. Release & Improvement Schedule

### Phase 1: Launch & Stabilization (Week 1–2 Post Launch)
* **Goal**: Flawless stability, zero data loss, instant support.
* **Key Focus Areas**:
  - Monitor Supabase connection metrics and database query latency.
  - Track real-world browser print variations (Chrome, Edge, Safari, Android Webview).
  - Tweak UPI QR scanning edge cases across niche banking apps.
  - Collect early adopter feedback from retail shops, service agencies, and freelancers.

### Phase 2: Automation & Accounting Integration (Month 1 Post Launch)
* **Goal**: Further save time for business owners on tax and reconciliation.
* **Planned Features**:
  - **Automated GSTR-1 JSON Export**: Generate direct government-portal-ready JSON for uploading invoices to the GST portal in 1 click.
  - **Payment Gateway Webhook Sync**: Optional Razorpay / Cashfree webhook integration for automated invoice status flipping to `PAID` upon client online card/netbanking payments.
  - **Automated WhatsApp Recurring Follow-ups**: Scheduled reminder queue for invoices approaching or past their due date.

### Phase 3: Enterprise & Team Scale (Quarter 2 Post Launch)
* **Goal**: Support growing agencies and multi-branch operations.
* **Planned Features**:
  - **Team Member Logins & RBAC**: Invite staff (Billing Operator, Accountant, Manager, Admin) with granular permission restrictions.
  - **Multi-Branch / Multi-GSTIN Support**: Switch between multiple state GSTIN branches from a single unified account.
  - **E-Way Bill & E-Invoicing (IRN) API**: Direct integration with NIC E-Invoice portal for B2B enterprises exceeding threshold limits.

---

## 3. Maintenance & Quality Standards
* **Zero Regression Commitment**: All new features must pass the full 15-suite automated Vitest test suite (`npm test`) before deployment.
* **Multi-Tenant Integrity**: Strictly enforce tenant scoping on every new database query and cache operation.
* **Compliance First**: Any changes to tax computation must adhere strictly to Indian GST Council regulations.
