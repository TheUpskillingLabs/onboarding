/* Environment config — the ONLY file you edit to point the app at a backend.
   Empty values = DEMO MODE (everything works in-browser via localStorage,
   exactly as the prototype always has; nothing touches a database).

   To go live against the DEV Supabase project, fill in:
     supabaseUrl     — https://<dev-ref>.supabase.co   (Project Settings → API)
     supabaseAnonKey — the anon/public key from the same page. Safe to ship in
                       a static site: it only grants what RLS allows, and all
                       writes go through the JWT-verified edge functions.

   Endpoints derive from supabaseUrl automatically; override only if hosting
   the functions elsewhere. See docs/GO_LIVE_DEV.md for the full checklist
   (Google provider, redirect URLs, function deploys, secrets). */
window.LABS_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  welcomeEmailEndpoint: '',   // default: {supabaseUrl}/functions/v1/send-welcome-summary
  completeSignupEndpoint: ''  // default: {supabaseUrl}/functions/v1/complete-signup
};
