# Production Deployment Plan — bros-photo.com

**Vercel (hosting) + Amazon Route 53 (DNS)**  
**Security-first migration from Wix**

---

## 1. Executive summary

- **Goal:** Deploy the BrosStudio Next.js app to Vercel, serve it at **bros-photo.com** using Amazon Route 53 for DNS, and keep all secrets server-side. The current site is on Wix; the domain is still pointed at Wix.
- **Approach:**
  1. **Security:** Complete the [Security Audit Checklist](SECURITY_AUDIT_CHECKLIST.md). No secrets in repo, client code, or `NEXT_PUBLIC_*` except the allowed public vars. Admin and auth enforced only on the server.
  2. **Deploy to Vercel** using a **temporary** Vercel URL (e.g. `bros-studio-xxx.vercel.app`). Set Production (and optionally Preview/Development) environment variables in Vercel only—never in code or Git.
  3. **Validate** the app on the temporary URL (auth, admin, delivery, uploads, payments). Do not change DNS until this passes.
  4. **DNS cutover:** In Route 53, add the correct hosted zone for bros-photo.com (if not already there), preserve **SES DKIM and DMARC** records, then point apex and www to Vercel. Add the domain in Vercel and verify HTTPS. Only after full verification, remove Wix dependency.
  5. **Rollback:** If something breaks, point DNS back to Wix (or previous records) until the issue is fixed.

**Risks mitigated:** Email (SES/DMARC) kept intact; no secret leakage; admin protected server-side; rollback plan documented.

---

## 2. Security audit checklist

See **[docs/SECURITY_AUDIT_CHECKLIST.md](SECURITY_AUDIT_CHECKLIST.md)** for the full pre-deployment checklist. Summary:

- Find and remove any hardcoded secrets.
- Ensure no client-side calls use server-only secrets.
- Confirm every `/api/admin/*` route and admin page enforces server-side admin check.
- Classify env vars: (1) safe public, (2) server-only secret, (3) delete/rotate.
- Confirm `.env*` and secret config files are gitignored; rotate any previously committed secrets.
- Ensure logs and API responses never expose secrets.

Complete the checklist and sign off before going live.

---

## 3. Recommended app architecture (security)

- **Frontend:** Only public-safe code and public config. Allowed in client: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `R2_PUBLIC_URL` (public read URL). No API keys, service role, or private credentials.
- **Server:** All secret logic lives in API routes (`src/app/api/`), Server Actions, and Server Components (no secrets passed to client).
- **Database / admin / storage / payment / AI:** Access only from server-side code. Supabase service role, Stripe secret, Resend, Gemini, OpenAI, R2 credentials, Google service account — only in server env and server code.
- **Auth and admin:** Verified on the server (e.g. `getUser()` + `profiles.role === 'admin'`). UI hiding is not security; every admin API must return 403 for non-admins.

This project already follows this pattern; the audit ensures no gaps.

---

## 4. Vercel deployment setup

### 4.1 Connect the repo to Vercel

1. Push the project to **GitHub** (or GitLab/Bitbucket) if not already.
2. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
3. **Add New** → **Project** → import the BrosStudio repo.
4. **Framework Preset:** Next.js (auto-detected).
5. **Root Directory:** leave default (project root).
6. Do **not** add environment variables yet in this step; add them in Settings after the first deploy if needed for build.

### 4.2 Set environment variables in Vercel (per environment)

1. In Vercel: **Project** → **Settings** → **Environment Variables**.
2. Add each variable and choose **Production**, **Preview**, and/or **Development** as needed.
3. **Production** must have all required vars for bros-photo.com. **Preview** (branch deploys) can use a separate Supabase/Stripe project or same with care. **Development** is for local override when using Vercel CLI.

**Never put secrets in `NEXT_PUBLIC_*`** except these allowed public vars:

| Variable | Prod | Preview | Dev | Secret? |
|----------|------|--------|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | ✓ | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | ✓ | ✓ | No |
| `NEXT_PUBLIC_APP_URL` | ✓ | ✓ | ✓ | No (set to `https://bros-photo.com` in Prod) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✓ | ✓ | ✓ | No |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | ✓ | ✓ | **Yes** |
| `STRIPE_SECRET_KEY` | ✓ | ✓ | ✓ | **Yes** |
| `STRIPE_WEBHOOK_SECRET` | ✓ | ✓ | ✓ | **Yes** (different per env if different webhooks) |
| `RESEND_API_KEY` | ✓ | ✓ | ✓ | **Yes** |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | ✓ | ✓ | ✓ | R2 credentials **Yes**; R2_PUBLIC_URL public |
| `GEMINI_API_KEY` | Optional | Optional | Optional | **Yes** |
| `OPENAI_API_KEY` | Optional | Optional | Optional | **Yes** |
| `BROSTUDIO_FIRST_ADMIN_EMAIL` / `BROSTUDIO_ADMIN_EMAILS` | ✓ | ✓ | ✓ | **Yes** |
| `GOOGLE_SERVICE_ACCOUNT_*` (if used) | ✓ | — | — | **Yes** |

Do **not** set `ADMIN_CLAIM_SECRET` (deprecated).

### 4.3 First deploy (temporary URL)

1. Click **Deploy** and wait for the build to finish.
2. You get a URL like `bros-studio-xxx.vercel.app`.
3. For Preview/Development, set `NEXT_PUBLIC_APP_URL` to the appropriate origin or leave as prod URL for testing.

### 4.4 Test on temporary domain before touching DNS

1. Open the **Production** deployment URL.
2. In **Supabase** → **Authentication** → **URL Configuration**, add **Redirect URLs:** `https://<your-vercel-url>/auth/callback`.
3. Run through the [Test checklist](#7-test-checklist) on the temporary URL. Do not point bros-photo.com to Vercel until all critical paths pass and no secrets appear in browser or network.

### 4.5 Add custom domain in Vercel (after DNS plan ready)

1. **Project** → **Settings** → **Domains** → **Add** `bros-photo.com` and `www.bros-photo.com`.
2. Vercel shows required **A** and **CNAME** targets. Do not change Route 53 until you have preserved SES DKIM and DMARC and prepared the cutover (Section 5).

---

## 5. Route 53 DNS cutover plan (bros-photo.com)

**Current state (assumed):** Domain delegated to Wix; apex and www point to Wix; SES DKIM and DMARC exist and must be preserved.

### 5.1 Verify Route 53 hosted zone

1. **AWS Console** → **Route 53** → **Hosted zones**.
2. Find the hosted zone for **bros-photo.com**. If multiple zones with the same name exist, identify the correct one.
3. Note the **four name servers** for that zone (e.g. `ns-xxx.awsdns-xx.com`).

### 5.2 Verify registrar delegation

1. At your **domain registrar**, open DNS/name server settings.
2. If the domain uses **Wix name servers**, plan to switch to the **Route 53 name servers** from 5.1.
3. Optional: Create all records in Route 53 first, then switch registrar to Route 53 NS in one step.

### 5.3 Preserve email records (do not delete)

1. From current DNS, list every non-website record:
   - **SES DKIM:** 3 CNAME records (e.g. `xxx._domainkey.bros-photo.com` → `xxx.dkim.amazonses.com`).
   - **DMARC:** TXT `_dmarc.bros-photo.com`.
   - Any SPF/DKIM/auth records.
2. In **Route 53** → your hosted zone, **create** these records with the same names and values **before** changing apex/www.

### 5.4 Add Vercel website records

1. In Vercel → **Domains**, note **A** (apex) and **CNAME** (www) targets.
2. In **Route 53**:
   - **A** record: name empty or `@`, value = Vercel A (e.g. `76.76.21.21`), TTL 300.
   - **CNAME** record: name `www`, value = Vercel CNAME (e.g. `cname.vercel-dns.com`), TTL 300.
3. Do not remove Wix records until verification (5.6). When ready to cut over, replace Wix apex/www with these Vercel targets.

### 5.5 Switch registrar to Route 53 name servers (if not already)

1. At the **registrar**, set name servers to the four Route 53 NS values.
2. Save. Propagation can take up to 48 hours.

### 5.6 Verify HTTPS and redirects

1. Wait for DNS to resolve. Open `https://bros-photo.com` and `https://www.bros-photo.com`.
2. Confirm SSL and canonical redirect. Run the [Test checklist](#7-test-checklist).

### 5.7 Remove Wix dependency

Only after verification: remove any remaining Wix A/CNAME in Route 53. Email records stay. Unpublish Wix site as needed.

---

## 6. Rollback plan

1. **DNS rollback:** In Route 53, set **A** (apex) and **CNAME** (www) back to the previous Wix values (saved before cutover).
2. **Registrar:** If you switched to Route 53 NS, change back to Wix NS only if full revert is required.
3. **Email:** Do not remove or change SES DKIM/DMARC during rollback.
4. **Secrets:** If any secret was exposed, rotate it and update Vercel env vars.

**Before cutover:** Save current Wix (or current Route 53) DNS for website records.

---

## 7. Test checklist (production validation)

Run on the **temporary Vercel URL** first, then on **bros-photo.com** after cutover.

### General

- [ ] Homepage loads.
- [ ] Root domain works.
- [ ] www works; redirect/canonical correct.
- [ ] SSL valid; no mixed content.

### Auth and redirects

- [ ] Google login works.
- [ ] Realtor → `/r/{slug}`.
- [ ] Admin → `/admin`.
- [ ] Client dashboard redirect works.

### Delivery and media

- [ ] `/r/[realtorSlug]` and `/r/[realtorSlug]/[albumSlug]` load; images load.
- [ ] Delivery-preview works (if used).

### Admin and uploads

- [ ] Admin actions work as admin; 403 when not admin.
- [ ] Upload/download flows work.

### Security

- [ ] No secrets in browser source or Network tab.
- [ ] Server logs do not expose tokens or credentials.

### Optional

- [ ] robots.txt / sitemap / canonical.
- [ ] Stripe checkout and webhook.
- [ ] Contact form / Resend.

---

## 8. Acceptance criteria

- [ ] **bros-photo.com** resolves to Vercel production site.
- [ ] **www** resolves/redirects correctly; HTTPS valid.
- [ ] **Email DNS** (SES DKIM, DMARC) preserved and working.
- [ ] **No secrets** exposed client-side.
- [ ] **Admin** protected server-side (403 for non-admins).
- [ ] **Production, Preview, Development** use separate env vars in Vercel.
- [ ] **Wix** no longer required after cutover.

---

## 9. Next.js–specific guidance

### Server-only env vars (never NEXT_PUBLIC_)

`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `BROSTUDIO_*`, `GOOGLE_SERVICE_ACCOUNT_*`. Next.js does not expose these to the client bundle.

### Avoiding leakage

Only use `NEXT_PUBLIC_` for values safe in the browser (Supabase URL/anon, app URL, Stripe publishable, R2 public URL).

### Secure integrations

Use **API Routes** (`src/app/api/**/route.ts`) and **Server Actions** for Stripe, Resend, Gemini, OpenAI, Supabase service role, R2. Read secrets from `process.env` only in server code.

### Admin protection

Every `/api/admin/*` route must: `getUser()`, load `profiles.role`, return 403 if not admin. Admin pages must redirect non-admins server-side.

---

**Document version:** 1.0  
**Domain:** bros-photo.com  
**Host:** Vercel  
**DNS:** Amazon Route 53

---

## Next steps (in order)

1. **Complete the security audit** — [docs/SECURITY_AUDIT_CHECKLIST.md](SECURITY_AUDIT_CHECKLIST.md). Confirm no hardcoded secrets, admin routes protected, env classified; remove `ADMIN_CLAIM_SECRET` from any env if present.
2. **Push to Git** — Ensure the repo is on GitHub (or GitLab/Bitbucket) and the latest build-passing code is pushed.
3. **Connect to Vercel** — [vercel.com](https://vercel.com) → Add New → Project → import repo. Do not add env vars in the import wizard; add them in Settings after first deploy.
4. **First deploy** — Deploy without a custom domain. You get a URL like `bros-studio-xxx.vercel.app`.
5. **Set environment variables** — Project → Settings → Environment Variables. Use [docs/VERCEL_ENV_REFERENCE.md](VERCEL_ENV_REFERENCE.md). Set at least Production; set Preview/Development if you use them. Set `NEXT_PUBLIC_APP_URL` to the temporary Vercel URL for testing, or to `https://bros-photo.com` if you will add the domain soon.
6. **Redeploy** — After adding env vars, redeploy so the build uses them.
7. **Configure Supabase redirect** — In Supabase → Authentication → URL Configuration, add `https://<your-vercel-url>/auth/callback` to Redirect URLs.
8. **Test on temporary URL** — Run the [Test checklist](#7-test-checklist) on the Vercel URL. Do not change DNS until this passes.
9. **Add custom domain in Vercel** — When ready: Settings → Domains → Add `bros-photo.com` and `www.bros-photo.com`. Note the A and CNAME targets.
10. **Route 53 cutover** — Follow [Section 5](#5-route-53-dns-cutover-plan): preserve email records, then point apex and www to Vercel. Update `NEXT_PUBLIC_APP_URL` to `https://bros-photo.com` and redeploy. Verify HTTPS and run the test checklist again.
11. **Remove Wix** — Only after bros-photo.com is fully verified; leave email records in place.
