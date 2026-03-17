# BrosStudio – Full workflow checklist

Use this to verify the app end-to-end. Base URL: **http://localhost:3000** (or 3001 if 3000 is in use).

---

## Part 1: One-time setup

Do this once before testing.

### 1.1 Environment

- [ ] `.env.local` exists with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL=http://localhost:3000` (or your dev URL)

### 1.2 Database (Supabase SQL Editor)

Run in order:

- [ ] `supabase/migrations/00001_initial_schema.sql`
- [ ] `supabase/migrations/00002_add_drive_folder_url.sql`
- [ ] `supabase/migrations/00003_portfolio_drive.sql`
- [ ] `supabase/migrations/00004_profile_full_name_from_metadata.sql`
- [ ] `supabase/migrations/00005_personal_portfolio.sql`

### 1.3 Storage (Supabase → Storage)

- [ ] Bucket **`assets`** exists (for admin job uploads).
- [ ] Bucket **`portfolio`** exists and is **public** (for studio + user portfolios).

### 1.4 Auth (Supabase → Authentication)

- [ ] **URL Configuration** → Redirect URLs includes:  
  `http://localhost:3000/auth/callback` (and `http://127.0.0.1:3001/auth/callback` if you use that).
- [ ] **Providers** → **Google** (and/or **Facebook**) enabled with Client ID + Secret.
- [ ] **Providers** → **Email** enabled (for sign up / sign in with password).

### 1.5 First admin user

1. Open the app → **Login** → **Create account** (or **Continue with Google**).
2. Sign up with an email you control.
3. In Supabase → **SQL Editor**, run (replace with your email):

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

4. Sign out, then sign in again. You should now be able to open **Admin** (e.g. `/admin`).

### 1.6 Run the app

```bash
cd "/Users/dothanhtam91/Desktop/PROJECT /BrosStudio"
npm install
npm run dev
```

- [ ] App loads at **http://localhost:3000** (or the URL shown).
- [ ] No “Your project's URL and Key are required” error.

---

## Part 2: Public site (no login)

### 2.1 Home

- [ ] Open **http://localhost:3000**
- [ ] Header: Home, Portfolio, Packages, Book, About, Contact, **Login** (or avatar when signed in), **Book a shoot**.
- [ ] Hero section and content load.

### 2.2 Portfolio (studio only)

- [ ] Go to **http://localhost:3000/portfolio**
- [ ] Page shows “Portfolio” and either studio images (if admin uploaded any) or local `public/portfolio` images or “No images yet”.

### 2.3 Packages

- [ ] **http://localhost:3000/packages** – packages/pricing page loads.

### 2.4 Book a shoot

- [ ] **http://localhost:3000/book**
- [ ] Fill form (address, name, email, etc.) and submit.
- [ ] No crash; success or “thank you” (if Resend is configured) or check **Supabase → Table Editor → bookings** for a new row.

### 2.5 Contact

- [ ] **http://localhost:3000/contact** – form loads and submits without error.

---

## Part 3: Client – sign up & login

### 3.1 Create account (email)

- [ ] **http://localhost:3000/signup**
- [ ] Enter name (optional), email, password (min 6 chars) → **Create account**.
- [ ] If email confirmation is off: redirect to **Dashboard**.  
  If on: “Check your email” and confirm, then sign in from **Login**.

### 3.2 Login with Google

- [ ] **http://localhost:3000/login**
- [ ] Click **Continue with Google** → choose account → redirect back to **Dashboard** (or **Login** with error if redirect URL is wrong).

### 3.3 Login with email

- [ ] **http://localhost:3000/login**
- [ ] Enter same email/password as signup → **Sign in with email** → **Dashboard**.

---

## Part 4: Client – dashboard & personal portfolio

### 4.1 Dashboard (no client link yet)

- [ ] While logged in as a **non-admin** user (e.g. the one you just created), open **http://localhost:3000/dashboard**.
- [ ] Either:
  - “No client profile linked…” with links **My portfolio**, **Contact us**, **Sign out**, or
  - “Your projects” list if this user has a `clients` row and projects.

### 4.2 My portfolio (personal)

- [ ] From Dashboard, click **My portfolio** (or go to **http://localhost:3000/dashboard/portfolio**).
- [ ] Page title: “My portfolio”; copy says only you see these images when signed in.
- [ ] **Upload**: choose one or more images (JPG/PNG/WebP/GIF) → upload.
- [ ] Success message and images appear in the grid.
- [ ] Sign out, open **http://localhost:3000/portfolio** (public) → your uploads do **not** appear there (only studio items).
- [ ] Sign back in → **My portfolio** → your images are still there.

### 4.3 Client with projects (optional)

To test “Your projects” and project gallery:

1. In Supabase → **Table Editor → clients**:
   - Create a row with `contact_email` = the logged-in user’s email, and set `user_id` = that user’s ID (from **Authentication → Users**).
2. In **Table Editor → projects**:
   - Create a project with `client_id` = that client’s ID, `address` = “123 Test St”, `status` = `delivered` (or any).
3. In **Storage → assets** bucket, upload a file and note the path.
4. In **Table Editor → assets**, insert a row: `project_id` = project id, `storage_key` = that path, `variant` = `original`, `sort_order` = 0.

Then:

- [ ] **http://localhost:3000/dashboard** → “Your projects” lists the project.
- [ ] Click the project → **http://localhost:3000/project/[id]** → gallery and download options (if assets exist).

---

## Part 5: Admin – jobs & studio portfolio

### 5.1 Admin area

- [ ] Log in as the **admin** user (the one you set `role = 'admin'` for).
- [ ] Open **http://localhost:3000/admin** (or click **Admin** if shown in header).
- [ ] Page: “Admin – Jobs” with **Analytics**, **Portfolio**, **New job**, **Sign out**.

### 5.2 Studio portfolio (admin)

- [ ] **Admin** → **Portfolio** (or **http://localhost:3000/admin/portfolio**).
- [ ] Upload one or more images.
- [ ] Open **http://localhost:3000/portfolio** in an incognito window (or signed out): uploaded images appear as the **studio** portfolio.

### 5.3 New job

- [ ] **Admin** → **New job**.
- [ ] Create a job (e.g. from a booking or manual: client, address, etc.) and save.
- [ ] **Admin – Jobs** list shows the new job.

### 5.4 Job detail (upload, delivery, invoice)

- [ ] Click the job in the list → job detail page.
- [ ] **Upload assets**: upload one or more files → they appear in the asset list.
- [ ] **Send delivery email** (if Resend is set): client receives email with link to project.
- [ ] **Create invoice** (if Stripe is set): invoice row created; optional pay link.
- [ ] **Analytics**: **Admin** → **Analytics** – page loads (metrics depend on data).

### 5.5 Sign out

- [ ] **Sign out** from admin → redirect to home or login.

---

## Part 6: Quick verification matrix

| Flow                    | URL / action                         | Expected result                          |
|-------------------------|--------------------------------------|------------------------------------------|
| Public portfolio        | `/portfolio`                         | Studio + local images only               |
| Client signup           | `/signup` → submit                   | Account created; redirect or email       |
| Client Google login     | `/login` → Continue with Google     | Redirect to Dashboard                    |
| Client dashboard        | `/dashboard`                         | Projects or “No client” + My portfolio   |
| Client my portfolio     | `/dashboard/portfolio`              | User’s own images + upload               |
| Admin jobs              | `/admin` (as admin)                  | Jobs list + New job                      |
| Admin studio portfolio  | `/admin/portfolio`                   | Upload studio images                     |
| Admin job detail        | `/admin/jobs/[id]`                   | Upload assets, delivery, invoice         |
| Project page (client)   | `/project/[id]` (linked client)      | Gallery, download                        |

---

## Troubleshooting

- **“Your project's URL and Key are required”**  
  Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` and restart the dev server.

- **Google login redirects to login with error**  
  Add the **exact** callback URL (shown on `/login`) to Supabase → Authentication → URL Configuration → Redirect URLs, and add Supabase’s callback URL in Google Cloud Console → OAuth client → Authorized redirect URIs.

- **Dashboard shows “No client profile linked”**  
  Normal for new users. Use **My portfolio** to test personal portfolio. To test projects, link a `clients` row to the user’s `user_id` and create a project for that client.

- **Admin redirects to /dashboard**  
  User is not admin. Run:  
  `UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';`  
  then sign out and sign in again.

- **Portfolio upload fails (admin or user)**  
  Ensure `portfolio` bucket exists in Supabase Storage and is **public**. Run migration `00005_personal_portfolio.sql` for user uploads.

- **Job upload / assets not showing**  
  Ensure `assets` bucket exists. Check browser network tab and Supabase Storage for failed uploads.
