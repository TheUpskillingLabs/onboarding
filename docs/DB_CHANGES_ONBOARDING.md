# DB migration — onboarding redesign (2026-07)

**Status: DRAFT — for review. Nothing here has been run.**

Target: the existing Supabase schema (`schema.mssql` snapshot, 2026-07-06).
Source of the requirements: the redesigned onboarding flow (docs/ONBOARDING_REDESIGN.md)
plus three owner decisions: one table for users of all types · users hold multiple roles
and move between them over time · users belong to multiple cycles.

**No new users table.** `auth.users` stays identity, `participants` stays the single
profile table for every type of person. `cycle_enrollments` already covers multi-cycle.
Everything below is satellite tables + columns.

---

## 1 · Unified temporal roles — `participant_roles`

Replaces the three half-systems: `role_intents` array (no history), `user_roles`
(staff only), `moderator_assignments` (Poderator only). A role is active while
`revoked_at IS NULL`; "upskiller → volunteer → upskiller again" is three rows,
nothing overwritten, full history for free.

```sql
CREATE TABLE public.participant_roles (
  id              serial PRIMARY KEY,
  participant_id  integer NOT NULL REFERENCES public.participants(id),
  role            varchar NOT NULL CHECK (role IN (
                    -- member roles (self-chosen at signup / welcome-back)
                    'upskiller','volunteer','mentor','events',
                    -- operational roles (granted)
                    'poderator','admin','owner','observer','developer')),
  cycle_id        integer REFERENCES public.cycles(id),  -- scope, where relevant (e.g. poderator)
  pod_id          integer REFERENCES public.pods(id),    -- scope for poderator assignments
  granted_by      integer REFERENCES public.participants(id),  -- NULL = self-selected
  granted_at      timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz,
  note            text
);
CREATE INDEX idx_proles_active ON public.participant_roles (participant_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_proles_role   ON public.participant_roles (role) WHERE revoked_at IS NULL;
-- one ACTIVE row per (participant, role, scope); re-granting after revoke is a new row
CREATE UNIQUE INDEX uq_proles_active ON public.participant_roles
  (participant_id, role, COALESCE(cycle_id,0), COALESCE(pod_id,0)) WHERE revoked_at IS NULL;
```

**Backfill**

```sql
-- from role_intents (self-selected; 'cycle' intent maps to 'upskiller')
INSERT INTO participant_roles (participant_id, role, granted_at)
SELECT id, CASE r WHEN 'cycle' THEN 'upskiller' ELSE r END, created_at
FROM participants, unnest(role_intents) AS r;

-- from user_roles (staff, keeps revocation history)
INSERT INTO participant_roles (participant_id, role, granted_by, granted_at, revoked_at)
SELECT participant_id, role, granted_by, granted_at, revoked_at FROM user_roles;

-- from moderator_assignments (poderator, pod/cycle-scoped)
INSERT INTO participant_roles (participant_id, role, cycle_id, pod_id, granted_at, revoked_at)
SELECT participant_id, 'poderator', cycle_id, pod_id, assigned_at, removed_at
FROM moderator_assignments;
```

**Deprecation (later, once app code reads participant_roles):** drop `user_roles`;
keep `moderator_assignments` only if pod tooling depends on it, else migrate reads and
drop; keep `participants.role_intents` as the immutable signup-time answer (rename to
`signup_role_intents` for clarity), or drop it once analytics don't need it.

**Design note — "upskiller":** an ACTIVE upskiller is better derived from
`cycle_enrollments.status='active'` (truth), while the `participant_roles` row records
intent/identity ("I'm here to build"). Decide which the app treats as canonical; the
recommendation is enrollments for gating, roles for display.

## 2 · Multi-document agreements — `agreement_acceptances`

The flow signs three documents with independent versions; the current
`participants.agreement_version / agreement_accepted_at` pair holds one. Mirrors the
prototype's `userState.agreements` `{doc, version, at}` exactly.

```sql
CREATE TABLE public.agreement_acceptances (
  id              serial PRIMARY KEY,
  participant_id  integer NOT NULL REFERENCES public.participants(id),
  doc             varchar NOT NULL CHECK (doc IN ('participation','guidelines','mentor')),
  version         varchar NOT NULL,          -- e.g. 'vpa-2026-07-v1' (tools/build-agreements.js)
  accepted_at     timestamptz NOT NULL DEFAULT now(),
  source          varchar DEFAULT 'signup'   -- signup | mentor_flow | re_acceptance
);
-- accepting a NEW version is a new row; history preserved
CREATE UNIQUE INDEX uq_agree ON public.agreement_acceptances (participant_id, doc, version);
```

**Backfill + deprecation**

```sql
INSERT INTO agreement_acceptances (participant_id, doc, version, accepted_at)
SELECT id, 'participation', agreement_version, agreement_accepted_at
FROM participants WHERE agreement_version IS NOT NULL;
-- later: ALTER TABLE participants DROP COLUMN agreement_version, DROP COLUMN agreement_accepted_at;
```

`cycle_agreements` is untouched — it already matches the Open Cycle signature
(per-cycle, signature_name, version, answers jsonb).

**App rule:** a version bump in `tools/build-agreements.js` re-presents the document —
the check is "row exists for (participant, doc, CURRENT version)".

## 3 · New intake columns on `participants`

```sql
ALTER TABLE public.participants
  ADD COLUMN years_experience varchar CHECK (years_experience IN
    ('just starting out','1-4','5-9','10-19','20+','prefer not to answer')),
  ADD COLUMN education_level varchar CHECK (education_level IN
    ('high school or GED','some college','associate degree','bachelors degree',
     'graduate degree','trade or technical certification','prefer not to answer')),
  ADD COLUMN sector_other varchar,   -- fill-in when sector = 'Something else'
  ADD COLUMN created_via varchar NOT NULL DEFAULT 'unknown' CHECK (created_via IN
    ('onboarding_app','invitation','admin','import','unknown'));  -- which door they came through

-- Backfill existing rows so 'unknown' only ever means genuinely unknown:
UPDATE participants SET created_via = 'import' WHERE created_via = 'unknown';
-- (adjust: rows that arrived via invitations can be inferred from invitations.accepted_at + email match)
```

**`created_via` rule:** the onboarding app writes `'onboarding_app'` on every
participant row it creates; invitation acceptance writes `'invitation'`; admin-created
rows write `'admin'`. Immutable after insert — it records the door, not the journey
(role changes never touch it).

Already present, reused as-is: `sector`, `linkedin`, `work_situation` (option list
matches the flow), `zip`, `metro_slug`, `source` (hearAbout), `referred_by`.

## 4 · Consent consolidation

Five overlapping booleans exist: `text_updates`, `email_updates`, `comms_consent`,
`contact_consent`, `photo_video_consent`. The flow captures ONE optional marketing
opt-in ("updates, newsletters, and invites").

- **`contact_consent` becomes the single marketing opt-in.** Its `DEFAULT false` is
  correct — opt-in must be a choice, never presumed.
- `photo_video_consent` stays (different consent, different purpose — events).
- `text_updates`, `email_updates`, `comms_consent` → mark legacy now, drop after
  confirming nothing reads them:

```sql
COMMENT ON COLUMN public.participants.text_updates  IS 'LEGACY — superseded by contact_consent (2026-07)';
COMMENT ON COLUMN public.participants.email_updates IS 'LEGACY — superseded by contact_consent (2026-07)';
COMMENT ON COLUMN public.participants.comms_consent IS 'LEGACY — superseded by contact_consent (2026-07)';
-- optional one-time reconciliation before deprecating:
UPDATE participants SET contact_consent = true
WHERE contact_consent = false AND (email_updates = true OR comms_consent = true);
```

⚠️ The reconciliation UPDATE is a policy decision (treating old email_updates=true as
marketing consent) — legal should bless it; skipping it is the conservative option.

## 5 · Email audit — `email_log`

The thank-you screen promises a welcome-summary email; this is its audit trail
(mirrors the prototype's `userState.emails`).

```sql
CREATE TABLE public.email_log (
  id              serial PRIMARY KEY,
  participant_id  integer REFERENCES public.participants(id),
  kind            varchar NOT NULL,          -- 'welcome_summary' | future kinds
  to_email        varchar NOT NULL,
  subject         text NOT NULL,
  payload         jsonb,                     -- the summary rows as sent
  sent_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_log_participant ON public.email_log (participant_id, kind);
```

## 6 · Legacy intake columns — flag, don't drop yet

`dcpl_card`, `dcpl_info`, `participation_commitment`, `main_focus`,
`ai_tool_familiarity` look like an earlier intake's questions and aren't asked by the
new flow. Recommend `COMMENT ON COLUMN ... 'LEGACY intake (pre-2026-07 flow)'` now,
drop in a later cleanup once confirmed unread. `option_lists`/`participant_options`
can carry the new choice lists (sector, years, education) if you prefer DB-driven
options over app constants — either works; pick one and stay consistent.

---

## Flow → schema map (the writes the new onboarding makes)

| Flow moment | Write |
|---|---|
| Continue with Google (new) | `auth.users` row → `participants` row (google_id, email) |
| Role intent screen | `participants.role_intents` (as asked) + `participant_roles` rows (self, active) |
| Who you are / zip | `participants.first_name/last_name/zip/metro_slug` |
| Work · sector · years · education · LinkedIn | `participants.work_situation/sector/sector_other/years_experience/education_level/linkedin` |
| How did you hear | `participants.source/referred_by` |
| Participation Agreement agree | `agreement_acceptances` (doc='participation') |
| Volunteer Guidelines agree | `agreement_acceptances` (doc='guidelines') |
| Contact opt-in | `participants.contact_consent` |
| Cycle threshold → sign | `cycle_enrollments` (status active) + `cycle_agreements` row |
| Thank-you screen | `email_log` (kind='welcome_summary') + the actual send |
| Mentor flow publish | mentor profile fields + `agreement_acceptances` (doc='mentor') + `participant_roles` mentor row |
| Welcome-back role change | revoke/insert `participant_roles` rows |
| Admin grant/revoke | `participant_roles` (role='admin'), granted_by set |

## OLOS check (github.com/TheUpskillingLabs/OLOS, main @ 2026-07-06)

None of this doc's proposed objects exist in OLOS yet — no `participant_roles`,
`agreement_acceptances`, `email_log`, `created_via`, `years_experience`,
`education_level`, `sector_other` in its migrations (through 00032), app code, or
SCHEMA.md. Its newest migrations are the stage-1 funnel port: 00031 added
zip/metro_slug/role_intents/referred_by + the single agreement_version/accepted_at pair
(which §2 here supersedes), 00032 added cycle_agreements (kept as-is). The uploaded
schema snapshot matches OLOS's migration state — they're the same database.

What OLOS's app code actively reads (grep of app/ + lib/, file counts):
`user_roles` **14 files** · `moderator_assignments` **11** · `agreement_version` **6** ·
`contact_consent` **5** · `role_intents` **3** · `text_updates` **2** ·
`email_updates` / `comms_consent` **0** (safe to drop early).
So the §7 drops and the §1/§2 read-migrations touch real OLOS code — the dual-write
window below is not optional. Next migration number: **00033**.

## Coexistence — these tables are shared with another app

Assessment of every change against an app that reads/writes the same tables today:

**Safe immediately (purely additive — the other app never sees them):**
§1 `participant_roles` (new table), §2 `agreement_acceptances` (new table),
§5 `email_log` (new table), §3 new columns (nullable or defaulted — `SELECT *` keeps
working; INSERTs keep working because every new column has a default or allows NULL).
`COMMENT ON` changes are metadata only.

**Needs coordination (semantic changes to data the other app may read):**
- §4 consent reconciliation UPDATE — flips `contact_consent` values the other app might
  display or act on. Run only after both teams agree on the meaning.
- §1 backfill makes `participant_roles` the truth while the other app still reads
  `user_roles` / `moderator_assignments` / `role_intents`. During the transition,
  **dual-write** (the onboarding app writes both old and new) or add compatibility
  views so both apps see consistent roles. Do NOT rename `role_intents` while the
  other app reads it.

**Breaking if run unilaterally (do last, together):**
- §7 drops: `user_roles`, `moderator_assignments`, the old agreement columns, legacy
  intake columns. Each drop breaks any query in the other app that touches them.
  Sequence: migrate the other app's reads → dual-write window → verify with
  `pg_stat_statements` (or grep both codebases) that nothing references the old
  objects → then drop, in its own migration.

One more compatibility trap: if the other app does `INSERT INTO participants` without
column lists (`INSERT ... VALUES` positionally), ANY added column breaks it — rare, but
worth a one-time grep before step 3.

## Suggested run order

1. §1 create + backfill `participant_roles` (additive, safe)
2. §2 create + backfill `agreement_acceptances` (additive, safe)
3. §3 new columns (additive, safe)
4. §5 `email_log` (additive, safe)
5. Point app reads/writes at the new tables
6. §4 consent reconciliation (after legal review)
7. §6 + deprecations: drop `user_roles`, old agreement columns, legacy intake (last, separate migration)

Steps 1–4 are pure additions — the running app keeps working throughout. RLS: new
tables need policies matching your existing pattern (participants read own rows;
admin role reads all) — write these alongside step 5.
