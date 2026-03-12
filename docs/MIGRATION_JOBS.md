# Run the unified jobs migration

The error **"Could not find the table 'public.jobs' in the schema cache"** means the migration that creates the `jobs` table (and related tables) has not been applied to your Supabase database yet.

## Option 1: Supabase Dashboard (recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Go to **SQL Editor**.
3. Open the file **`supabase/migrations/00010_unified_jobs.sql`** in your project and copy its full contents.
4. Paste into the SQL Editor and click **Run**.

This creates:

- `customers`
- `jobs`
- `job_timeline_events`
- `revision_requests`
- `notifications`
- and the `job_id` column on `albums`

## Option 2: Supabase CLI (if project is linked)

From the project root:

```bash
npx supabase link   # if not already linked: enter project ref and DB password
npx supabase db push
```

## After running the migration

- Reload your app; the admin jobs list and analytics should work.
- If the dashboard still shows a schema cache error, wait a few seconds and refresh, or trigger a reload from the Supabase project **Settings → API** (schema is refreshed automatically).
