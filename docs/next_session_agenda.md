# BillEase — Next Session Agenda & Action Plan

**Last Updated**: September 4, 2026 (End of Day)  
**Status**: Active Engineering Roadmap  

---

## 🎯 Active Priorities for Next Session

### 1. ⚙️ Business Settings Checking & New Feature Addition
- **Audit Current Settings**: Thoroughly inspect Profile & Branding, Numbering Sequences (Quotes & Invoices), Bank Details, UPI ID, and GST configurations.
- **Implement New Settings Capability**: Build the specific new business settings feature requested by the user.
- **Default Presets Management**: Allow business owners to customize their default legal terms, default payment terms, and preferred default currency.

---

### 2. 💬 WhatsApp Message Checking & Polishing *(New Priority)*
- **Review Current WhatsApp Flow**: Test the 1-click WhatsApp dispatch link on both Quotations and Invoices.
- **Message Template Polishing**:
  - Craft warm, professional, high-converting templates for sending new estimates, tax invoices, and payment reminders.
  - Embed dynamic variables: `{client_name}`, `{document_number}`, `{amount_with_currency}`, `{due_date}`, and `{portal_pay_link}`.
- **Number Normalization**: Ensure client phone numbers with or without `+91`, spaces, or hyphens are automatically sanitized for seamless WhatsApp Web / App launching.

---

### 3. 📱 Mobile Responsiveness Improving & Deep Inspection *(New Priority)*
- **Viewport Stress Testing**: Test on real mobile screen widths (360px, 375px, 390px, 412px) across iOS Safari and Android Chrome.
- **Builder Mobile Ergonomics**:
  - Verify that the new 2-row card line item layout, inputs, and expandable scope drawer feel frictionless under one-thumb touch.
  - Ensure the financial summary sidebar wraps and stacks cleanly beneath line items without layout shifts.
  - Ensure modals (Live Preview, Unsaved Changes warning) scroll smoothly with zero touch freeze or horizontal overflow.
- **Mobile Bottom Navigation & Sticky Header**: Verify tap target heights (minimum 44px) and thumb-reach usability.

---

### 4. 📄 Multi-Page PDF & Print Margin Validation
- **Print Layout & Margins**: Review physical print (<kbd>Ctrl</kbd> + <kbd>P</kbd>) and browser "Save as PDF" outputs.
- **Multi-Page Pagination**: Test long documents with 10+ line items to verify clean table breaks without cutting text or table borders in half.
- **Dual-State Print Verification**: Validate clean styling for both Paid documents (green paid stamp) and Due documents (dynamic UPI QR code & bank details).

---

### 5. 🤖 AI Chatbot & Assistant Integration (Competitive Differentiator)
- **Concept & Architecture**: Scope and build an intelligent AI billing assistant that sets BillEase apart from traditional accounting tools (Zoho, Vyapar, Tally).
- **Core Capabilities**:
  - *Natural Language Generation*: Create quotes/invoices from plain English (e.g. *"Bill Rahul Sharma ₹15,000 for website redesign with 18% GST and Net 15 days"*).
  - *Smart Business Insights*: Query financial health in chat (e.g. *"Who owes me money this month?"*, *"What was my total revenue last month?"*).
  - *Contextual Follow-Up Drafter*: Generate personalized WhatsApp/Email payment nudge drafts based on client payment history.

---

## 🏁 Completed in Previous Session (September 4, 2026)

- [x] **Line Item 2-Row Card Redesign**: 4 balanced columns (`Qty & Unit`, `Rate`, `Discount`, `GST Slab`) with expandable scope/HSN drawer on both Quotations & Invoices.
- [x] **Multi-Currency System**: Added 8 global trade currencies (`INR`, `USD`, `EUR`, `GBP`, `AED`, `CAD`, `AUD`, `SGD`) with dynamic symbol updates.
- [x] **1-Click Speed Presets**: Instant Validity chips (`+7d`, `+15d`, `+30d`) and Due Date chips (`Today`, `+7d`, `+15d`, `+30d`).
- [x] **1-Click Standard Legal Clauses**: Quick chip insertion for advance payment, delivery, late fees, and bank transfer terms.
- [x] **GSTIN State Auto-Detection**: Reads first 2 digits of GSTIN, displays state badge, and auto-routes Intra-State (CGST+SGST) vs Inter-State (IGST).
- [x] **Commercial Auto Round-Off**: Toggle to round paise fractions into clean whole rupee totals.
- [x] **Zero Data-Loss Navigation Guard**: Intercepts menu clicks, reloads, and back buttons with a full-screen React Portal warning modal (`z-[99999]`).
- [x] **Live Document Previews**: Full-screen draft preview modals with dynamic UPI QR and bank details.
- [x] **Sticky Frosted Header**: Pinned search (`⌘K`) and notifications header with `overflow-x-clip` layout fix.
- [x] **Automated Tests**: 18/18 Vitest unit tests passing; 0 TypeScript errors.
