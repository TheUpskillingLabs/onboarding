/* complete-signup — the onboarding app's single write path (Edge Function).
   The static app never touches tables directly: it POSTs here with the user's
   JWT; this function verifies it, then performs the writes with the service
   role. One place for validation + value normalization, and a 1:1 shape with
   OLOS's registration route for the eventual integration.

   Actions (all POST, Authorization: Bearer <user access token>):
     get_profile      → participant row + active roles + acceptances (welcome-back)
     signup           → upsert participant (link-by-email aware) + intake +
                        role_intents + participant_roles + acceptances + consent
     update_details   → intake columns only
     update_roles     → role_intents + revoke/insert participant_roles
     cycle_interest   → cycle_enrollments row, status 'interested'
     record_agreement → one acceptance row (mentor flow / catch-up)

   Deploy:  supabase functions deploy complete-signup
   Secrets: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are auto-provided.
            Optional: ALLOWED_ORIGIN (default *).                        */

import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';
const CORS = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

/* ── UI label → DB check-constraint value normalization (single source) ── */
const norm = (s?: string) => String(s ?? '').trim();
const WORK: Record<string, string> = {}; // participants.work_situation is lowercase of the UI label
const YEARS: Record<string, string> = {
  'Just starting out': 'just starting out', '1–4 years': '1-4', '5–9 years': '5-9',
  '10–19 years': '10-19', '20+ years': '20+', 'Prefer not to answer': 'prefer not to answer',
};
const EDU: Record<string, string> = {
  'High school or GED': 'high school or GED', 'Some college': 'some college',
  'Associate degree': 'associate degree', 'Bachelor’s degree': 'bachelors degree',
  "Bachelor's degree": 'bachelors degree', 'Graduate degree': 'graduate degree',
  'Trade or technical certification': 'trade or technical certification',
  'Prefer not to answer': 'prefer not to answer',
};
const MEMBER_ROLES = ['upskiller', 'volunteer', 'mentor', 'events'];
const rawToRole = (r: string) => (r === 'cycle' ? 'upskiller' : r);

function intakeCols(i: Record<string, string>) {
  const cols: Record<string, unknown> = {};
  if (i.first) cols.first_name = norm(i.first).slice(0, 100);
  if (i.last) cols.last_name = norm(i.last).slice(0, 100);
  if (i.zip) { cols.zip = norm(i.zip).slice(0, 10); }
  if (i.metroSlug) cols.metro_slug = norm(i.metroSlug).slice(0, 50);
  if (i.work) cols.work_situation = norm(i.work).toLowerCase();
  if (i.sector) cols.sector = norm(i.sector).slice(0, 100);
  if (i.sectorOther !== undefined) cols.sector_other = norm(i.sectorOther).slice(0, 200) || null;
  if (i.yearsExp) cols.years_experience = YEARS[norm(i.yearsExp)] ?? null;
  if (i.education) cols.education_level = EDU[norm(i.education)] ?? null;
  if (i.linkedin !== undefined) cols.linkedin = norm(i.linkedin).slice(0, 300) || null;
  if (i.hearAbout) cols.source = norm(i.hearAbout).slice(0, 100);
  if (i.referredBy !== undefined) cols.referred_by = norm(i.referredBy).slice(0, 200) || null;
  return cols;
}

async function ensureParticipant(user: { id: string; email?: string; identities?: { provider: string; id: string }[]; user_metadata?: Record<string, unknown> }) {
  // 1. by auth link
  let { data: p } = await admin.from('participants').select('*').eq('auth_user_id', user.id).maybeSingle();
  if (p) return p;
  const email = norm(user.email).toLowerCase();
  if (!email) throw new Error('no email on auth user');
  // 2. by email (imported / pre-existing row) → link it, exactly as OLOS's auth callback does
  ({ data: p } = await admin.from('participants').select('*').ilike('email', email).maybeSingle());
  const googleId = user.identities?.find((i) => i.provider === 'google')?.id ?? user.id;
  if (p) {
    const { data: upd, error } = await admin.from('participants')
      .update({ auth_user_id: user.id }).eq('id', p.id).select('*').single();
    if (error) throw error;
    return upd;
  }
  // 3. fresh row — the onboarding door
  const meta = (user.user_metadata ?? {}) as Record<string, string>;
  const { data: ins, error } = await admin.from('participants').insert({
    auth_user_id: user.id, google_id: googleId, email,
    first_name: norm(meta.given_name || (meta.full_name || '').split(' ')[0] || 'New'),
    last_name: norm(meta.family_name || (meta.full_name || '').split(' ').slice(1).join(' ') || 'Member'),
    created_via: 'onboarding_app',
  }).select('*').single();
  if (error) throw error;
  return ins;
}

async function activeRoles(pid: number) {
  const { data } = await admin.from('participant_roles').select('role, cycle_id, pod_id, granted_at')
    .eq('participant_id', pid).is('revoked_at', null);
  return data ?? [];
}

async function grantRoles(pid: number, roles: string[]) {
  const have = new Set((await activeRoles(pid)).map((r) => r.role));
  const rows = roles.map(rawToRole).filter((r) => MEMBER_ROLES.includes(r) && !have.has(r))
    .map((role) => ({ participant_id: pid, role }));
  if (rows.length) { const { error } = await admin.from('participant_roles').insert(rows); if (error && error.code !== '23505') throw error; }
}

async function recordAcceptances(pid: number, list: { doc: string; version: string }[], source: string) {
  const rows = list
    .filter((a) => ['participation', 'guidelines', 'mentor'].includes(a.doc) && a.version)
    .map((a) => ({ participant_id: pid, doc: a.doc, version: String(a.version).slice(0, 50), source }));
  if (rows.length) {
    const { error } = await admin.from('agreement_acceptances')
      .upsert(rows, { onConflict: 'participant_id,doc,version', ignoreDuplicates: true });
    if (error) throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: userData, error: authErr } = await admin.auth.getUser(jwt);
  if (authErr || !userData?.user) return json(401, { error: 'invalid or missing token' });
  const user = userData.user;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { error: 'invalid JSON' }); }
  const action = String(body.action ?? '');

  try {
    const p = await ensureParticipant(user);

    /* ── Admin actions — gated by the CALLER's real role (active participant_roles
       row: admin or owner; OWNER_EMAILS secret bootstraps the first owner).
       Writes then use the service role; 00059 opened those paths for it. ── */
    if (action.startsWith('admin_')) {
      const OWNER_EMAILS = (Deno.env.get('OWNER_EMAILS') ?? '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
      const myRoles = (await activeRoles(p.id)).map((r) => r.role);
      const isOwner = myRoles.includes('owner') || OWNER_EMAILS.includes(norm(user.email).toLowerCase());
      const isAdmin = isOwner || myRoles.includes('admin');
      if (!isAdmin) return json(403, { error: 'admin only' });
      const ALL_ROLES = ['upskiller', 'events', 'volunteer', 'mentor', 'poderator', 'admin', 'owner'];
      const manageable = isOwner ? ALL_ROLES : ['upskiller', 'events', 'volunteer', 'mentor', 'poderator'];

      if (action === 'admin_list') {
        const { data: parts, error } = await admin.from('participants')
          .select('id, email, first_name, last_name, created_at, created_via, sector, sector_other, years_experience, education_level, work_situation, linkedin, source, referred_by, zip, metro_slug, contact_consent')
          .order('created_at', { ascending: false }).limit(500);
        if (error) throw error;
        const ids = (parts ?? []).map((x) => x.id);
        const [{ data: roleRows }, { data: accRows }, { data: enrRows }] = await Promise.all([
          admin.from('participant_roles').select('participant_id, role').is('revoked_at', null).in('participant_id', ids),
          admin.from('agreement_acceptances').select('participant_id, doc, version, accepted_at').in('participant_id', ids),
          admin.from('cycle_enrollments').select('participant_id, status').in('participant_id', ids),
        ]);
        return json(200, { participants: parts ?? [], roles: roleRows ?? [], acceptances: accRows ?? [], enrollments: enrRows ?? [], you: { participant_id: p.id, owner: isOwner } });
      }

      if (action === 'admin_set_roles') {
        const target = Number(body.participant_id);
        if (!target) return json(400, { error: 'participant_id required' });
        const want = (Array.isArray(body.roles) ? (body.roles as string[]) : []).map((r) => String(r).toLowerCase()).filter((r) => ALL_ROLES.includes(r));
        const have = (await activeRoles(target)).map((r) => r.role);
        for (const r of have) {
          if (manageable.includes(r) && !want.includes(r)) {
            await admin.from('participant_roles').update({ revoked_at: new Date().toISOString(), revoked_by: p.id })
              .eq('participant_id', target).eq('role', r).is('revoked_at', null);
          }
        }
        const grants = want.filter((r) => manageable.includes(r) && !have.includes(r))
          .map((role) => ({ participant_id: target, role, granted_by: p.id }));
        if (grants.length) { const { error } = await admin.from('participant_roles').insert(grants); if (error && error.code !== '23505') throw error; }
        return json(200, { ok: true });
      }

      if (action === 'admin_change_email') {
        if (!isOwner) return json(403, { error: 'owner (super admin) only' });
        const target = Number(body.participant_id); const email = norm(String(body.email)).toLowerCase();
        if (!target || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(400, { error: 'participant_id + valid email required' });
        const { error } = await admin.rpc('change_participant_email', { target_id: target, new_email: email });
        if (error) throw error;
        return json(200, { ok: true });
      }

      if (action === 'admin_delete') {
        if (!isOwner) return json(403, { error: 'owner (super admin) only' });
        const target = Number(body.participant_id);
        if (!target) return json(400, { error: 'participant_id required' });
        if (target === p.id) return json(400, { error: 'you cannot delete yourself' });
        const { error } = await admin.rpc('delete_participant', { target_id: target, why: 'admin:' + p.id + ':' + String(body.reason ?? 'admin_delete').slice(0, 60) });
        if (error) throw error;
        return json(200, { ok: true });
      }

      return json(400, { error: 'unknown admin action' });
    }

    if (action === 'get_profile') {
      const roles = await activeRoles(p.id);
      const { data: acc } = await admin.from('agreement_acceptances')
        .select('doc, version, accepted_at').eq('participant_id', p.id);
      const { data: enr } = await admin.from('cycle_enrollments')
        .select('cycle_id, status').eq('participant_id', p.id);
      return json(200, { participant: p, roles, acceptances: acc ?? [], enrollments: enr ?? [] });
    }

    if (action === 'signup') {
      const intake = intakeCols((body.intake ?? {}) as Record<string, string>);
      const roles = Array.isArray(body.roles) ? (body.roles as string[]) : [];
      const cols: Record<string, unknown> = { ...intake, contact_consent: !!body.contactOptIn };
      if (roles.length) cols.role_intents = roles.filter((r) => ['cycle', 'events', 'volunteer', 'mentor'].includes(r));
      const { error } = await admin.from('participants').update(cols).eq('id', p.id);
      if (error) throw error;
      await grantRoles(p.id, roles);
      await recordAcceptances(p.id, (body.agreements ?? []) as { doc: string; version: string }[], 'signup');
      return json(200, { ok: true, participant_id: p.id });
    }

    if (action === 'update_details') {
      const { error } = await admin.from('participants').update(intakeCols((body.intake ?? {}) as Record<string, string>)).eq('id', p.id);
      if (error) throw error;
      return json(200, { ok: true });
    }

    if (action === 'update_roles') {
      const picked = (Array.isArray(body.roles) ? (body.roles as string[]) : []).filter((r) => ['cycle', 'events', 'volunteer', 'mentor'].includes(r));
      const { error } = await admin.from('participants').update({ role_intents: picked }).eq('id', p.id);
      if (error) throw error;
      const want = new Set(picked.map(rawToRole));
      const have = await activeRoles(p.id);
      const drop = have.filter((r) => MEMBER_ROLES.includes(r.role) && !want.has(r.role));
      for (const r of drop) {
        await admin.from('participant_roles').update({ revoked_at: new Date().toISOString() })
          .eq('participant_id', p.id).eq('role', r.role).is('revoked_at', null);
      }
      await grantRoles(p.id, picked);
      return json(200, { ok: true });
    }

    if (action === 'cycle_interest') {
      const { data: cyc } = await admin.from('cycles').select('id, status')
        .in('status', ['active', 'upcoming']).order('status').limit(1).maybeSingle();
      if (!cyc) return json(409, { error: 'no active or upcoming cycle' });
      const { data: existing } = await admin.from('cycle_enrollments').select('id, status')
        .eq('participant_id', p.id).eq('cycle_id', cyc.id).maybeSingle();
      if (!existing) {
        const { error } = await admin.from('cycle_enrollments')
          .insert({ participant_id: p.id, cycle_id: cyc.id, status: 'interested' });
        if (error) throw error;
      }
      return json(200, { ok: true, cycle_id: cyc.id });
    }

    if (action === 'record_agreement') {
      await recordAcceptances(p.id, [{ doc: String(body.doc), version: String(body.version) }],
        String(body.source ?? 'welcome_back').slice(0, 30));
      return json(200, { ok: true });
    }

    return json(400, { error: 'unknown action' });
  } catch (e) {
    console.error('complete-signup', action, e);
    return json(500, { error: 'server error', detail: String(e).slice(0, 300) });
  }
});
