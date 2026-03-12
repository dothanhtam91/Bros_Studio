# BrosStudio

Luxury real estate photography delivery and client portal. Next.js (App Router), Supabase, Stripe, Resend.

## Features

- **Public site:** Landing (video hero), portfolio, packages, book form, about, contact
- **Client portal:** Login, dashboard (projects), project gallery with download (all/selected), approve/request changes, invoice & pay
- **Admin:** Create jobs (from bookings), upload assets to Supabase Storage, generate MLS/web variants (sharp), AI description & captions (OpenAI), send delivery email, create invoice, view activity/analytics
- **Success metrics:** Admin analytics (median shoot→delivery, % orders with add-ons, repeat client rate)

## Setup

1. **Env**

   Copy `.env.local.example` to `.env.local` and set:

   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `RESEND_API_KEY` (optional, for booking/delivery/contact emails)
   - `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`)
   - `OPENAI_API_KEY` (optional, for AI description/captions in admin)

2. **Database**

   Run the SQL in `supabase/migrations/00001_initial_schema.sql` in your Supabase project (SQL Editor or `supabase db push`).

3. **Storage**

   Create a bucket named `assets` in Supabase Storage (Dashboard → Storage). Admin uploads and processed variants use this bucket. For the portfolio, create a **public** bucket named `portfolio` (or let the upload API create it).

4. **Stripe webhook**

   For pay-to-download: create a webhook endpoint pointing to `POST /api/webhooks/stripe` with event `checkout.session.completed`, and set `STRIPE_WEBHOOK_SECRET`.

5. **First admin**

   After signup, set your user as admin in Supabase:

   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
   ```

6. **Client access**

   Create a `clients` row linked to a user (`user_id`) so they see projects on the dashboard. When creating a job from a booking, the app can create/link the client by email.

7. **Client login (Google, Facebook, email)**

   - **Email sign up:** Clients can create an account at `/signup` (email + password). Run `supabase/migrations/00004_profile_full_name_from_metadata.sql` so profile names are set from signup/OAuth.
   - **Google / Facebook:** In Supabase Dashboard → Authentication → Providers, enable **Google** and/or **Facebook** and add your OAuth credentials. In **URL Configuration**, set **Redirect URLs** to `{NEXT_PUBLIC_APP_URL}/auth/callback` (e.g. `http://localhost:3000/auth/callback` for local dev).

   **Google login checklist (if "Continue with Google" fails):**
   - Supabase → **Authentication** → **URL Configuration**: add every URL you use to **Redirect URLs**, e.g. `http://localhost:3000/auth/callback`, `http://localhost:3001/auth/callback`, `http://127.0.0.1:3001/auth/callback`. The login page shows the exact URL to add.
   - Supabase → **Authentication** → **Providers** → **Google**: enabled, with **Client ID** and **Client Secret** from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   - Google Cloud Console → your OAuth 2.0 Client → **Authorized redirect URIs**: must include the Supabase callback (e.g. `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` — copy from Supabase Google provider page).
   - `.env.local`: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set.

8. **Portfolio (local upload)**

   - Run `supabase/migrations/00003_portfolio_drive.sql` in the Supabase SQL editor (creates `portfolio_items` table).
   - In Supabase Dashboard → Storage, create a **public** bucket named `portfolio` (or let the upload API create it).
   - Run `supabase/migrations/00005_personal_portfolio.sql` so logged-in users can have a **personal portfolio** (Dashboard → My portfolio); the public Portfolio page shows only studio items.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Book a shoot** for the public form, **Client login** for the portal, and **Admin** (e.g. `/admin`) when logged in as admin.

## Build

```bash
npm run build
npm start
```

## Deployment

For production deployment (Vercel + Amazon Route 53, bros-photo.com), security audit, DNS cutover from Wix, and rollback steps, see:

- **[docs/DEPLOYMENT_PLAN.md](docs/DEPLOYMENT_PLAN.md)** — Full deployment plan (Vercel, Route 53, test checklist, acceptance criteria)
- **[docs/SECURITY_AUDIT_CHECKLIST.md](docs/SECURITY_AUDIT_CHECKLIST.md)** — Pre-deploy security checklist
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — General deploy and env var reference

## Hero video

Place a short loop (6–12s) at `public/hero-video.mp4` for the landing hero. If missing, the hero shows a gradient background.
