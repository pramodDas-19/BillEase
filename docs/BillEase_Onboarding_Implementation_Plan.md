# BillEase — Onboarding Implementation Plan
### Getting Started Checklist → Welcome Modal → First-Invoice Success Moment

Grounded in the actual repo structure (`src/app/(dashboard)/dashboard/page.tsx`, `src/context/tenant-context.tsx`, `src/app/(dashboard)/invoices/new/page.tsx`). Build in this order — each piece is independently shippable.

---

## Data Model — one place, no new tables needed

Everything the checklist needs is derivable from data you already have (client count, invoice count, tenant bank/UPI fields). The only *new* state you need to store is whether the welcome modal has been shown, since that's not inferable from anything else.

**Add to the `tenants` table** (or tenant settings JSON, whichever pattern the schema already uses for similar flags):

```sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_welcome_seen_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_checklist_dismissed_at TIMESTAMPTZ;
```

That's it — two nullable timestamps. Everything else is computed on read:

```ts
// src/lib/onboarding.ts (new file)

type ChecklistState = {
  businessDetailsComplete: boolean;   // tenant.bankDetails.upiId AND tenant.address.city both non-empty
  hasFirstClient: boolean;            // clientsCreatedCount > 0
  hasFirstDocument: boolean;          // invoicesCreatedCount + quotationsCreatedCount > 0
  hasSentPaymentLink: boolean;        // at least one invoice has been shared (see tracking note below)
};

function getChecklistProgress(state: ChecklistState): number {
  const steps = Object.values(state);
  return steps.filter(Boolean).length; // 0–4
}
```

**One tracking gap to close:** "sent a payment link" isn't currently tracked anywhere — sharing via WhatsApp is a client-side `wa.me` link open, which your server never sees. Two options:
- **Simplest:** treat "hasSentPaymentLink" as satisfied once `paidAmount > 0` on any invoice (i.e., they've actually gotten paid at least once) — arguably a *better* signal than "clicked share" anyway, since it reflects real outcome, not just intent.
- **If you want the literal action tracked:** add a lightweight `POST /api/invoices/[id]/share-clicked` fired when the WhatsApp share button is clicked, incrementing a `share_clicked_at` timestamp on the invoice. More accurate, more work. **Recommend the simpler option for v1.**

---

## PART 1 — Getting Started Checklist (build first)

### Component structure

```
src/components/dashboard/getting-started-checklist.tsx   (new)
src/lib/onboarding.ts                                      (new — the logic above)
```

### Where it lives

Inserted at the top of `src/app/(dashboard)/dashboard/page.tsx`, above the existing KPI cards row — full-width, collapsed to a compact single row once all 4 items are done (see dismiss logic below), not competing with the "Good afternoon, Pramod" greeting for primary visual weight.

### Behavior spec

- **Renders only if:** `progress < 4` AND `onboarding_checklist_dismissed_at IS NULL`.
- **Each row is a clickable link**, not just a label — clicking "Add your first client" navigates straight to `/clients?new=true` (or wherever the "add client" quick-entry lives), not just to the Clients list.
- **Progress bar** fills 0→4 as real actions complete — recompute on every dashboard load from live data, don't cache client-side (avoids stale/incorrect state after actions taken elsewhere).
- **Auto-collapses to a single dismissible success line** once `progress === 4`: *"🎉 You're all set up — nice work."* with a small `✕`. Clicking `✕` sets `onboarding_checklist_dismissed_at = now()`. If they never click it, it's fine to just leave it — but don't show the full 4-row card forever once complete; that's clutter, not guidance.
- **Manual dismiss before completion** — allow a subtler `✕` even before all steps are done (for the user who genuinely doesn't want it), but this is a *soft* dismiss: store the same `onboarding_checklist_dismissed_at`, and don't re-show it. Respect the decision; don't nag them back into it.

### Copy

```
┌──────────────────────────────────────────────────────────┐
│  Let's get you set up            ●●○○  2 of 4 done        │
│                                                       [✕]  │
│  ✅  Add your business details (GSTIN, bank & UPI)          │
│  ✅  Add your first client                                  │
│  ⬜  Create your first invoice or quotation                 │
│  ⬜  Get your first payment                                 │
└──────────────────────────────────────────────────────────┘
```

Keep each line under 6 words of label + one short clarifying phrase — no marketing language, just the action.

---

## PART 2 — Welcome Modal (build second)

### Component structure

```
src/components/onboarding/welcome-modal.tsx   (new)
```

### Trigger logic

On dashboard mount, check `tenant.onboarding_welcome_seen_at`. If `null`:
1. Show the modal.
2. On close (either CTA or the explicit skip), immediately write `onboarding_welcome_seen_at = now()` — fire-and-forget PATCH, don't block the UI on it.
3. Never show again for this tenant, regardless of device/session.

**Important sequencing note:** this modal and the checklist both render on the dashboard. Don't show them simultaneously — the modal is a one-time overlay; the checklist underneath should already be present (rendered, just visually behind/after the modal), so that when the modal closes, the user lands directly on the checklist as the natural next step. This creates a single continuous flow instead of two competing "start here" surfaces.

### Copy

```
┌─────────────────────────────────────────────┐
│                                               │
│   Welcome to BillEase, [Business Name] 👋     │
│                                               │
│   You're on a 7-day Pro trial — no card       │
│   needed. Let's get your first invoice        │
│   out in under 2 minutes.                     │
│                                               │
│   [ Create your first invoice ]               │
│   [ Explore on my own ]                       │
│                                               │
└─────────────────────────────────────────────┘
```

- Primary CTA (`Create your first invoice`) routes straight to `/invoices/new`.
- Secondary (`Explore on my own`) just closes the modal, lands on the dashboard with the checklist visible underneath.
- Both paths write `onboarding_welcome_seen_at` — the distinction is only which page they land on next, not whether the modal is dismissed.
- No `✕` needed in the corner *if* both buttons are equally easy to find — don't make "Explore on my own" feel like a lesser/hidden option; it should be a real, visually legitimate second choice, not gray/small text underneath a big colored button. This is the same fairness principle from the trial-paywall spec — never bury the non-upsell path.

---

## PART 3 — First-Invoice Success Moment (build third — highest design effort, highest payoff)

### Where the flow currently ends

Right now, `src/app/(dashboard)/invoices/new/page.tsx` calls `router.push("/invoices")` after creation (confirmed at line ~446 in the current codebase) — the user lands back on the plain invoice list, no acknowledgment of what just happened. This is the gap to close.

### New flow

```
[Invoice created successfully]
        │
        ▼
Is this the tenant's FIRST-EVER invoice or quotation?
        │
   ┌────┴────┐
  YES         NO
   │           │
   ▼           ▼
Show new        router.push("/invoices")
FirstInvoiceSuccess          (existing behavior,
screen (below)                unchanged)
```

**Detecting "first ever"**: check `invoicesCreatedCount + quotationsCreatedCount === 1` immediately after this creation (i.e., this is the only one that exists). Don't add a separate "hasSeenFirstInvoiceSuccess" flag — the count check is self-sufficient and simpler.

### Component structure

```
src/app/(dashboard)/invoices/new/first-success/[id]/page.tsx   (new route)
    — or, simpler: a full-screen overlay component rendered conditionally
      from within invoices/new/page.tsx itself, avoiding a route change:
src/components/invoices/first-invoice-success.tsx   (new)
```

**Recommend the overlay-component approach** (not a new route) — keeps the URL/back-button behavior simple and avoids fighting the `use-unsaved-changes` hook that's already guarding this page.

### Design spec

Not confetti, not a full celebratory takeover — a clean, confident "here's what you just made" screen that puts the payment portal front and center, since that's the feature that should do the actual impressing:

```
┌───────────────────────────────────────────────────┐
│                                                     │
│    ✓  Your first invoice is ready                  │
│                                                     │
│    INV-1001 · ₹65,000 · Pramod Das                 │
│                                                     │
│    ┌─────────────────────────────────────────┐    │
│    │  [ Live preview of the client payment     │    │
│    │    portal — actual rendered mini-view,    │    │
│    │    not a screenshot — showing the UPI QR  │    │
│    │    and branded portal exactly as the      │    │
│    │    client will see it ]                   │    │
│    └─────────────────────────────────────────┘    │
│                                                     │
│    This is what your client sees when you          │
│    send them the payment link.                     │
│                                                     │
│    [ Send via WhatsApp ]   [ View invoice ]         │
│                                                     │
└───────────────────────────────────────────────────┘
```

- The embedded portal preview should be a **real, live-rendered instance** of the `/pay/[token]` page (e.g., rendered in an iframe or a shared component), not a static mock — this is the actual "wow," because it's not a promise, it's the real thing working in front of them 90 seconds after signup.
- `[ Send via WhatsApp ]` fires the existing `wa.me` share flow directly from here — don't make them navigate away and find the share button again; the whole point of this screen is capturing the moment while it's fresh.
- `[ View invoice ]` is the escape hatch to the normal invoice detail page for anyone who doesn't want to send it yet.
- Keep this screen on-brand with your existing clay-card visual style (per the earlier UI audit) — a jarring, differently-styled "celebration screen" would look like a bolted-on growth-hack rather than a native part of the product.

---

## Build Sequencing Summary

| Step | New files | Touches existing | Effort |
|---|---|---|---|
| 1. Checklist | `getting-started-checklist.tsx`, `onboarding.ts` | `dashboard/page.tsx` (insert component) | Low |
| 2. Welcome modal | `welcome-modal.tsx` | `dashboard/page.tsx` (mount check), tenant schema (1 column) | Low |
| 3. First-invoice success | `first-invoice-success.tsx` | `invoices/new/page.tsx` (post-create branch), reuse `/pay/[token]` rendering | Medium — the live portal preview is the one genuinely non-trivial piece |

Ship 1 and 2 together in a single pass (they share the dashboard mount point and are both low-effort); ship 3 as its own pass once you're ready to spend the extra design/dev time on the live-portal-preview piece, since that's the part actually worth getting right rather than rushing.
