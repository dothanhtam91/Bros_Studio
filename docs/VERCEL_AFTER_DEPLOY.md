# After Deploying to Vercel — Required Steps

Once your app is deployed, do these so the site works correctly.

---

## 1. Google (and Facebook) login

Login will fail until Supabase knows your **live** URL.

1. **Copy your Vercel URL**  
   From the Vercel deployment (e.g. `https://brosstudio-xxx.vercel.app` or your custom domain).

2. **Supabase → Authentication → URL Configuration**
   - **Site URL:** set to your live URL (e.g. `https://brosstudio-xxx.vercel.app` or `https://bros-photo.com`).
   - **Redirect URLs:** add **exactly**:
     - `https://YOUR_VERCEL_OR_DOMAIN_URL/auth/callback`  
     Example: `https://brosstudio-xxx.vercel.app/auth/callback`  
     If you use a custom domain later, add that too: `https://bros-photo.com/auth/callback`, `https://www.bros-photo.com/auth/callback`.

3. **Vercel → Project → Settings → Environment Variables**
   - Set **`NEXT_PUBLIC_APP_URL`** to that same URL (e.g. `https://brosstudio-xxx.vercel.app`).  
   - Redeploy after changing so the app uses the new value.

4. **Google Cloud Console** (if you use Google sign-in)  
   - Your OAuth 2.0 Client → **Authorized redirect URIs** must include the **Supabase** callback (from Supabase → Auth → Providers → Google), e.g. `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.  
   - It does **not** need the Vercel URL; Supabase redirects to your app after Google signs in.

If you see “Sign-in could not be completed” or get sent to the homepage after Google login, the redirect URL in Supabase is missing or doesn’t match the URL in the browser when you clicked “Continue with Google”.

---

## 2. Hero video

The landing hero uses `public/Hero-video.mp4` (capital H). If the video doesn’t show:

- Ensure the file is committed and deployed (path: `public/Hero-video.mp4`).
- If your file is lowercase `hero-video.mp4`, rename it to `Hero-video.mp4` or update the component to match your filename.

---

## 3. Optional: custom domain

When you add a custom domain in Vercel (e.g. bros-photo.com):

- Add **both** `https://bros-photo.com/auth/callback` and `https://www.bros-photo.com/auth/callback` to Supabase Redirect URLs.
- Set **`NEXT_PUBLIC_APP_URL`** in Vercel to your canonical URL (e.g. `https://bros-photo.com`) and redeploy.

See [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md) for the full DNS and cutover steps.
