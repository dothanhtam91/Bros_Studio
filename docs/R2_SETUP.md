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

Album images are uploaded **directly from the browser** to R2 (presigned URLs) to avoid Vercel's 4.5 MB body limit. Configure CORS on your R2 bucket:

1. R2 → your bucket → **Settings** → **CORS policy**.
2. Add a rule, for example:
   - **Allowed origins:** `https://yourdomain.com`, `https://www.yourdomain.com`, `https://*.vercel.app` (or `*` for testing).
   - **Allowed methods:** `PUT`, `GET`, `HEAD`.
   - **Allowed headers:** `Content-Type`.

Without CORS, the browser will block the direct PUT and you may see a CORS error in the console.

## Create bucket and public access

1. Cloudflare Dashboard → **R2** → **Create bucket** (e.g. `bros-studio-media`).
2. **Public access:** either  
   - **R2 dev subdomain:** use the bucket’s public URL as `R2_PUBLIC_URL`, or  
   - **Custom domain:** add a domain in R2 → bucket → Settings → Public access → Custom domain, then set `R2_PUBLIC_URL` to that origin (e.g. `https://media.yourdomain.com`).

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
