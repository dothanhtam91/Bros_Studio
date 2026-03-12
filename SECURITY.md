# Security — Secrets & API Key Protection

This project uses sensitive credentials. **Never expose them in client-side code or public repositories.**

## Rules (enforced)

1. **Never in code**
   - Do not hardcode API keys, tokens, or secrets in source code.
   - Do not put secrets in frontend JavaScript, React, or Next.js client components.
   - Do not commit secrets to Git or include them in docs or examples.
   - Do not log or print secrets.

   **Always** use environment variables, e.g.:
   - `process.env.GEMINI_API_KEY`
   - `process.env.SUPABASE_SERVICE_ROLE_KEY`
   - `process.env.DATABASE_URL`

2. **Client vs server**
   - Sensitive keys **must only exist on the server.**
   - Flow: **Frontend → Backend API → External services** (Gemini, Supabase, Stripe, etc.).
   - Frontend must **never** use private keys directly.

3. **Supabase**
   - **Safe for frontend:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Server only:** `SUPABASE_SERVICE_ROLE_KEY`, database credentials, JWT secrets  
   - Use `createAdminClient()` (service role) only in API routes and server code.

4. **Where to store secrets**
   - Local: `.env` / `.env.local` (never commit).
   - Production: Vercel env vars, AWS Secrets Manager, Docker secrets, Cloudflare secrets, or server env only.
   - Never in: GitHub repos, public config files, static assets, or frontend bundles.

5. **When writing code**
   - Read secrets from `process.env.*`.
   - Keep sensitive logic in backend routes (e.g. `src/app/api/`).
   - Never expose credentials to the browser.
   - Proxy external API calls (e.g. Gemini, Stripe) through the backend.

6. **Priority**
   - Security over convenience. If something would expose credentials, move it to a backend service.

## Project usage (reference)

- **Gemini:** Used only in `src/app/api/generate-social-caption/route.ts` via `process.env.GEMINI_API_KEY`.
- **Supabase anon:** Used in client and server (RLS); env: `NEXT_PUBLIC_SUPABASE_*`.
- **Supabase service role:** Used only in `src/lib/supabase/admin.ts` and API routes; env: `SUPABASE_SERVICE_ROLE_KEY`.
- **Stripe:** Used only in API routes; env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- **Resend / OpenAI / S3:** Used only in API routes or server-side code.
- **Cloudflare R2:** Used only in server-side code (`src/lib/r2/`, API routes). Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` (server-only). `R2_PUBLIC_URL` is the public read URL (no secret); used for building image URLs and next.config.

## Rotation & monitoring

- Rotate API keys regularly.
- Audit usage and revoke compromised keys immediately.
- Restrict keys (IP, referrer, scope) where supported.
