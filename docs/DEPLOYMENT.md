# Deploy to your domain (Route 53)

Your app is a Next.js app. **Route 53 only manages DNS** — you need to run the app on a host, then point your domain there.

**Production migration (bros-photo.com):** For the full security-first plan (Vercel + Route 53, Wix cutover, email preservation, rollback), see **[docs/DEPLOYMENT_PLAN.md](docs/DEPLOYMENT_PLAN.md)** and **[docs/SECURITY_AUDIT_CHECKLIST.md](docs/SECURITY_AUDIT_CHECKLIST.md)**.

---

## Deploy to your current website (domain already on Route 53)

If your domain is already in Route 53 and you want this app to be your site:

### Step 1: Push code and pick a host

1. Push your project to **GitHub** (or GitLab/Bitbucket) if you haven’t already.
2. Choose where to run the app:
   - **Vercel** (recommended): [vercel.com](https://vercel.com) → Add New → Project → import your repo.
   - **AWS Amplify**: AWS Console → Amplify → New app → Host web app → connect repo.

### Step 2: Deploy the app

- **Vercel:** Next.js is auto-detected. Add **Environment variables** (see table below), then Deploy.
- **Amplify:** Add env vars, then deploy. Use Amplify’s default Next.js build if offered.

After deploy you get a URL like `xxx.vercel.app` or `xxx.amplifyapp.com`.

### Step 3: Add your domain at the host

- **Vercel:** Project → **Settings** → **Domains** → Add domain → enter your domain (e.g. `yourdomain.com` or `www.yourdomain.com`). Vercel shows the DNS target (e.g. A record `76.76.21.21` or CNAME `cname.vercel-dns.com`).
- **Amplify:** App → **Hosting** → **Domain management** → **Add domain** → select your domain (from Route 53). Amplify can create the records for you.

### Step 4: Point Route 53 to the new host

1. **AWS Console** → **Route 53** → **Hosted zones** → click your domain.
2. **Update (or create) the record** that serves your site:

   **If you use the root domain (e.g. yourdomain.com):**

   - Find the **A** record for the root (Record name empty or `@`). Edit it.
   - Set **Value** to the IP Vercel gave (e.g. `76.76.21.21`), or leave as-is if Amplify manages it.
   - Save.

   **If you use www (e.g. www.yourdomain.com):**

   - Find or create the **CNAME** record for `www`.
   - Set **Value** to the host’s CNAME (e.g. `cname.vercel-dns.com` for Vercel).
   - Save.

3. If your old site used different records, you can remove or repoint them so only the new host is used.

### Step 5: Set production URL and Supabase

- In Vercel/Amplify **Environment variables**, set **`NEXT_PUBLIC_APP_URL`** = `https://yourdomain.com` (or `https://www.yourdomain.com`).
- In **Supabase** → **Authentication** → **URL Configuration**: set **Site URL** to that same URL, and add `https://yourdomain.com/auth/callback` (and `https://www.yourdomain.com/auth/callback` if you use www) to **Redirect URLs**.
- Redeploy the app after changing env vars.

After DNS propagates (minutes to a few hours), your domain will show this Next.js app.

---

## Two hosting options in detail

Two practical options:

- **Option A: Vercel** — Best fit for Next.js, minimal config, free tier. Point your Route 53 domain to Vercel.
- **Option B: AWS Amplify** — Host on AWS, same account as Route 53. Good if you want everything in AWS.

---

## Prerequisites

1. Code in a **Git** repo (GitHub, GitLab, or Bitbucket).
2. **Route 53** hosted zone for your domain (e.g. `yourdomain.com`).
3. Production env values ready (Supabase, R2, etc.) — see [Environment variables](#environment-variables) below.

---

## Option A: Vercel + Route 53

### 1. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. **Add New** → **Project** → import your repo (e.g. `BrosStudio`).
3. **Framework Preset:** Next.js (auto-detected).
4. **Root Directory:** leave default unless the app is in a subfolder.
5. **Environment Variables:** add the ones from [Environment variables](#environment-variables) (Production).
6. Click **Deploy**. Wait for the first build to finish.

You’ll get a URL like `bros-studio-xxx.vercel.app`.

### 2. Add your domain in Vercel

1. Project → **Settings** → **Domains**.
2. Add your domain, e.g. `yourdomain.com` or `www.yourdomain.com` (or both).
3. Vercel will show what to configure in DNS, e.g.:
   - **A** record: `76.76.21.21` (or similar — use the value Vercel shows).
   - Or **CNAME** for `www`: `cname.vercel-dns.com` (again, use Vercel’s exact value).

### 3. Point Route 53 to Vercel

1. Open **AWS Console** → **Route 53** → **Hosted zones** → your domain.
2. **Create record** (or edit the existing one for the hostname you chose):

   **Apex domain (`yourdomain.com`):**

   - **Record name:** leave empty (or `@`).
   - **Record type:** A.
   - **Value:** the IP Vercel gave (e.g. `76.76.21.21`).
   - **Routing policy:** Simple. Save.

   **Or `www.yourdomain.com`:**

   - **Record name:** `www`.
   - **Record type:** CNAME.
   - **Value:** the CNAME Vercel gave (e.g. `cname.vercel-dns.com`).
   - Save.

3. Wait for DNS to propagate (a few minutes up to 48 hours). Vercel will issue SSL for your domain.

### 4. Set production URL in env

In Vercel → Project → **Settings** → **Environment Variables**, add or update:

- **`NEXT_PUBLIC_APP_URL`** = `https://yourdomain.com` (or `https://www.yourdomain.com` if you use www).

Redeploy if you add or change this so the app picks it up.

---

## Option B: AWS Amplify + Route 53

### 1. Deploy to Amplify

1. **AWS Console** → **Amplify** → **New app** → **Host web app**.
2. Connect your Git provider and repo, branch (e.g. `main`).
3. Amplify detects Next.js. **Build settings** — use something like:

   ```yaml
   version: 1
   applications:
     - appRoot: .
       frontend:
         phases:
           preBuild:
             commands:
               - npm ci
           build:
             commands:
               - npm run build
         artifacts:
           baseDirectory: .next
           files:
             - '**/*'
         cache:
           paths:
             - node_modules
             - .next/cache
       customHeaders:
         - pattern: '**'
           headers:
             - key: 'Strict-Transport-Security'
               value: 'max-age=31536000; includeSubDomains'
   ```

   For Next.js 13+ standalone or SSR, Amplify may use a different preset; accept or adjust as Amplify suggests.

4. **Environment variables:** add the ones from [Environment variables](#environment-variables) (Production).
5. Save and deploy. Wait for the first build.

### 2. Add custom domain in Amplify

1. In your app → **Hosting** → **Domain management** → **Add domain**.
2. Choose your domain (e.g. from Route 53). Amplify will suggest creating a subdomain or using the apex; pick what you want (e.g. `www.yourdomain.com` or `yourdomain.com`).
3. Amplify can create/update records in Route 53 for you if the domain is in the same account — confirm and apply.

### 3. Set production URL

In Amplify → **Environment variables**:

- **`NEXT_PUBLIC_APP_URL`** = `https://yourdomain.com` (or the exact URL you use).

Redeploy after changing env vars.

---

## Environment variables

Set these for **Production** in Vercel or Amplify. Never commit real values to Git.

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only; keep secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Your final URL, e.g. `https://yourdomain.com` |
| `R2_ACCOUNT_ID` | Yes* | For album/headshot images |
| `R2_ACCESS_KEY_ID` | Yes* | R2 API token |
| `R2_SECRET_ACCESS_KEY` | Yes* | R2 API token secret |
| `R2_BUCKET_NAME` | Yes* | R2 bucket name |
| `R2_PUBLIC_URL` | Yes* | R2 public URL (e.g. custom domain for R2) |
| `GEMINI_API_KEY` | No | For AI caption feature |
| `BROSTUDIO_ADMIN_EMAILS` / `BROSTUDIO_FIRST_ADMIN_EMAIL` | No | Comma-separated or single admin email(s) |
| `STRIPE_*` | No | Only if you use Stripe |

\* Required if you use R2 for delivery images (recommended).

---

## After deployment

1. **Supabase**  
   - In Supabase Dashboard → **Authentication** → **URL Configuration**, set **Site URL** to `https://yourdomain.com` (or your real URL).  
   - Add the same URL to **Redirect URLs** if you use OAuth or email links.

2. **Run migrations**  
   - Ensure all migrations (including `00009_r2_storage_key.sql`) are applied to your production Supabase project (e.g. via Supabase Dashboard SQL or `supabase db push` against prod).

3. **Test**  
   - Open `https://yourdomain.com`.  
   - Test delivery links (`/r/[realtor]/[album]`), uploads, and R2 images.

4. **SSL**  
   - Vercel and Amplify both provision HTTPS when the domain is correctly pointed; no extra step if DNS is set as above.

---

## Quick reference: Route 53 only

If you already have the app running somewhere and only need to point the domain:

1. Get the target from your host:
   - **Vercel:** use the A record IP or CNAME they give in Domains.
   - **Amplify:** use the Amplify-provided domain or the targets Amplify shows.
2. In **Route 53** → **Hosted zones** → **yourdomain.com**:
   - Create **A** or **CNAME** record for the hostname you want (`@` for apex, `www` for www).
   - Point it to that target.
3. At your host, add the domain so it serves your app and issues SSL.
