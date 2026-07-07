# Go live against Supabase DEV — setup checklist

The app has two modes, decided by `config.js`: empty values = **demo mode**
(localStorage only, the prototype as it's always worked); filled values =
**live mode** (real Google auth, real DB writes via the edge functions, real
email). Every backend call is fire-and-forget — if the network hiccups, the
member's flow never breaks; the local state is always the UI's source of truth.

## One-time Supabase DEV setup

1. **Google provider** — dashboard → Authentication → Providers → Google →
   enable, with OAuth client ID/secret from Google Cloud Console (authorized
   redirect URI: `https://<dev-ref>.supabase.co/auth/v1/callback`).
2. **Redirect URLs** — Authentication → URL Configuration → add every place
   the app runs: `http://localhost:8000/**`, your Vercel URL(s) `https://*.vercel.app/**`,
   the GitHub Pages URL. OAuth returns to the page that started it.
3. **Deploy the two functions** (from this repo, linked to dev):
   ```
   supabase functions deploy complete-signup
   supabase functions deploy send-welcome-summary
   supabase secrets set RESEND_API_KEY=re_xxxx
   supabase secrets set ALLOWED_ORIGIN=https://<your-vercel-app>.vercel.app
   ```
   (`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are auto-provided to functions.)

## Per-environment config

Edit `config.js` (root — served with the site):
```js
window.LABS_CONFIG = {
  supabaseUrl: 'https://<dev-ref>.supabase.co',
  supabaseAnonKey: '<anon key from Project Settings → API>',
};
```
The anon key is public by design — writes only happen inside the JWT-verified
edge functions (service role); the browser never touches tables directly.

## Vercel

Import the repo → framework preset **Other** → no build command → output `./`.
No environment variables needed (static site; config travels in config.js).
For a prod deployment later: a separate branch or project with prod values in
config.js — never point the marketing site's join button at a dev-configured deploy.

## What writes what (live mode)

| Moment | Call | Tables |
|---|---|---|
| Continue with Google | Supabase OAuth | auth.users |
| Become an Upskiller / Sign me up | `complete-signup` (signup) | participants (intake, role_intents, contact_consent, created_via='onboarding_app'), participant_roles, agreement_acceptances |
| Begin registration (commitment) | `complete-signup` (cycle_interest) | cycle_enrollments ('interested') |
| Mentor publish / catch-up docs | `complete-signup` (record_agreement) | agreement_acceptances |
| Welcome-back role change | `complete-signup` (update_roles) | role_intents + participant_roles revoke/insert |
| Welcome-back detail edit | `complete-signup` (update_details) | participants |
| Thank-you / update receipts | `send-welcome-summary` | (Resend send; email_log wiring is a TODO in the function) |
| Returning visit | `complete-signup` (get_profile) | reads participant + roles + acceptances + enrollments |

## Testing end-to-end

1. Deploy to Vercel (or `python3 -m http.server 8000`) with dev config.
2. Open `/join/`, sign in with a real Google account, run the full funnel.
3. Verify in dev Studio:
   ```sql
   SELECT id, email, first_name, created_via, sector, years_experience, contact_consent
   FROM participants ORDER BY created_at DESC LIMIT 3;
   SELECT role, granted_at FROM participant_roles WHERE revoked_at IS NULL
     AND participant_id = (SELECT MAX(id) FROM participants);
   SELECT doc, version, source FROM agreement_acceptances
     WHERE participant_id = (SELECT MAX(id) FROM participants);
   SELECT status FROM cycle_enrollments
     WHERE participant_id = (SELECT MAX(id) FROM participants);
   ```
4. Check the welcome email arrived (and the thank-you page dropped its
   "(Simulated…)" note — it does that automatically when the endpoint is set).
5. Revisit `/join/` signed in → welcome-back should show the DB-backed profile.
