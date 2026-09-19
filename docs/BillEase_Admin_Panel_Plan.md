# BillEase — Internal Admin Panel: Feature & Controls Plan

This is the panel *you* use to run the business — separate from the tenant-facing app entirely. Given everything found in the security audit earlier, this deserves one upfront warning before the feature list: **this panel is, by necessity, the single most powerful surface in your entire system** — it will need to bypass RLS (via the service-role key) to see across all tenants. That means its own access control has to be stricter than anything in the customer-facing app, not an afterthought bolted on later. Section 0 covers that; everything else follows from it.

---

## PART 0 — Foundation: Securing the Admin Panel Itself (build this first, before any feature below)

1. **Completely separate auth from tenant auth.** Don't reuse the `tenants`/customer Supabase Auth pool. Either a separate Supabase project/auth instance for admin users, or a hardcoded allowlist of specific admin user IDs checked server-side on every admin route — never a role flag stored in a table that any RLS policy elsewhere touches.
2. **Mandatory 2FA on the admin login** (TOTP, e.g. via Supabase Auth's MFA or a simple authenticator-app flow) — no exceptions, even for a single-founder tool. If this credential leaks, every tenant's financial data is exposed.
3. **Every admin route runs server-side, using the service-role key only inside that server context** — never expose the service-role key to any client bundle, including the admin panel's own frontend. All admin actions go through Next.js API routes/server actions that check the admin session first.
4. **Audit log everything, from day one.** Every admin action (viewing a tenant's data, editing a subscription, impersonating a user, deleting anything) writes an immutable log entry: `{ adminId, action, targetTenantId, timestamp, beforeState?, afterState? }`. This isn't optional — the day you need to answer "who looked at this customer's invoices and when," you'll want this already running, not retrofitted.
5. **IP allowlist or VPN-gating**, if practical at your scale — even a simple Vercel/Cloudflare rule restricting `/admin/*` to your known IPs is cheap insurance.
6. **Separate, harder-to-guess route/subdomain** for the admin panel (`admin.billease.app` rather than `billease.app/admin`) — not real security on its own, but reduces casual discovery.

---

## PART 1 — Tenant / Customer Management

This is the core of the panel — everything else largely orbits around a single tenant's record.

- **Tenant directory** — searchable/filterable list: business name, owner email, phone, signup date, current plan (`Free` / `Pro Trial` / `Pro` / `Past Due` / `Cancelled`), trial state (from the lifecycle spec — `TRIAL_ACTIVE_EARLY` through `TRIAL_EXPIRED_LOCKED`), last active date, total invoices created, lifetime revenue billed *through* BillEase (not revenue *to* you — revenue their clients paid them).
- **Tenant detail view** — single-tenant dashboard showing:
  - Business profile, GSTIN, bank/UPI settings
  - Subscription history and current status
  - Usage stats: invoices/quotations/clients created, last login, `trialEngagementScore`
  - Payment history (their payments *to BillEase*, separate from their customers' payments to them)
  - A running notes/timeline field for support context ("called about X on this date")
- **"View as tenant" / impersonation mode** — the single most useful support tool you'll build. Lets you see the app exactly as that tenant sees it, for debugging support requests, **without ever needing their password.** Must be:
  - Time-limited (auto-expires after e.g. 30 minutes)
  - Read-only by default, with an explicit second confirmation to take a write action while impersonating
  - Always logged (who impersonated whom, when, what they did)
  - Visibly bannered in the impersonated view itself ("You are viewing as [Business Name] — Exit impersonation") so you never lose track of whose account you're in
- **Manual account actions:** suspend/reactivate account, force logout (invalidate all sessions), manually extend or shorten trial, manually change plan, delete account (with a confirmation step and export-before-delete safeguard, echoing the data-portability promise in your Terms).
- **Suspicious activity flags** — surface accounts with unusual patterns worth a manual look: e.g., a spike in invoice creation far above their historical rate (could be legitimate growth or could be abuse), or repeated failed payment attempts.

---

## PART 2 — Subscription & Billing Management

- **Plan/pricing control panel** — view and edit the Free vs Pro plan definitions (limits, price, features included) from one place, rather than hardcoded across the codebase. Even at your scale, this saves you from needing a deploy every time you tweak a limit.
- **Manual billing overrides** — apply a discount/comp a specific tenant (useful for early adopters, friends-and-family, or goodwill after a bug), extend a grace period manually, issue a manual refund with a reason logged.
- **Payment failure queue** — a dedicated view of tenants currently in `SUBSCRIPTION_PAST_DUE`, so you can proactively reach out rather than just letting the automated flow run blind.
- **Revenue dashboard:**
  - **MRR** (current, and trend over time)
  - **Trial → Paid conversion rate**, ideally broken down by `trialEngagementScore` cohort (this directly closes the loop on the trial-lifecycle spec — you'll be able to see whether `ENGAGED` trial users actually convert meaningfully better, and adjust the nudges accordingly)
  - **Churn rate** and a list of recently churned tenants with their usage history, so you can spot patterns (e.g., "everyone who churns had under 3 invoices in their trial")
  - **LTV estimate**, even a rough one, once you have a few months of data

---

## PART 3 — Product & Usage Analytics

- **Funnel view:** Signup → first invoice created → trial Day 7 reached → converted to paid → still active at 30/60/90 days. This is the single chart that tells you where people actually drop off, more useful early on than any vanity metric.
- **Feature adoption tracking:** what % of active tenants have used WhatsApp sharing, the payment portal, CSV export, recurring features (once built), etc. — tells you what to double down on vs. what's dead weight.
- **Cohort retention table** (signup month × % still active N months later) — standard SaaS health metric, worth having even as a simple table early on.
- **Search/segment builder** — basic filtering like "tenants with >10 invoices and no payment method" (upsell targets) or "tenants inactive 14+ days mid-trial" (re-engagement targets) — even a simple filter UI here goes a long way before you'd need a full CRM.

---

## PART 4 — Support & Operations

- **Support ticket / inquiry log**, even a lightweight one (could genuinely just be a notes field per tenant to start, formalize later) — ties every support interaction to the tenant record so context isn't lost between conversations.
- **Broadcast/announcement tool** — send an in-app banner or email to all tenants, or a filtered segment (e.g., "all Free Tier users" or "all trials expiring this week") — for outages, new features, or policy changes, without needing a deploy.
- **Manual WhatsApp/email trigger** — resend a specific tenant's welcome email, trial-reminder, or receipt if something failed to send automatically.
- **System health at a glance:** webhook failure rate (ties directly to the payment webhook you hardened earlier — you want to know immediately if signature verification starts rejecting legitimate payloads), Supabase connection/error rates, recent 5xx errors, push-notification delivery success rate (relevant once that pipeline is actually wired end-to-end, per the earlier audit finding).

---

## PART 5 — Compliance & Data Governance

Directly tied to the Terms & Conditions and DPDP Act references drafted earlier — this section is what makes those promises operationally real, not just words in a document:

- **Data export tool** — generate a full data export for a specific tenant on request (supports your Section 9 data-portability promise, and DPDP data-principal rights if a *tenant's client* ever requests their data be exported/deleted from a tenant's account).
- **Account deletion workflow** — a proper "right to erasure" flow: export first, confirm, then hard-delete with the deletion itself logged (who requested it, when, confirmation it completed).
- **Terms/Privacy Policy version control** — track which version of the Terms was active when each tenant signed up, and log if/when they were notified of and accepted updates (directly supports the amendment clause in the ToS draft).
- **Audit log viewer** — a UI over the admin-action audit log from Part 0, searchable by tenant, admin, action type, and date range.

---

## PART 6 — Feature Flags & Configuration

- **Feature flag toggles** per-tenant or globally — lets you roll out something like recurring invoices or the Razorpay SDK integration to a small beta group first, without a full release, and kill-switch anything that misbehaves in production without a redeploy.
- **WhatsApp/email template editor** — edit the default reminder/invoice/receipt message templates from the panel rather than hardcoded strings, so copy changes (including anything from the trial-lifecycle notification strategy) don't require touching code.
- **Trial/paywall parameter controls** — expose the bracketed values from the trial-lifecycle spec (trial length, grace period duration, banner day-thresholds) as admin-editable config rather than hardcoded constants, so you can tune conversion behavior based on real data without redeploying.

---

## Build Priority (given you're a solo founder, not a team)

**Phase 1 — Build now, before onboarding real paying customers:**
Part 0 (security foundation) → Tenant directory + detail view → Impersonation mode → Manual plan/trial overrides → Basic audit log.

**Phase 2 — Build once you have your first 10–20 paying customers:**
Revenue dashboard → Payment failure queue → Support notes field → Basic funnel analytics.

**Phase 3 — Build once you're past ~50 customers or hiring your first support/ops person:**
Broadcast tool → Feature flags → Cohort retention → Full compliance/data-export workflow → Template editor.

Don't build Phase 3 items now — at solo-founder scale with a handful of customers, you can do most of that manually (a spreadsheet, a manual SQL query, a direct message), and the engineering time is better spent on the product itself. The one thing worth *not* deferring, regardless of scale, is Part 0 — because retrofitting security onto an admin panel that already has months of usage habits built around it is much harder than building it right from the start, and this panel touches every tenant's financial data at once.
