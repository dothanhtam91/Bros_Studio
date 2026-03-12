# How to connect Supabase to BrosStudio

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Pick an organization, name the project (e.g. `brosstudio`), set a database password (save it), choose a region, then **Create new project**.
4. Wait until the project is ready (green status).

## 2. Get your project URL and keys

1. In the Supabase dashboard, open your project.
2. Go to **Settings** (gear) → **API**.
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (Project API keys) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (Reveal) → `SUPABASE_SERVICE_ROLE_KEY`  
   Do not expose the service_role key in the browser or in git.

## 3. Create `.env.local`

In the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set (use your real values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use the exact URL you open in the browser (e.g. `http://127.0.0.1:3001` if you use that).

## 4. Run database migrations

In Supabase → **SQL Editor**, run each file in order (copy-paste and Execute):

- `supabase/migrations/00001_initial_schema.sql`
- `supabase/migrations/00002_add_drive_folder_url.sql`
- `supabase/migrations/00003_portfolio_drive.sql`
- `supabase/migrations/00004_profile_full_name_from_metadata.sql`

Or with Supabase CLI: `supabase db push`

## 5. Create Storage buckets

In Supabase → **Storage**:

- **New bucket** → name `assets` (for admin uploads).
- **New bucket** → name `portfolio` → enable **Public bucket** (for portfolio images).

## 6. (Optional) Google / Facebook login

- **Authentication** → **Providers** → enable Google and/or Facebook, add Client ID and Secret.
- **Authentication** → **URL Configuration** → **Redirect URLs**: add the URL shown on the login page (e.g. `http://localhost:3000/auth/callback`).

## 7. Run the app

```bash
npm install
npm run dev
```

Open the app (e.g. `http://localhost:3000`). After signing up, make yourself admin in SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

If the app loads without “Your project's URL and Key are required”, Supabase is connected.
