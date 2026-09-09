# BillEase — Next Session Agenda & Action Plan

**Last Updated**: September 10, 2026 (End of Day)  
**Status**: Active Engineering Roadmap  

---

## 🎯 Active Priorities for Next Session

### 1. 🔔 Notification Module Deep Inspection & Verification
- [ ] **Overdue Payment Triggers**: Verify automatic calculation of overdue invoices and generation of timely payment attention alerts.
- [ ] **Notification Center UX**:
  - Test mark-all-as-read, individual dismiss, and filter by unread status.
  - Verify direct routing from notification item to invoice preview or payment record screen.
- [ ] **Push & Sound Alerts**:
  - Test browser web-push permissions and background service-worker notification triggers (`web-push`).
  - Validate mobile responsive popover behavior on narrow viewports.

---

### 2. 🛡️ Admin Dashboard, SaaS Subscriptions & Legal Pages
- [ ] **Admin Dashboard (`/admin`)**:
  - Dedicated admin view to monitor total registered users, business profiles, and platform growth metrics.
  - User management table: view user signups, email, business name, active status, and document generation counts.
  - Role-based authorization guard (Super-Admin access control).
- [ ] **7-Day Free Trial Engine**:
  - Automatic trial provisioning on initial user signup with active timestamp calculations (`trial_start`, `trial_end`).
  - Claymorphic trial status countdown banner (`X days remaining in your free trial`) with fast upgrade CTA.
  - Graceful feature gating or read-only transition upon trial expiration.
- [ ] **Pricing Plans & Checkout**:
  - Tiered plan architecture (e.g. Free Trial, Pro Monthly, Pro Annual).
  - Modern claymorphic pricing comparison table showcasing features, quotas, and savings.
- [ ] **Terms & Conditions and Privacy Policy Pages**:
  - Dedicated public legal pages (`/terms` and `/privacy`).
  - Compliance documentation for GST billing, data storage, user confidentiality, and cancellation/refund policies.

---

### 3. ⏱️ Recent Activity Feed *(Architecture & Planning Needed)*
- [ ] **Planning & System Design**:
  - Define `ActivityEvent` schema: `id`, `user_id`, `type` (invoice_created, quotation_sent, payment_received, client_added), `metadata`, `timestamp`.
  - Determine optimal persistence strategy: Supabase events table vs. client-side activity aggregation.
- [ ] **Activity Triggers & Dispatchers**:
  - Automatic event emission across core actions (creating/editing invoices & quotes, recording payments, converting quotes).
- [ ] **Dashboard Timeline Widget**:
  - Interactive, human-readable activity feed card on Dashboard (`"Rahul Sharma paid ₹15,000 for #INV-2026-004 • 2m ago"`).
  - Grouping by Today, Yesterday, and Earlier.

---

### 4. 📄 Multi-Page PDF & Print Margin Validation *(Pending Task)*
- [ ] **Print Layout & Margins**: Review physical print (<kbd>Ctrl</kbd> + <kbd>P</kbd>) and browser "Save as PDF" outputs across standard paper sizes (A4, Letter).
- [ ] **Multi-Page Pagination**: Test documents with 10+ line items to verify clean table breaks without cutting text, item rows, or borders in half.
- [ ] **Dual-State Print Verification**: Validate clean styling for both Paid documents (green paid stamp) and Due documents (dynamic UPI QR code & bank details).

---

### 5. 🤖 AI Chatbot & Assistant Integration *(Pending Task)*
- [ ] **Natural Language Generation**: Create quotes/invoices from plain conversational English prompts (*"Bill Rahul Sharma ₹15,000 for website redesign with 18% GST and Net 15 days"*).
- [ ] **Smart Business Insights**: Chat queries for immediate financial answers (*"Who owes me money this month?"*, *"What was my total revenue last month?"*).
- [ ] **Contextual Follow-Up Drafter**: Auto-generate personalized WhatsApp/Email payment nudge drafts tailored to client history.

---

## 🏁 Completed in Today's Session (September 10, 2026)

- [x] **Mobile Responsiveness Overhaul Across 5 Core Steps**:
  - **Line Item Ergonomics**: Autocomplete popover containment (`max-w-[calc(100vw-3rem)]`), flex-wrapped row 1 headers, 36px/40px touch heights (`h-10 sm:h-9`), enlarged delete buttons.
  - **Builder Layout & Mobile Actions**: Bottom navigation yields on builder routes; sticky mobile bottom bar on all `/new` and `/edit` pages showing live totals and 1-tap Preview/Save; responsive GST labels.
  - **Header & Popovers**: Centered notification popover (`w-[calc(100vw-1.5rem)]`), enlarged hamburger, bell, and avatar buttons to 38px, added responsive title truncation.
  - **Document List Cards**: Upgraded card headers to responsive `flex-col xs:flex-row` stacking with 32px action buttons.
  - **Dashboard & Reports**: Refactored `PaymentAttention` cards to stacked layout; client name truncation; fixed Export CSV dropdown left-clipping bug.
- [x] **QA & Verification**: 20/20 Vitest tests passing; 0 TypeScript compiler errors across all 30 routes.

---

<details>
<summary><strong>📜 Archived: Completed in Earlier Sessions</strong></summary>

### Business Settings & WhatsApp Engine (September 4, 2026):
- [x] **GST & Legal Terms Persistence**: Controlled states bound to inputs, fast GST slab chips, default currency selector.
- [x] **WhatsApp Reminder Template Customization**: 3 fast 1-click templates (`Friendly Nudge`, `Formal Business`, `Urgent Overdue`), dynamic tag insertion (`+ {client_name}`, `+ {balance_due}`), real-time live preview.
- [x] **E.164 Mobile Normalization**: Automatic formatting of Indian 10-digit mobile numbers with/without `+91`.

### Production-Grade Engine & Safety Guard (September 4, 2026):
- [x] **Line Item 2-Row Card Structure**: 4 balanced columns with expandable scope/HSN drawer on both Quotations & Invoices.
- [x] **Multi-Currency Global Engine**: 8 global trade currencies (`INR`, `USD`, `EUR`, `GBP`, `AED`, `CAD`, `AUD`, `SGD`).
- [x] **Intelligent GST Automation**: Auto-detection of 30+ Indian state/UT GST codes from GSTIN string, auto-routing Intra-State vs. Inter-State.
- [x] **Commercial Auto Round-Off**: Paise fraction rounding to nearest whole rupee.
- [x] **Unsaved Changes Navigation Guard**: Full-screen React Portal warning modal (`z-[99999]`) protecting form data.
- [x] **Live Document Previews**: Modal preview with dynamic UPI QR code.
- [x] **Sticky Frosted Header**: Pinned search (`⌘K`) and notifications with `overflow-x-clip`.

</details>
