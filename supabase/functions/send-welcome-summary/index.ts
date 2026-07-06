/* send-welcome-summary — Supabase Edge Function (the SEPARATE email path).
   Sends the onboarding welcome-summary via Resend. Deliberately independent of
   OLOS's Vercel email code: no OLOS deploy, no shared route, no double-send —
   OLOS's registration email only fires from ITS routes, which this app never calls.

   Deploy:
     supabase functions deploy send-welcome-summary
     supabase secrets set RESEND_API_KEY=re_xxxxxxxx
     # optional: supabase secrets set RESEND_FROM_EMAIL=noreply@enroll.theupskillinglabs.org
     #           supabase secrets set ALLOWED_ORIGIN=https://theupskillinglabs.github.io

   The static app calls it fire-and-forget at thank-you time (see app.js
   sendWelcomeEmail — set window.WELCOME_EMAIL_ENDPOINT to this function's URL).

   Payload: { to, firstName, rows: [ [label, value], ... ] }               */

import { welcomeSummaryHtml, welcomeSummaryText, welcomeSummarySubject } from './template.js';

const FROM = `Upskilling Labs <${Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@enroll.theupskillinglabs.org'}>`;
const ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';
const CORS = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  let p: { to?: string; firstName?: string; rows?: [string, string][]; kind?: string };
  try { p = await req.json(); } catch { return json(400, { error: 'invalid JSON' }); }

  const kind = p.kind === 'update' ? 'update' : 'welcome';
  const to = String(p.to ?? '').trim();
  const firstName = String(p.firstName ?? '').trim() || 'friend';
  const rows = Array.isArray(p.rows)
    ? p.rows.filter((r) => Array.isArray(r) && r.length === 2).map((r) => [String(r[0]).slice(0, 80), String(r[1]).slice(0, 300)] as [string, string]).slice(0, 12)
    : [];
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return json(400, { error: 'valid "to" email required' });
  if (!rows.length) return json(400, { error: '"rows" required' });

  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return json(500, { error: 'RESEND_API_KEY not configured' }); // loud, never silent (lesson learned)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to,
      subject: welcomeSummarySubject(kind),
      html: welcomeSummaryHtml({ firstName, rows, kind }),
      text: welcomeSummaryText({ firstName, rows, kind }),
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error('resend send failed', res.status, detail);
    return json(502, { error: 'send failed', status: res.status });
  }
  const { id } = await res.json();
  return json(200, { ok: true, id });
  // When migration 00036 lands, also insert the email_log row here (service-role client).
});
