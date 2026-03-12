# Security Audit Checklist — Pre-Deployment

Use this checklist before deploying to production. Security is the top priority.

---

## 1. Find all hardcoded secrets

- [ ] **Search codebase** for:
  - `sk_`, `pk_` (Stripe key prefixes)
  - `eyJ` (JWT/base64-encoded tokens)
  - `Bearer ` + literal strings
  - `apiKey`, `api_key`, `secret`, `password` (literal values, not variable names)
  - Raw Supabase URLs or anon keys in source
- [ ] **Search docs and examples** (README, CONNECT_*.md, .env.local.example): ensure no real keys, only placeholders like `your-anon-key` or `sk_...`.
- [ ] **Result:** No hardcoded secrets in code or committed docs. Any found → remove and rotate the affected key.

**Current status (audit):** No hardcoded secrets found. All sensitive values are read from `process.env.*` in server-side code only.

---

## 2. Client-side API calls that should be server-side

- [ ] **Identify** any `fetch()` or API calls from client components that:
  - Send or receive credentials, API keys, or tokens.
  - Call external services (Stripe, Gemini, OpenAI, Resend, R2/S3) directly from the browser.
- [ ] **Rule:** External secrets and payment/AI/email APIs must be called only from:
  - Next.js API routes (`src/app/api/`)
  - Server Actions
  - Server Components (no secrets in serialized props)
- [ ] **Result:** No client-side calls to backend services using server-only secrets.

**Current status:** Gemini (social caption) is called via `/api/generate-social-caption` (server). Stripe is used in API routes and webhook. Resend, R2, Supabase service role, OpenAI are server-only. Supabase anon key is intentionally public (RLS protects data).

---

## 3. Admin-only logic enforced on the server

- [ ] **Every `/api/admin/*` route** must:
  1. Call `supabase.auth.getUser()` (or equivalent).
  2. If no user → return 401.
  3. Load `profiles.role` for that user; if `role !== 'admin'` → return 403.
  4. Only then perform admin actions.
- [ ] **Admin UI pages** (`/admin/*`) must redirect unauthenticated or non-admin users (server-side check before rendering).
- [ ] **Result:** Admin actions cannot be performed by non-admins; security is not based on hiding UI.

**Current status:** All admin API routes checked; they enforce `profile?.role !== "admin"` → 403. Exception that was fixed: `GET /api/admin/portfolio/settings` now also requires admin. Admin pages use server-side `getUser()` + profile check and redirect.

---

## 4. Environment variables — classify each

| Variable | Classification | Notes |
|----------|----------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | 1. Safe to expose | Public Supabase project URL; RLS protects data. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 1. Safe to expose | Anon key; RLS and policies enforce access. |
| `NEXT_PUBLIC_APP_URL` | 1. Safe to expose | Public site URL (e.g. `https://bros-photo.com`). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 1. Safe to expose | Stripe publishable key for client-side Stripe.js. |
| `SUPABASE_SERVICE_ROLE_KEY` | 2. Server-only secret | Never in client; only in API routes and server code. |
| `STRIPE_SECRET_KEY` | 2. Server-only secret | Only in API routes and webhook. |
| `STRIPE_WEBHOOK_SECRET` | 2. Server-only secret | Only in webhook route. |
| `RESEND_API_KEY` | 2. Server-only secret | Only in API routes (contact, bookings, delivery). |
| `GEMINI_API_KEY` | 2. Server-only secret | Only in `/api/generate-social-caption`. |
| `OPENAI_API_KEY` | 2. Server-only secret | Only in `/api/admin/projects/[id]/ai`. |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | 2. Server-only secret | Only in `src/lib/r2/client.ts` and API routes. |
| `R2_BUCKET_NAME` | 2. Server-only secret | Server-only. |
| `R2_PUBLIC_URL` | 1. Safe to expose | Public read URL for images; no secret. |
| `BROSTUDIO_FIRST_ADMIN_EMAIL`, `BROSTUDIO_ADMIN_EMAILS` | 2. Server-only secret | Admin allowlist; server-only (auth callback, etc.). |
| `GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `_PRIVATE_KEY` | 2. Server-only secret | Only server-side portfolio sync. |
| `S3_*` (if used) | 2. Server-only secret | Same as R2; server-only. |
| `ADMIN_CLAIM_SECRET` | 3. Delete/rotate | No longer used (admin claim flow removed). Remove from env and docs. |

- [ ] **Action:** Remove or do not set `ADMIN_CLAIM_SECRET`. Never put any "2. Server-only secret" in `NEXT_PUBLIC_*` or in client bundles.

---

## 5. .gitignore and secret files

- [ ] **Verify** `.env`, `.env.local`, `.env.*.local` are in `.gitignore` (pattern `.env*` is sufficient).
- [ ] **Verify** service account JSON files (e.g. `*.json` in project root that might contain keys) are not committed; add to `.gitignore` if needed (e.g. `*-service-account.json`).
- [ ] **Verify** `.vercel` is gitignored (Vercel local config may contain project id).
- [ ] **Result:** No env or secret config files are tracked by Git.

**Current status:** `.env*` and `.vercel` are in `.gitignore`. No service account JSON files are committed.

---

## 6. Previously committed secrets

- [ ] **If any secret was ever committed:** assume it is compromised. Rotate the key in the provider (Supabase, Stripe, Resend, Gemini, OpenAI, R2, Google Cloud). Remove from Git history only if you use a tool like `git filter-repo` or BFG and force-push; prefer rotating and never reusing the old value.
- [ ] **Result:** All secrets in use are either new or confirmed never committed.

---

## 7. Logs and error responses

- [ ] **Ensure** API routes and server code never log or return `process.env.*` secrets, full tokens, or stack traces that include env in production.
- [ ] **Ensure** error messages to the client do not include internal keys or paths (e.g. "GEMINI_API_KEY is not set" is OK; returning the key is not).
- [ ] **Result:** No secrets in logs or JSON responses.

**Current status:** Error messages mention variable names (e.g. "GEMINI_API_KEY is not configured") but never expose values. No logging of env in the codebase.

---

## Sign-off

- [ ] All items above completed or explicitly accepted with risk noted.
- [ ] No secrets in repo, client code, or public env vars.
- [ ] Admin and auth enforced server-side only.

**Date:** _____________  
**Audited by:** _____________
