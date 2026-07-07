/* backend.js — the Supabase bridge. Loaded after config.js + the supabase-js
   CDN build, before app.js. With no config (or no CDN) Backend.enabled is
   false and the app runs in DEMO MODE untouched — every hook in app.js is
   guarded, so the click-through prototype keeps working with zero setup.

   Design: the browser NEVER writes tables directly. All writes go through the
   complete-signup Edge Function (service role, JWT-verified) — no self-service
   RLS write policies to maintain, one server-side place for validation and
   value normalization, and a 1:1 shape with OLOS's registration route for the
   eventual integration. */
(function(){
  const cfg = window.LABS_CONFIG || {};
  const hasLib = typeof window.supabase !== 'undefined' && window.supabase.createClient;
  // Normalize the URL (a missing scheme would make createClient throw).
  let url = String(cfg.supabaseUrl || '').trim().replace(/\/$/, '');
  if (url && !/^https?:\/\//.test(url)) url = 'https://' + url;
  let on = !!(url && cfg.supabaseAnonKey && hasLib);
  let client = null;
  if (on) {
    try { client = window.supabase.createClient(url, cfg.supabaseAnonKey); }
    catch (e) { console.warn('backend disabled (bad config?):', e && e.message); on = false; }
  }
  const fnBase = on ? url + '/functions/v1/' : '';

  // The email hook app.js already honors — wire it to the deployed function.
  if (on && !window.WELCOME_EMAIL_ENDPOINT) {
    window.WELCOME_EMAIL_ENDPOINT = cfg.welcomeEmailEndpoint || (fnBase + 'send-welcome-summary');
  }

  async function accessToken(){
    const { data } = await client.auth.getSession();
    return data.session ? data.session.access_token : null;
  }
  async function call(action, payload){
    const t = await accessToken();
    if (!t) throw new Error('backend: no session');
    const res = await fetch(cfg.completeSignupEndpoint || (fnBase + 'complete-signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t, 'apikey': cfg.supabaseAnonKey },
      body: JSON.stringify(Object.assign({ action: action }, payload || {}))
    });
    if (!res.ok) { const d = await res.text(); throw new Error('backend ' + action + ' ' + res.status + ': ' + d.slice(0,200)); }
    return res.json();
  }

  window.Backend = {
    enabled: on,
    /* session (or null) — call once at boot; supabase-js also consumes the
       OAuth redirect hash/code on this call. */
    async init(){
      if (!on) return null;
      const { data } = await client.auth.getSession();
      return data.session ? data.session.user : null;
    },
    async signInWithGoogle(){
      sessionStorage.setItem('labs.joinIntent', '1');
      await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } });
    },
    async signOut(){ if (on) { try { await client.auth.signOut(); } catch(e){} } },
    joinIntent(){ return sessionStorage.getItem('labs.joinIntent') === '1'; },
    clearJoinIntent(){ sessionStorage.removeItem('labs.joinIntent'); },

    /* All server writes/reads — fire-and-forget from app.js except profile(). */
    profile(){ return call('get_profile'); },
    completeSignup(p){ return call('signup', p); },
    updateDetails(p){ return call('update_details', p); },
    syncRoles(p){ return call('update_roles', p); },
    cycleInterest(){ return call('cycle_interest'); },
    recordAgreement(doc, version, source){ return call('record_agreement', { doc: doc, version: version, source: source }); },
    /* Admin surface (admin.html) — server re-checks the caller's role on every call. */
    admin(action, payload){ return call('admin_' + action, payload); }
  };
})();
