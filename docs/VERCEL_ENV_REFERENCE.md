# Vercel environment variables reference

Use this when setting **Project → Settings → Environment Variables** in Vercel. Set each variable for **Production** (and optionally **Preview** / **Development**). Never commit real values to Git.

## Required for Production (bros-photo.com)

| Variable | Example / notes | Scopes |
|----------|------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase → Settings → API (anon public) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API (service_role, reveal) — **secret** | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://bros-photo.com` (Production); use Vercel URL for Preview if needed | Production, Preview, Development |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` | Production, Preview, Development |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` — **secret** | Production, Preview, Development |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` — **secret**; use different value per environment if different webhooks | Production, Preview, Development |
| `RESEND_API_KEY` | `re_...` — **secret** | Production, Preview, Development |
| `R2_ACCOUNT_ID` | Cloudflare R2 — **secret** | Production, Preview, Development |
| `R2_ACCESS_KEY_ID` | **secret** | Production, Preview, Development |
| `R2_SECRET_ACCESS_KEY` | **secret** | Production, Preview, Development |
| `R2_BUCKET_NAME` | Your R2 bucket name | Production, Preview, Development |
| `R2_PUBLIC_URL` | Public read URL for R2 (e.g. `https://pub-xxx.r2.dev` or custom domain) | Production, Preview, Development |
| `BROSTUDIO_FIRST_ADMIN_EMAIL` or `BROSTUDIO_ADMIN_EMAILS` | Admin email(s) — **secret** | Production, Preview, Development |

## Optional

| Variable | Notes | Scopes |
|----------|--------|--------|
| `RESEND_FROM_EMAIL` | Sender for delivery emails, e.g. `BrosStudio <noreply@bros-photo.com>`. Required for sending to customers: Resend’s default `onboarding@resend.dev` only allows sending to your own email. Verify your domain in Resend, then set this. | Production, Preview, Development |
| `GEMINI_API_KEY` | AI social caption — **secret** | Production, Preview, Development |
| `OPENAI_API_KEY` | Admin AI description/captions — **secret** | Production, Preview, Development |
| `CONTACT_EMAIL` | Where contact form sends (defaults to hello@example.com) | Production, Preview, Development |
| `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Portfolio sync — **secret** | Production only (if used) |

## Do not set

- `ADMIN_CLAIM_SECRET` — deprecated (admin claim flow removed).

## After adding variables

1. **Redeploy** so new/changed vars take effect (Deployments → ⋮ → Redeploy).
2. In **Supabase** → Authentication → URL Configuration, add your **Redirect URLs** (e.g. `https://bros-photo.com/auth/callback`, `https://your-project.vercel.app/auth/callback` for the temporary URL).
3. For **Stripe** webhooks, point the endpoint to `https://bros-photo.com/api/webhooks/stripe` (or your temporary Vercel URL for testing) and set `STRIPE_WEBHOOK_SECRET` to the signing secret for that endpoint.

See **[DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md)** for full deployment and test steps.
