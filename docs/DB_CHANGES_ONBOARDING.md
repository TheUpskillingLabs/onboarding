# SQL migrations — onboarding redesign (2026-07, revision 2)

**Status: DRAFT — for review. Nothing here has been run.**

Target: the shared Supabase DB (schema snapshot 2026-07-06 = OLOS migrations through
00032). Written as five forward-only migration files in OLOS's numbering, **00054–00058** (renumbered 2026-07-06: OLOS's dev branch was already at 00053 — the public main branch, audited earlier, stops at 00032).
Supersedes revision 1 of this document.

What this revision folds in (the full set of owner decisions from the build):

- One `participants` table for users of all types — **no new users table** (`auth.users`
  = identity, `participants` = profile).
- Users hold multiple roles, move between them over time, and belong to multiple cycles.
- **Tiered signup:** events-only members give name/zip + how-they-heard ONLY — no
  agreements, no background questions → all intake columns stay nullable.
- **Registration stops at the commitment screen:** tapping Begin registration records
  interest — no problem-statement questions, no in-flow signature. → enrollment status
  `'interested'`; `cycle_agreements` fills at a later, separate ceremony.
- Two signup documents (Guidelines, then Participation Agreement) + the Mentor
  Agreement at mentor publish — each versioned, separately accepted.
- One optional marketing opt-in (`contact_consent`).
- Every path ends on a thank-you + welcome-summary email → `email_log`.
- **Admin:** create/revoke roles for users; see complete profiles; **super-admin
  (owner) delete** that erases everything about a user, behind a warning.

---

## 00054_participant_roles.sql

```sql
-- Unified temporal roles: replaces role_intents-as-truth (no history),
-- user_roles (staff only), moderator_assignments (poderator only).
-- A role is active while revoked_at IS NULL. Moving upskiller → volunteer →
-- upskiller again = three rows; nothing is ever overwritten.

CREATE TABLE IF NOT EXISTS participant_roles (
  id              serial PRIMARY KEY,
  participant_id  integer NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  role            varchar NOT NULL CHECK (role IN (
                    -- member roles (self-chosen at signup / welcome-back / admin-granted)
                    'upskiller','volunteer','mentor','events',
                    -- operational roles (granted; 'owner' = super admin)
                    'poderator','admin','owner','observer','developer')),
  cycle_id        integer REFERENCES cycles(id),   -- scope where relevant (poderator)
  pod_id          integer REFERENCES pods(id),     -- scope for poderator assignments
  granted_by      integer REFERENCES participants(id),  -- NULL = self-selected at signup
  granted_at      timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz,
  revoked_by      integer REFERENCES participants(id),
  note            text
);
CREATE INDEX IF NOT EXISTS idx_proles_active ON participant_roles (participant_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_proles_role   ON participant_roles (role) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_proles_active ON participant_roles
  (participant_id, role, COALESCE(cycle_id,0), COALESCE(pod_id,0)) WHERE revoked_at IS NULL;

-- Backfill: role_intents ('cycle' → 'upskiller'), staff roles, poderator assignments.
INSERT INTO participant_roles (participant_id, role, granted_at)
SELECT p.id, CASE r WHEN 'cycle' THEN 'upskiller' ELSE r END, p.created_at
FROM participants p, unnest(p.role_intents) AS r
ON CONFLICT DO NOTHING;

INSERT INTO participant_roles (participant_id, role, granted_by, granted_at, revoked_at)
SELECT participant_id, role, granted_by, granted_at, revoked_at FROM user_roles
ON CONFLICT DO NOTHING;

INSERT INTO participant_roles (participant_id, role, cycle_id, pod_id, granted_at, revoked_at)
SELECT participant_id, 'poderator', cycle_id, pod_id, assigned_at, removed_at
FROM moderator_assignments
ON CONFLICT DO NOTHING;

-- RLS: members read their own roles; admins read/write all (see 00058 for the
-- is_admin()/is_owner() helpers this depends on — apply 00058's helpers first
-- if enabling RLS in the same deploy).
ALTER TABLE participant_roles ENABLE ROW LEVEL SECURITY;
```

Notes: `user_roles`, `moderator_assignments`, and `role_intents` are NOT dropped here —
OLOS reads them (14 / 11 / 3 files). Dual-write until OLOS's reads migrate, then drop in
a later cleanup migration. `role_intents` stays as the immutable signup-time answer.
"Active upskiller" for gating should derive from `cycle_enrollments.status`; the role
row records identity/intent.

## 00055_agreement_acceptances.sql

```sql
-- Three versioned documents, separately accepted (Guidelines → Participation
-- Agreement at signup; Mentor Agreement at mentor publish). Events-only signups
-- accept NOTHING — zero rows is a valid state.
-- Version strings come from tools/build-agreements.js (e.g. 'vpa-2026-07-v1');
-- a version bump re-presents the document: the check is "row exists for
-- (participant, doc, CURRENT version)".

CREATE TABLE IF NOT EXISTS agreement_acceptances (
  id              serial PRIMARY KEY,
  participant_id  integer NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  doc             varchar NOT NULL CHECK (doc IN ('participation','guidelines','mentor')),
  version         varchar NOT NULL,
  accepted_at     timestamptz NOT NULL DEFAULT now(),
  source          varchar NOT NULL DEFAULT 'signup'
                  CHECK (source IN ('signup','mentor_flow','welcome_back','re_acceptance'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_agree ON agreement_acceptances (participant_id, doc, version);

-- Backfill from the single-document columns 00031 added.
INSERT INTO agreement_acceptances (participant_id, doc, version, accepted_at)
SELECT id, 'participation', agreement_version, agreement_accepted_at
FROM participants
WHERE agreement_version IS NOT NULL AND agreement_accepted_at IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE agreement_acceptances ENABLE ROW LEVEL SECURITY;
-- participants.agreement_version / agreement_accepted_at: keep until OLOS's 6
-- reader files migrate, then drop in the cleanup migration.
```

`cycle_agreements` is untouched — it stays the home of the Open Cycle Agreement
signature, which now happens at a later ceremony, not during onboarding.

## 00056_intake_and_interest.sql

```sql
-- New intake columns (all nullable — events-only signups skip every one of them)
-- + created_via (which door they came through) + the enrollment 'interested' state.

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS years_experience varchar CHECK (years_experience IS NULL OR years_experience IN
    ('just starting out','1-4','5-9','10-19','20+','prefer not to answer')),
  ADD COLUMN IF NOT EXISTS education_level varchar CHECK (education_level IS NULL OR education_level IN
    ('high school or GED','some college','associate degree','bachelors degree',
     'graduate degree','trade or technical certification','prefer not to answer')),
  ADD COLUMN IF NOT EXISTS sector_other varchar,
  ADD COLUMN IF NOT EXISTS created_via varchar NOT NULL DEFAULT 'unknown'
    CHECK (created_via IN ('onboarding_app','invitation','admin','import','unknown'));

-- Existing rows predate the onboarding app:
UPDATE participants SET created_via = 'import' WHERE created_via = 'unknown';

-- Registration stops at the commitment screen (owner decision): Begin
-- registration records INTEREST. Formalize the status vocabulary on
-- cycle_enrollments (constrained by 00037_schema_hardening on dev):
-- 00037_schema_hardening already constrains status to ('inactive','active',
-- 'revoked','stepped_back'); this EXTENDS it — the union, never dropping
-- 'revoked' (the revocation flow writes it):
ALTER TABLE cycle_enrollments DROP CONSTRAINT IF EXISTS cycle_enrollments_status_check;
ALTER TABLE cycle_enrollments ADD CONSTRAINT cycle_enrollments_status_check
  CHECK (status IN ('interested','active','inactive','revoked','stepped_back','completed')) NOT VALID;
-- ⚠ Verify no other status values exist before promoting to prod:
--   SELECT DISTINCT status FROM cycle_enrollments;

-- The flow's write: Begin registration →
--   INSERT INTO cycle_enrollments (participant_id, cycle_id, status) VALUES (:p, :c, 'interested')
-- The later ceremony (questions + Open Cycle Agreement signature) flips it to
-- 'active' and inserts the cycle_agreements row.
```

Already present and reused as-is: `sector`, `linkedin`, `work_situation`, `zip`,
`metro_slug`, `source` (hearAbout), `referred_by`.

## 00057_email_log_and_consent.sql

```sql
-- The welcome-summary email's audit trail (every path ends on the thank-you,
-- which promises this email).
CREATE TABLE IF NOT EXISTS email_log (
  id              serial PRIMARY KEY,
  participant_id  integer REFERENCES participants(id) ON DELETE CASCADE,
  kind            varchar NOT NULL,           -- 'welcome_summary' | future kinds
  to_email        varchar NOT NULL,
  subject         text NOT NULL,
  payload         jsonb,                      -- the summary rows as sent
  sent_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_log_participant ON email_log (participant_id, kind);
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- Consent consolidation: contact_consent (DEFAULT false — a genuine opt-in) is
-- the single marketing permission. photo_video_consent stays (different purpose).
COMMENT ON COLUMN participants.text_updates  IS 'LEGACY — superseded by contact_consent (2026-07)';
COMMENT ON COLUMN participants.email_updates IS 'LEGACY — superseded by contact_consent (2026-07)';
COMMENT ON COLUMN participants.comms_consent IS 'LEGACY — superseded by contact_consent (2026-07)';
-- Optional one-time reconciliation — POLICY DECISION, needs legal sign-off;
-- skipping it is the conservative option:
-- UPDATE participants SET contact_consent = true
-- WHERE contact_consent = false AND (email_updates = true OR comms_consent = true);

COMMENT ON COLUMN participants.dcpl_card IS 'LEGACY intake (pre-2026-07 flow)';
COMMENT ON COLUMN participants.dcpl_info IS 'LEGACY intake (pre-2026-07 flow)';
COMMENT ON COLUMN participants.participation_commitment IS 'LEGACY intake (pre-2026-07 flow)';
COMMENT ON COLUMN participants.main_focus IS 'LEGACY intake (pre-2026-07 flow)';
```

## 00058_admin_roles_and_erasure.sql

```sql
-- Admin capabilities: role helpers for RLS, complete-profile read for admins,
-- and the super-admin (owner) delete that erases everything about a user.

-- Role helpers — SECURITY DEFINER so RLS policies can call them cheaply.
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM participant_roles pr
    JOIN participants p ON p.id = pr.participant_id
    WHERE p.auth_user_id = auth.uid()
      AND pr.role IN ('admin','owner') AND pr.revoked_at IS NULL);
$$;

CREATE OR REPLACE FUNCTION is_owner() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM participant_roles pr
    JOIN participants p ON p.id = pr.participant_id
    WHERE p.auth_user_id = auth.uid()
      AND pr.role = 'owner' AND pr.revoked_at IS NULL);
$$;

-- RLS policies for the new tables + admin complete-profile read.
CREATE POLICY proles_self_read  ON participant_roles FOR SELECT
  USING (participant_id = (SELECT id FROM participants WHERE auth_user_id = auth.uid()));
CREATE POLICY proles_admin_all  ON participant_roles FOR ALL USING (is_admin());
CREATE POLICY agree_self_read   ON agreement_acceptances FOR SELECT
  USING (participant_id = (SELECT id FROM participants WHERE auth_user_id = auth.uid()));
CREATE POLICY agree_admin_read  ON agreement_acceptances FOR SELECT USING (is_admin());
CREATE POLICY email_self_read   ON email_log FOR SELECT
  USING (participant_id = (SELECT id FROM participants WHERE auth_user_id = auth.uid()));
CREATE POLICY email_admin_read  ON email_log FOR SELECT USING (is_admin());
-- Admins see complete profiles (participants already has member-scoped policies
-- from 00020/00021 — this adds the admin lens):
CREATE POLICY participants_admin_read ON participants FOR SELECT USING (is_admin());

-- Email is identity, not profile (owner decision): members can NEVER change it —
-- not through any UPDATE policy — and admins can't either; owner (super admin)
-- only, via the function below. The trigger is the backstop that catches every
-- path, including future policies someone writes too loosely.
CREATE OR REPLACE FUNCTION guard_email_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email AND NOT is_owner() THEN
    RAISE EXCEPTION 'email changes are super-admin only';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_guard_email ON participants;
CREATE TRIGGER trg_guard_email BEFORE UPDATE OF email ON participants
  FOR EACH ROW EXECUTE FUNCTION guard_email_change();

-- The owner-gated change itself: updates the profile AND the identity together,
-- so sign-in follows the new address. Production should also trigger a
-- re-verification email to the new address before/with this change.
CREATE OR REPLACE FUNCTION change_participant_email(target_id integer, new_email varchar)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_auth uuid;
BEGIN
  IF NOT is_owner() THEN RAISE EXCEPTION 'change_participant_email: owner (super admin) only'; END IF;
  SELECT auth_user_id INTO target_auth FROM participants WHERE id = target_id;
  UPDATE participants SET email = new_email WHERE id = target_id;
  IF target_auth IS NOT NULL THEN UPDATE auth.users SET email = new_email WHERE id = target_auth; END IF;
END;
$$;
REVOKE ALL ON FUNCTION change_participant_email(integer, varchar) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION change_participant_email(integer, varchar) TO authenticated; -- gated inside by is_owner()

-- Minimal tombstone: enough to prove an erasure happened, nothing personal.
CREATE TABLE IF NOT EXISTS participant_erasures (
  id            serial PRIMARY KEY,
  erased_by     integer,                     -- owner's participant id (not FK — may outlive them)
  reason        varchar NOT NULL DEFAULT 'erasure_request',
  erased_at     timestamptz NOT NULL DEFAULT now()
);

-- The delete itself — OWNER ONLY, erases everything about the participant.
-- The onboarding-era tables cascade via their FKs; the pre-existing tables
-- (votes, logs, memberships …) have plain FKs, so they're deleted explicitly.
CREATE OR REPLACE FUNCTION delete_participant(target_id integer, why varchar DEFAULT 'erasure_request')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_auth uuid;
BEGIN
  IF NOT is_owner() THEN RAISE EXCEPTION 'delete_participant: owner (super admin) only'; END IF;
  SELECT auth_user_id INTO target_auth FROM participants WHERE id = target_id;

  -- Tables added by dev migrations 00033–00053 (audited 2026-07-06):
  DELETE FROM learning_logs           WHERE participant_id = target_id;
  DELETE FROM profile_updates         WHERE participant_id = target_id;
  DELETE FROM event_rsvps             WHERE participant_id = target_id;  -- rows hold contact PII → delete
  UPDATE survey_responses SET participant_id = NULL, submitter_name = NULL,
    submitter_email = NULL, submitter_phone = NULL, contactable = false
    WHERE participant_id = target_id;  -- observations are commons data → detach + strip ALL contact PII
  DELETE FROM testers WHERE email = (SELECT email FROM participants WHERE id = target_id);
  UPDATE testers SET granted_by = NULL WHERE granted_by = target_id;
  -- saved_items cascades via its FK. The pre-existing tables:
  DELETE FROM nudge_dismissals        WHERE moderator_participant_id = target_id;
  DELETE FROM moderator_ui_state      WHERE participant_id = target_id;
  DELETE FROM feedback_attachments    WHERE feedback_id IN (SELECT id FROM feedback WHERE participant_id = target_id);
  DELETE FROM feedback                WHERE participant_id = target_id;
  DELETE FROM nominations             WHERE participant_id = target_id;
  DELETE FROM pulse_checks            WHERE participant_id = target_id;
  DELETE FROM project_memberships     WHERE participant_id = target_id;
  DELETE FROM project_votes           WHERE voter_id = target_id;
  DELETE FROM votes                   WHERE voter_id = target_id;
  DELETE FROM pod_memberships         WHERE participant_id = target_id;
  DELETE FROM moderator_assignments   WHERE participant_id = target_id;
  DELETE FROM cycle_enrollments       WHERE participant_id = target_id;
  DELETE FROM cycle_agreements        WHERE participant_id = target_id;
  DELETE FROM access_revocations      WHERE participant_id = target_id;
  DELETE FROM participant_permissions WHERE participant_id = target_id;
  DELETE FROM participant_options     WHERE participant_id = target_id;
  DELETE FROM user_roles              WHERE participant_id = target_id;
  -- participant_roles / agreement_acceptances / email_log cascade via FK.
  -- Authored content that the commons keeps (problem_statements,
  -- solution_proposals) is DETACHED, not deleted — POLICY DECISION, see note.
  UPDATE problem_statements  SET participant_id = NULL WHERE participant_id = target_id;
  UPDATE solution_proposals  SET participant_id = NULL WHERE participant_id = target_id;

  DELETE FROM participants WHERE id = target_id;
  IF target_auth IS NOT NULL THEN DELETE FROM auth.users WHERE id = target_auth; END IF;

  INSERT INTO participant_erasures (erased_by, reason)
  VALUES ((SELECT id FROM participants WHERE auth_user_id = auth.uid()), why);
END;
$$;
REVOKE ALL ON FUNCTION delete_participant(integer, varchar) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_participant(integer, varchar) TO authenticated; -- gated inside by is_owner()
```

⚠ Two policy decisions inside 00058 need sign-off before it runs:
1. **Authored commons content** (problem statements, proposals) is detached
   (author set NULL) rather than deleted — matches "contributions returned to the
   commons stay in the commons." If legal wants full deletion, change the two
   UPDATEs to DELETEs — but `problem_statements` is referenced by pods/votes, so
   full deletion cascades much further. Requires `participant_id` to be nullable
   on both tables (it is NOT today): `ALTER TABLE problem_statements ALTER COLUMN
   participant_id DROP NOT NULL;` (same for solution_proposals) — include if
   detach is chosen.
2. Deleting `auth.users` signs the person out everywhere and destroys the Google
   link — intended for erasure, but confirm Supabase project settings don't
   resurrect the row on next OAuth login (they'll get a fresh, blank account —
   which is correct behavior for "deleted").

---

## Flow → schema map (every write the redesigned app makes)

| Flow moment | Write |
|---|---|
| Continue with Google | `auth.users` → `participants` (google_id, email, **created_via='onboarding_app'**) |
| Role intent / welcome-back change | `participants.role_intents` (as asked, immutable) + `participant_roles` insert/revoke |
| Who you are / zip | `participants.first_name/last_name/zip/metro_slug` |
| Background questions *(skipped for events-only)* | `work_situation/sector/sector_other/years_experience/education_level/linkedin` |
| How did you hear | `source` / `referred_by` |
| Guidelines agree → Participation agree *(skipped for events-only)* | 2 × `agreement_acceptances` rows |
| Contact opt-in | `contact_consent` |
| Commitment screen → Begin registration | `cycle_enrollments` (status **'interested'**) |
| Later ceremony (outside onboarding) | `cycle_enrollments` → 'active' + `cycle_agreements` row |
| Thank-you (every path) | `email_log` ('welcome_summary') + the send |
| Mentor publish | mentor profile fields + `agreement_acceptances` ('mentor') + `participant_roles` mentor row |
| Admin: grant/revoke role | `participant_roles` (granted_by / revoked_by set) |
| Super admin: change email | `change_participant_email()` — participants + auth.users together; blocked for everyone else by the `trg_guard_email` trigger |
| Admin: complete profile view | reads via `participants_admin_read` + admin policies |
| Super admin: delete user | `delete_participant()` — cascades everything, tombstone row |

## Coexistence — these tables are shared with OLOS

OLOS (checked at main, 2026-07-06) has none of these objects; its readers:
`user_roles` **14 files** · `moderator_assignments` **11** · `agreement_version` **6** ·
`contact_consent` **5** · `role_intents` **3** · `text_updates` **2** ·
`email_updates`/`comms_consent` **0**.

- 00033–00036 are additive — OLOS keeps working untouched. (One-time grep for
  positional `INSERT INTO participants VALUES` first; any added column breaks those.)
- Dual-write window: while OLOS reads `user_roles`/`moderator_assignments`, the
  onboarding app writes both those AND `participant_roles`.
- The eventual drops (`user_roles`, `moderator_assignments`, old agreement columns,
  legacy intake/consent columns) are a separate migration, run only after OLOS's
  reads migrate and both codebases grep clean.
- The `cycle_enrollments` status CHECK in 00056 is the one 00033–00036 change that
  can bite OLOS — if OLOS writes a status outside the list, extend the list.
  Verify with the DISTINCT query before applying.

## Sync policy — onboarding ↔ OLOS (dev + prod), until integration

One owner per shared thing; integration becomes a cutover, not a reconciliation.

| Shared thing | Owner | The rule |
|---|---|---|
| **Schema / migrations** | **OLOS repo** | These 00033–00037 files land in OLOS's `supabase/migrations/` (they're numbered for it). Apply to **dev first**, test with onboarding pointed at dev, then promote to prod. The onboarding repo never runs its own migrations — this doc is design, not a second migration stream. |
| **Agreement docs + versions** | **onboarding repo** | `docs/agreements/*.md` + the version strings in `tools/build-agreements.js` are the single source. The DB stores accepted version strings; OLOS renders from the same generated `agreements.js` when it integrates. Never fork the version strings. |
| **Email templates** | one owner per email TYPE | Welcome/update summary → the Edge Function only. OLOS's five templates → `lib/email` only. Routes are disjoint, so no double-send. Integration = move the template into `lib/email`, retire the function. |
| **Environments** | mirrored pair | Onboarding gets a dev/prod config (Supabase URL + function endpoint per env) matching OLOS's two Supabase projects. Everything tests against OLOS-dev; going to prod is two URLs. |
| **Data contracts** | this doc | `created_via` values, enrollment status vocabulary ('interested' …), role names, agreement doc keys. Change them here first, then in code — both codebases read this table. |

**End-state:** the funnel ports into OLOS's Next.js (per docs/HANDOFF.md) and the static
app retires. Because both sides shared the same DB, version strings, and email semantics
throughout, cutover is a routing change, not a data migration.

## Run order

1. 00054 (roles + backfill) — additive
2. 00055 (agreements + backfill) — additive
3. 00056 (intake, created_via, interest status) — additive; verify the DISTINCT statuses first
4. 00057 (email_log, consent comments) — additive
5. 00058 (helpers, RLS policies, erasure) — after legal signs off on the two ⚠ decisions
6. Point the onboarding app's writes at the new tables (dual-writing roles)
7. Migrate OLOS's reads → cleanup migration with the drops (last, together)
