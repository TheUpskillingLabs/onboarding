#!/usr/bin/env node
/* build-config.js — writes config.js from environment variables at deploy time.
   Lets Vercel (or any host) own the per-environment values instead of the repo:
   the committed config.js stays empty (demo mode); this overwrites it in the
   build output only.

   Vercel setup:
     Build Command:     node tools/build-config.js
     Output Directory:  .
     Environment vars:  SUPABASE_URL, SUPABASE_ANON_KEY
                        (optional: WELCOME_EMAIL_ENDPOINT, COMPLETE_SIGNUP_ENDPOINT)

   No vars set → writes the empty config → the deploy runs in demo mode. */
const fs = require('fs');
const path = require('path');
const v = (k) => (process.env[k] || '').trim();
const cfg = {
  supabaseUrl: v('SUPABASE_URL'),
  supabaseAnonKey: v('SUPABASE_ANON_KEY'),
  welcomeEmailEndpoint: v('WELCOME_EMAIL_ENDPOINT'),
  completeSignupEndpoint: v('COMPLETE_SIGNUP_ENDPOINT'),
};
fs.writeFileSync(path.join(__dirname, '..', 'config.js'),
  '/* GENERATED at deploy by tools/build-config.js from environment variables. */\n'
  + 'window.LABS_CONFIG = ' + JSON.stringify(cfg, null, 2) + ';\n');
console.log('config.js written:', cfg.supabaseUrl ? 'LIVE mode → ' + cfg.supabaseUrl : 'demo mode (no SUPABASE_URL set)');
