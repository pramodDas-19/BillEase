# BillEase — Production Deployment & DevOps Playbook

**Target Production Platform:** Vercel (Frontend & Edge API) + Supabase (PostgreSQL Database, Auth, Realtime)  
**Framework:** Next.js 15.5+ (App Router)  
**Runtime:** Node.js 20+  

---

## 1. Production Architecture Overview

```
[ Client Browser / Mobile PWA ]
               │
               ▼ HTTPS (SSL/TLS)
┌─────────────────────────────────────────────────────────────┐
│                 Vercel Global Edge Network                   │
│  - Next.js 15 App Router Server & Serverless API Routes     │
│  - Zero-Trust Admin Authentication (HttpOnly JWT + 2FA)     │
│  - Static Asset Caching & Brotli Compression               │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               │ HTTPS (Service Role / Anon)   │ Direct Client Access
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Supabase Cloud                         │
│  - PostgreSQL 15 with Row Level Security (RLS)              │
│  - Supabase Auth (Tenant isolation via auth.uid())          │
│  - Storage Buckets (Business logos & attachments)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Variables Specification

Configure the following variables in the **Vercel Dashboard → Project Settings → Environment Variables**:

### 2.1 Public Variables (Client Accessible)
| Variable Name | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **YES** | Supabase project API URL | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **YES** | Supabase public anonymous API key | `eyJhbGciOi...` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | OPTIONAL | Web Push VAPID Public Key | `BEl62iUYgUiv...` |

### 2.2 Server-Only Confidential Secrets
| Variable Name | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | **YES** | Supabase elevated admin key (Bypasses RLS for admin API) | `eyJhbGciOi...` |
| `ADMIN_EMAIL` | **YES** | Primary Super-Admin login email | `admin@billease.com` |
| `ADMIN_PASSWORD_HASH` | **YES** | Salted bcrypt hash of admin password | `$2a$12$...` |
| `ADMIN_TOTP_SECRET` | **YES** | Base32 RFC 6238 TOTP seed secret for 2FA | `JBSWY3DPEHPK3PXP` |
| `ADMIN_SESSION_SECRET` | **YES** | Cryptographic secret for signing admin JWTs (>= 32 chars) | `super_secure_random_key_here` |
| `VAPID_PRIVATE_KEY` | OPTIONAL | Web Push VAPID Private Key | `...` |

> [!CAUTION]
> In Vercel, if your `ADMIN_PASSWORD_HASH` contains dollar signs (`$`), Vercel dashboard might treat them as template variables. BillEase includes built-in normalization (`cleanEnv`), but it is safest to escape or verify the hash in Vercel.

---

## 3. Supabase Database Migration & Verification

Execute all migration scripts in sequence in the **Supabase SQL Editor**:

1. **Initial Schema & Core Tables**:
   - Run `supabase/schema.sql` (Creates `tenants`, `clients`, `invoices`, `invoice_items`, `quotations`, `quotation_items`, `payments`, `services`).
2. **Row Level Security (RLS) Policies**:
   - Run `supabase/rls_policies.sql`.
   - Verify that every table has RLS enabled:
     ```sql
     SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
     ```
     *(All tables must return `rowsecurity = true`)*.
3. **Sequential Numbering & Safety Locking**:
   - Run `supabase/migrations/20260912_create_counters_table.sql`.
4. **Notifications & Web Push**:
   - Run `supabase/migrations/20260915_notifications_and_web_push.sql`.
5. **Storage Buckets**:
   - Create a public bucket named `logos` with public read access and authenticated upload.

---

## 4. Pre-Deployment Automated Verification

Before deploying to production, execute the automated validation suite locally:

```bash
# 1. Type Check (Must pass with 0 errors)
npx tsc --noEmit

# 2. Automated Vitest Suite (All 15 test suites / 114 tests must pass)
npm test

# 3. Production Build Validation
npm run build
```

---

## 5. Vercel Deployment Guide

1. **Push Repository to GitHub / GitLab**.
2. **Import Project into Vercel**:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `next build`
   - Output Directory: `.next`
3. **Add Environment Variables** (from Section 2 above).
4. **Deploy**:
   - Trigger deployment.
   - Verify build completes with green status.
5. **Attach Custom Domain**:
   - Navigate to **Settings → Domains**.
   - Add your production domain (e.g. `billease.in` or `app.billease.com`).
   - Configure DNS CNAME / A records as indicated by Vercel.

---

## 6. Post-Deployment Smoke Test Checklist

Once deployed to production URL:
- [ ] Visit `/login` and `/signup` — create a test tenant.
- [ ] Verify 7-day trial badge appears with "7 days left".
- [ ] Create a client with a valid GSTIN — verify state auto-detection.
- [ ] Create an invoice with Advance Paid Amount (Cash) — verify:
  - [ ] Invoice shows partial payment balance due.
  - [ ] Receipt appears immediately in `/payments`.
- [ ] Preview invoice in A4, A5, and Thermal formats.
- [ ] Click "Print" and "Download PDF" — verify crisp vector document output.
- [ ] Access `/admin` — verify 2FA TOTP is strictly required.
- [ ] Test `/pricing` — verify upgrade flows and pricing cards.
