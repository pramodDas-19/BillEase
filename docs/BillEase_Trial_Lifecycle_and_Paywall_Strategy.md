# BillEase — Trial Lifecycle, Notification & Paywall Strategy
### Free Tier vs. Pro (₹1,499/mo) · 7-Day Pro Trial

---

## Why This Matters More Than It Looks

Your buyer is a solo photographer, event planner, or small agency owner in India who has spent years being burned by aggressive software sales tactics (Tally resellers, insurance upsells, "free" apps that lock your data). The single biggest risk in this flow isn't under-monetizing — it's **triggering the "yet another app trying to trap me" reflex**, which kills trust permanently, not just this conversion. Every design decision below optimizes for *earned* urgency over *manufactured* urgency, because for this audience, the former converts better and the latter gets you uninstalled and badly reviewed.

---

## PART 1 — Trial Lifecycle State Machine

### 1.1 Core States

| State | Trigger | Duration | Exit Condition |
|---|---|---|---|
| `TRIAL_ACTIVE_EARLY` | Signup completes | Day 1–4 | Day 5 begins, OR user subscribes, OR user creates 0 invoices by day 4 (→ triggers a different nudge, see 3.4) |
| `TRIAL_ACTIVE_MID` | Day 5 begins | Day 5–6 | Day 7 begins, OR user subscribes |
| `TRIAL_LAST_DAY` | Day 7 begins (local IST midnight) | Day 7, until `trialEndsAt` | `trialEndsAt` passes, OR user subscribes |
| `TRIAL_EXPIRED_GRACE` | `trialEndsAt` passes | 48 hours (see 1.4) | Grace period ends, OR user subscribes |
| `TRIAL_EXPIRED_LOCKED` | Grace period ends | Indefinite | User subscribes (→ `SUBSCRIBED_ACTIVE`) |
| `SUBSCRIBED_ACTIVE` | Successful payment | Ongoing | Payment fails / cancels |
| `SUBSCRIPTION_PAST_DUE` | Renewal payment fails | 7-day grace (mirrors trial grace, for consistency) | Payment recovers, OR falls to `TRIAL_EXPIRED_LOCKED`-equivalent (renamed `SUBSCRIPTION_LOCKED` for a paying-then-lapsed user — this cohort should get *softer*, more solution-oriented messaging than a never-paid trial user, since they've already proven willingness to pay) |
| `DOWNGRADED_FREE` | User explicitly chooses Free Tier at any point | Ongoing | User upgrades |

**Why a `TRIAL_EXPIRED_GRACE` state separate from `LOCKED`:** In Indian B2B SMB behavior, a huge share of "I didn't convert" is actually "I meant to but forgot / was traveling / the payment failed on a flaky connection" — not "I decided not to." A 48-hour soft grace window where the account still *works* but shows an unmissable "your trial has technically ended, add a payment method to keep going" state converts materially better than an instant hard wall, without costing you much — these users haven't decided against you, they just haven't acted yet.

### 1.2 Data Model

```
TrialState {
  tenantId: string
  planAtSignup: "pro_trial"
  trialStartedAt: timestamp        // set once, immutable
  trialEndsAt: timestamp           // trialStartedAt + 7 days, IST-aware
  currentState: enum               // the state table above
  hasPaymentMethod: boolean        // false until they add a card/UPI mandate
  invoicesCreatedCount: number
  quotationsCreatedCount: number
  clientsCreatedCount: number
  lastActiveAt: timestamp
  trialEngagementScore: enum       // derived, see 1.3 — drives which nudge copy fires
  conversionBannerDismissedAt: {   // per-banner-type dismissal tracking, see Part 4.4
    day5Banner?: timestamp
    lastDayBanner?: timestamp
  }
  gracePeriodEndsAt: timestamp     // trialEndsAt + 48h
  downgradeChoiceMadeAt?: timestamp // if they explicitly picked Free Tier
}
```

### 1.3 The One Derived Field That Changes Everything: `trialEngagementScore`

Don't treat every trial user identically — a user with 8 invoices created and 3 clients added by Day 4 is in a completely different psychological place than someone who signed up and never returned. Compute:

- **`ENGAGED`** — created ≥1 invoice or quotation AND logged in on ≥3 distinct days.
- **`EXPLORING`** — logged in ≥2 days but created 0 documents.
- **`DORMANT`** — logged in once (signup day only) and never returned.

This single field should change your messaging strategy more than the day counter does:
- **`ENGAGED`** users get *value-reinforcement* copy near expiry ("You've billed ₹X through BillEase this week — keep that going").
- **`EXPLORING`** users get *activation* nudges, not conversion nudges, until they've actually created something — pushing a paywall at someone who hasn't experienced the product yet is the fastest way to lose them for good.
- **`DORMANT`** users should get a re-engagement email/WhatsApp on Day 3, not more in-app banners they're not seeing anyway.

### 1.4 State Transition Diagram (text form)

```
[Signup] 
   │
   ▼
TRIAL_ACTIVE_EARLY (Day 1–4)
   │  (subscribe anytime) ──────────────────────► SUBSCRIBED_ACTIVE
   ▼
TRIAL_ACTIVE_MID (Day 5–6)
   │  (subscribe anytime) ──────────────────────► SUBSCRIBED_ACTIVE
   ▼
TRIAL_LAST_DAY (Day 7)
   │  (subscribe anytime) ──────────────────────► SUBSCRIBED_ACTIVE
   ▼
trialEndsAt passes
   ▼
TRIAL_EXPIRED_GRACE (48h, account still functional, persistent banner)
   │  (subscribe anytime) ──────────────────────► SUBSCRIBED_ACTIVE
   │  (explicitly pick Free Tier) ────────────────► DOWNGRADED_FREE
   ▼
gracePeriodEndsAt passes, no action taken
   ▼
TRIAL_EXPIRED_LOCKED (soft paywall, see Part 3)
   │  (subscribe anytime) ──────────────────────► SUBSCRIBED_ACTIVE
   │  (explicitly pick Free Tier) ────────────────► DOWNGRADED_FREE
```

---

## PART 2 — UI/UX Notification Strategy by Phase

The core design principle: **the intrusiveness of the UI should scale with the actual urgency of the user's situation, and never before.** A Day 2 modal is a lie — nothing urgent is happening — and Indian SMB users, many of whom have been burned by predatory app trials before, will clock that instantly.

### 2.1 Days 1–4 — `TRIAL_ACTIVE_EARLY` — "Premium, not nagware"

**Placement:** A small, quiet **status chip in the top navigation bar**, not a banner that pushes content down, not a modal. Something like a pill next to the Search bar:

```
┌─────────────────────────────┐
│  ⚡ Pro Trial · 4 days left  │
└─────────────────────────────┘
```

- Neutral color (slate/gray with a subtle brand-green accent on the icon, not amber/red — no urgency signaling yet).
- Clicking it opens a lightweight popover (not a full modal) showing what's included in Pro and a low-key "Add payment method" link — never auto-opens.
- **No email, no WhatsApp, no push notification during this window** unless the user is `DORMANT` (see 1.3) — a re-engagement nudge on Day 3 for someone who never came back is genuinely helpful, not naggy, because they haven't experienced the product's value yet.

This is the phase where you *earn* the later urgency. If a user reaches Day 5 having actually billed real invoices through BillEase, the countdown on Day 7 feels like a natural consequence, not a trick. If you nag from Day 1, by Day 7 the user is numb to every banner you show.

### 2.2 Days 5–6 — `TRIAL_ACTIVE_MID` — introduce visibility, not pressure

**Placement:** The same top-nav chip changes color (slate → amber) and copy tightens:

```
┌───────────────────────────────┐
│  ⏳ Pro Trial · 2 days left    │
└───────────────────────────────┘
```

- **Add one dismissible, non-blocking banner** the first time the user logs in on Day 5 — a slim strip under the header, not a modal:

```
🎯 2 days left on your Pro trial. You've created 6 invoices and billed ₹1,84,000 so far — keep the momentum going.
[ Choose a plan ]                                              [ ✕ ]
```

- **Critical detail:** this banner is *personalized with real usage data* (their actual invoice count/amount), not generic. Generic "your trial is ending!!" copy reads as manipulative; a banner reflecting their own real activity reads as a helpful summary. This is the single highest-leverage copy change you can make in this whole flow.
- The `✕` **fully dismisses this specific banner instance** (tracked per `conversionBannerDismissedAt.day5Banner`), and it does **not** reappear for the rest of Day 5–6. It's allowed to come back once, once, on Day 6 if dismissed on Day 5 — never more than once per day, never more than twice total in this phase.

### 2.3 Day 7 — `TRIAL_LAST_DAY` — last chance, still not a trap

**Placement:** The nav chip goes to your urgent/red-adjacent brand color (use a warm coral, not pure alarm-red — pure red reads as an error state, not a business decision point):

```
┌────────────────────────────────┐
│  🔴 Last day of your Pro trial  │
└────────────────────────────────┘
```

- **One interactive modal, shown exactly once, on first login of Day 7** — this is the one moment a modal is earned, because it genuinely is the last day. It should:
  - Summarize real value delivered ("You billed ₹X across Y invoices this week")
  - Show the two plans side-by-side with a clear default toward Pro
  - Have a real, working `✕`/"Maybe later" option — **never remove or disable the close button**. A modal you cannot dismiss is the single fastest way to generate a 1-star review and a churned user who tells other small business owners in their WhatsApp groups not to trust you. Trust with this audience is largely peer-referral-driven; do not spend it here.
  - After dismissal, this modal does not reappear — the nav banner (amber→red) remains as the ongoing, low-friction reminder for the rest of the day.

### 2.4 `TRIAL_EXPIRED_GRACE` (48h after expiry) — visible, functional, not blocking

**Placement:** Persistent, non-dismissible **top banner** (not sticky-on-every-scroll, just present at the top of every page) — but the account still fully works:

```
Your Pro trial has ended. You have 48 hours to add a payment method before some features pause.  [ Choose a plan ]
```

- No `✕` on this one — but it's not aggressive either, because nothing is actually blocked yet. Full functionality continues. This is a heads-up, not a wall.

### 2.5 `TRIAL_EXPIRED_LOCKED` — full-page blocker only for action triggers, never for read access

This is where the "modal vs banner vs full blocker" question actually has a real, defensible answer for a billing app specifically — see Part 3 below, because the *placement* decision is inseparable from the *soft vs. hard paywall* decision.

---

## PART 3 — Soft Paywall vs. Hard Paywall (the most important decision in this whole spec)

### 3.1 The principle: **billing/invoicing data is not a feature, it's a legal and financial record.**

A user's past invoices are documents they may need for GST filing, a client dispute, a bank loan application, or their CA's year-end reconciliation. Locking someone out of their *own past financial records* is not a paywall — in the Indian SMB context, it borders on holding their books hostage, and will generate the worst possible word-of-mouth ("BillEase locked me out of my own invoices"). This is a business-integrity issue before it's a growth-tactics one.

### 3.2 Recommended split

| Action | Trial Expired — Allowed? | Rationale |
|---|---|---|
| View past invoices/quotations/clients | ✅ Always allowed | It's their data; blocking this destroys trust irreversibly |
| Search past records | ✅ Always allowed | Same as above |
| **Export as CSV/PDF** | ✅ Always allowed, unrestricted | This is your Section 9 data-portability promise in the Terms you had me draft — contradicting it here would be a direct breach of your own stated policy, and users increasingly check this |
| Print an existing invoice | ✅ Always allowed | Same reasoning |
| **Create a new invoice/quotation** | 🔴 Blocked — this is the core value action | This is the entire value proposition of the paid tier; gate the *generation* of new billing documents, not access to old ones |
| **Edit an existing invoice** | 🔴 Blocked | Editing a financial record is functionally equivalent to creating a new one |
| **Record a new payment** | 🔴 Blocked | Core paid action |
| **Client Payment Portal (`/pay/[token]`) for existing invoices** | ✅ Always allowed | This is *your client's* access point, not the trial user's — blocking it punishes a third party (your user's own customer) for your user's non-payment, which is unacceptable and would look like a serious bug/outage to the person actually trying to pay |
| WhatsApp share of existing documents | ✅ Allowed | Same reasoning as export |
| Add a new client | 🟡 Consider allowing, low-value gate | Weak lever either way — probably not worth the friction of blocking |

### 3.3 What "blocking an action trigger" should actually look like

Never disable a button silently or hide it — both erode trust ("is this broken?"). When a `TRIAL_EXPIRED_LOCKED` user clicks **"+ Create Invoice"**:

- The button remains visible and clickable (don't grey it out — greyed-out UI reads as broken software, and this audience will assume it's a bug before they assume it's a paywall).
- Clicking it opens a **small, contextual inline modal** (not a full-page blocker) anchored to that action:

```
┌──────────────────────────────────────────────┐
│  Creating new invoices needs an active plan   │
│                                                │
│  Your data is safe — you can still view,      │
│  search, and export everything you've         │
│  already created.                             │
│                                                │
│  [ Choose a plan ]         [ Not now ]        │
└──────────────────────────────────────────────┘
```

- A **full-page blocker is only appropriate on the primary create/edit routes themselves** (i.e., if they navigate directly to `/invoices/new`), not layered over the entire dashboard. Never full-page-block the Dashboard, Clients, Reports, or any read-oriented screen — those remain fully navigable.

### 3.4 Why this is also the better growth decision, not just the ethical one

A user who can still see their real invoice history, their real revenue numbers, and gets gently stopped only at the moment of genuine new value creation experiences the paywall as *fair* — "I get it, they want me to pay for the thing that actually makes them money." A user who gets locked out of everything experiences it as *punitive*, and punitive paywalls in a trust-driven, referral-driven SMB market cost you the next three customers that person would have referred, not just this one.

---

## PART 4 — Visual Design Specs & Copy

### 4a) Early Trial Indicator (Days 1–4)

- **Color:** Neutral slate-gray background, single brand-green accent icon (⚡ or a small lightning/rocket glyph). No amber, no red — this phase should read as *informational*, not a warning.
- **Copy tone:** Confident, almost invisible. Never says "hurry" or "don't miss out."
- **Microcopy:** `"⚡ Pro Trial · 4 days left"` — that's it. Resist the urge to add more.

### 4b) Urgent Expiring Banner (Days 5–7)

- **Color:** Amber/gold (Day 5–6) transitioning to warm coral (Day 7) — deliberately avoid pure red until the account is genuinely locked, so red is reserved as a signal that actually means something later.
- **Copy tone:** Specific, data-backed, collaborative — never alarmist. Use their real numbers.
- **Microcopy (Day 5–6):**
  > "2 days left on your Pro trial. You've billed ₹1,84,000 across 6 invoices this week — keep it going with a plan that fits you."
- **Microcopy (Day 7, modal headline):**
  > "Your trial ends today"
  > *Body:* "In the last 7 days you created 8 invoices and 3 quotations. Pick a plan to keep billing without a break — or continue with Free Tier and upgrade whenever you're ready."

### 4c) Expired State — Grace Banner and Locked Modal

- **Grace banner color:** Coral/red-adjacent but not alarm-red, non-dismissible strip:
  > "Your Pro trial has ended. Add a plan within 48 hours to keep creating new invoices — everything you've already made is safe and always accessible."
- **Locked-action inline modal copy** (fires on "+ Create Invoice" click post-grace):
  > **Headline:** "Let's get you back to billing"
  > **Body:** "Your Pro trial ended, but nothing is lost — every invoice, client, and quotation you created is still here. Add a plan to start creating new ones again."
  > **CTA:** `[ See Plans — starts at ₹1,499/mo ]` · `[ Continue with Free Tier ]`

Note the **explicit Free Tier escape hatch on every paywall surface.** Never make Pro the only visible path forward — always show the free downgrade option, even if visually secondary. This does two things: it respects the user's autonomy (which this audience notices and rewards with trust), and it keeps them inside your product as a Free user instead of losing them entirely, where you can nurture them toward Pro over time instead of losing the relationship at the paywall.

### 4d) Preventing Banner Fatigue

1. **One banner instance per phase, not per session.** Once dismissed, `conversionBannerDismissedAt` suppresses it — don't re-show the same message every login.
2. **Escalate specificity, not volume.** Day 1's banner (if any) should never repeat verbatim on Day 5 — each message should reflect new information (days remaining, real usage numbers), so it reads as an update, not a repeat.
3. **Never stack notification channels for the same event.** If the in-app banner is showing, don't *also* send an email *and* a WhatsApp message the same day for the same trigger — pick one primary channel per lifecycle moment (in-app for Days 1–6, email+in-app combined only for Day 7 and grace-period, since that's genuinely the moment they need to see it even if not logged in).
4. **Respect dismissal as data.** If a user has dismissed the Day 5 banner *and* the Day 7 modal, do not add a third new nag type in the grace period — hold the persistent (non-dismissible but visually quiet) grace banner as the only remaining signal, and let re-engagement move to email/WhatsApp instead of stacking more in-app UI.
5. **Tie urgency color to real state, never inflate it.** If red is used loosely for "3 days left," it has nothing left to signal when the account is actually locked. Reserve your most urgent visual language for your most urgent actual state.

---

## PART 5 — Summary Recommendation

| Phase | Placement | Intrusiveness | Color | Dismissible |
|---|---|---|---|---|
| Day 1–4 | Nav chip only | Minimal | Neutral slate | N/A (passive) |
| Day 5–6 | Nav chip + 1 slim banner | Low | Amber | Yes, per-day cap |
| Day 7 | Nav chip + 1 modal (once) | Medium, earned | Coral | Yes, always |
| Grace (48h) | Persistent top banner | Medium | Coral/red-adjacent | No (but non-blocking) |
| Locked | Contextual inline modal on action triggers only | Targeted | Red | Yes, always, with Free Tier escape hatch |

**The one rule that ties this whole system together:** intrusiveness and color-urgency should be a truthful signal of actual state, personalized with the user's real activity, and should never block access to data the user already owns. Everything else in this spec follows from that.
