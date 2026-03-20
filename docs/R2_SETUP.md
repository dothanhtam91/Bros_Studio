# Cloudflare R2 setup (real estate delivery images)

Album photos and realtor headshots are stored in **Cloudflare R2** (S3-compatible). Supabase remains the source of truth for auth, Postgres, and metadata; only binary image storage moved to R2.

## Environment variables (server-only)

Set these in `.env.local` (local) or your host’s env (e.g. Vercel, Cloudflare Workers):

| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare account ID (Dashboard → R2 → right sidebar). |
| `R2_ACCESS_KEY_ID` | R2 API token access key (create under R2 → Manage R2 API Tokens). |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret. |
| `R2_BUCKET_NAME` | Bucket name, e.g. `bros-studio-media`. |
| `R2_PUBLIC_URL` | Public base URL for reads, e.g. `https://pub-xxxx.r2.dev` or your custom domain. |

Never expose `R2_ACCESS_KEY_ID` or `R2_SECRET_ACCESS_KEY` to the client. `R2_PUBLIC_URL` is not secret (used for building image URLs).

## CORS (required for album image upload)

Album images are uploaded **directly from the browser** to R2 (presigned URLs) to avoid Vercel's 4.5 MB body limit. If you see "Failed to fetch" or "Upload to storage failed", the R2 bucket CORS policy is almost certainly missing or wrong.

### Step-by-step: Set CORS in Cloudflare (BrosStudio)

1. **Log in to Cloudflare**  
   Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign in.

2. **Open R2**  
   In the left sidebar, click **R2 Object Storage**.

3. **Select your bucket**  
   Click the bucket you use for BrosStudio (e.g. `bros-studio-media`).  
   If you don’t have one yet, create it first (see “Create bucket and public access” below).

4. **Open bucket Settings**  
   At the top of the bucket page, click the **Settings** tab.

5. **Find CORS policy**  
   Scroll to the **CORS policy** section.

6. **Add or edit the CORS rule**  
   - Click **Add CORS policy** (or **Edit** if one exists).  
   - Use one of these approaches:

   **Option A — Simple (one rule, multiple origins)**  
   If your provider allows multiple origins in one rule:
   - **Allowed origins:**  
     `https://www.bros-photo.com`  
     `https://bros-photo.com`  
     `https://*.vercel.app`  
     `http://localhost:3000`  
     (Enter one per line or comma-separated, depending on the UI.)
   - **Allowed methods:** `PUT`, `GET`, `HEAD`.
   - **Allowed headers:** `Content-Type`, `Content-Length`.
   - **Expose headers:** `ETag` (optional).

   **Option B — One rule per origin (if the UI only allows one origin per rule)**  
   Add 4 separate rules with the same methods/headers and these origins, one each:
   - `https://www.bros-photo.com`
   - `https://bros-photo.com`
   - `https://*.vercel.app`
   - `http://localhost:3000`

7. **Save**  
   Click **Save** or **Deploy** for the CORS policy.

8. **Test**  
   On [https://www.bros-photo.com](https://www.bros-photo.com), go to Admin → open an album → upload an image. If CORS is correct, the upload completes. If you still see “Failed to fetch”, double-check that:
   - The origin in the rule is exactly `https://www.bros-photo.com` (no trailing slash).
   - **PUT** is in Allowed methods.
   - **Content-Type** and **Content-Length** are in Allowed headers.

Without this, the browser blocks the direct PUT to R2 and you get a network/CORS error (often reported as "Failed to fetch").

## Create bucket and public access

**If uploads succeed but images don’t load:** the bucket must be publicly readable and `R2_PUBLIC_URL` must be set in Vercel (and match the bucket’s public URL). Without this, the URLs stored in the DB point to a host that 404s or isn’t public.

1. Cloudflare Dashboard → **R2** → **Create bucket** (e.g. `bros-studio-media`).
2. **Public access:** either use the **R2 dev subdomain** (quick) or a **custom domain** (recommended for production, see below).
3. In **Vercel** → Project → **Settings** → **Environment Variables**, add `R2_PUBLIC_URL` with that exact base URL (no trailing slash) for Production (and Preview if you use it). Redeploy after adding.

### Public access with your own domain (e.g. media.bros-photo.com)

Use a **subdomain** (e.g. `media.bros-photo.com`) so it doesn’t conflict with your main site (`www.bros-photo.com`). Your main site stays on Vercel; only image URLs point to the subdomain.

**“That domain was not found on your account”:** R2 custom domains only work for domains that are **in your Cloudflare account and managed through Cloudflare DNS**. Add the domain first (see below), then connect the subdomain to R2.

**Step 0 — Add your domain to Cloudflare**

1. In Cloudflare Dashboard, click **Add a site** (or **Websites** → **Add a site**).
2. Enter your root domain, e.g. **`bros-photo.com`**, and continue.
3. Choose a plan (Free is enough for DNS and R2).
4. **DNS setup:**
   - **Full setup (recommended):** Cloudflare will show two nameservers (e.g. `xxx.ns.cloudflare.com`). At your **domain registrar** (where you bought bros-photo.com), change the domain’s nameservers to these two. After propagation, Cloudflare will manage all DNS for bros-photo.com and you can add `media.bros-photo.com` for R2.
   - **Partial (CNAME) setup:** If you don’t want to move the whole domain to Cloudflare, use [Partial setup](https://developers.cloudflare.com/dns/zone-setups/partial-setup/): add the site as “Partial” and create a CNAME at your current DNS (e.g. `media` → target Cloudflare gives you). The zone must still exist in your Cloudflare account for R2 to see it.
5. Finish the wizard. Wait until the domain shows **Active** in Cloudflare.
6. Then go back to **R2** → your bucket → **Settings** → **Custom Domains** → **Connect Domain** and enter **`media.bros-photo.com`**. It should find the domain this time.

**Steps:**

1. **Cloudflare Dashboard** → **R2** → click your bucket (e.g. `bros-studio-media`).
2. Open the **Settings** tab.
3. Find **Custom Domains** → click **Connect Domain** / **Add**.
4. **Enter the subdomain** you want for R2 (e.g. `media.bros-photo.com`). Do not use the root domain or `www` if that serves your main site.
5. Click **Continue**. Cloudflare will show the DNS record it will create (a CNAME or similar). Click **Connect Domain** (or equivalent) to confirm.
6. Wait until the domain status changes from **Initializing** to **Active** (a few minutes). You can use **Retry connection** (⋯ next to the bucket) if it’s slow.
7. **Allow public access** to the bucket if prompted: in bucket **Settings** → **Public access** / **Public Development URL** section, ensure public access is **Allowed** for the custom domain. (The custom domain can be allowed while the r2.dev subdomain is disabled.)
8. Set **`R2_PUBLIC_URL`** in Vercel to your custom domain **with `https://`**, e.g. `https://media.bros-photo.com` (no trailing slash). Redeploy.

Image URLs will then look like: `https://media.bros-photo.com/albums/.../image.jpg`. They’re served by R2 via your domain and can use Cloudflare caching.

**Reference:** [Cloudflare R2 – Public buckets (custom domains)](https://developers.cloudflare.com/r2/buckets/public-buckets/).

## API token

1. R2 → **Manage R2 API Tokens** → Create API token.
2. Permissions: **Object Read & Write** for the bucket (or account-level if you prefer).
3. Copy Access Key ID and Secret Access Key into `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`.

## Code layout

- **`src/lib/r2/client.ts`** — S3 client, `uploadToR2`, `deleteFromR2`, `getR2PublicUrl`. Server-only.
- **`src/lib/r2/index.ts`** — Re-exports.
- **Uploads:**  
  - `POST /api/admin/albums/[id]/images/presign` — returns presigned URLs.  
  - Client uploads files directly to R2 (bypasses Vercel 4.5 MB limit).  
  - `POST /api/admin/albums/[id]/images/confirm` — inserts `album_images` after upload.  
  - `POST /api/admin/realtors/[id]/headshot` — uploads to `realtors/{realtorId}/headshot.{ext}`, updates `realtors.headshot_url`.
- **Delete:**  
  - `DELETE /api/admin/albums/[id]/images/[imageId]` — deletes object by `storage_key` (if set), then deletes DB row. Legacy rows without `storage_key` only remove the row.
- **Gallery / download:** Delivery pages and `GET /api/delivery/albums/[albumId]/download` read `image_url` from Postgres and use it as-is (R2 or legacy Supabase URLs). No change to UI or delivery flow.

## Schema

- **`album_images`** — `image_url` (public URL), `storage_key` (nullable, R2 key for delete). Migration: `00009_r2_storage_key.sql`.
- **Walkthrough videos** — still stored as `albums.video_url` (YouTube/Vimeo URL). No R2 storage for video; embed only.

## Production notes

- Restrict R2 API tokens to the minimum scope (e.g. one bucket, Read & Write only).
- Use a custom domain for R2 public access and put it behind your CDN if you want caching and one hostname.
- For thumbnails/optimized assets later: add a pipeline that writes to keys like `albums/{id}/thumb/{uuid}.jpg` and store that in metadata or serve via a single “optimized” URL pattern; delivery can stay on full-res `image_url` until then.
