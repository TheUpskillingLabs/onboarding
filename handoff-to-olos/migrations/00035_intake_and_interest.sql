-- 00035_intake_and_interest.sql — onboarding redesign (generated from docs/DB_CHANGES_ONBOARDING.md rev 2)
-- Copy into OLOS's supabase/migrations/ — see handoff-to-olos/README.md

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
-- cycle_enrollments (it's an unconstrained varchar today):
ALTER TABLE cycle_enrollments DROP CONSTRAINT IF EXISTS cycle_enrollments_status_check;
ALTER TABLE cycle_enrollments ADD CONSTRAINT cycle_enrollments_status_check
  CHECK (status IN ('interested','active','inactive','stepped_back','completed'));
-- ⚠ Verify existing status values first:
--   SELECT DISTINCT status FROM cycle_enrollments;
-- and extend the list above to cover them before applying.

-- The flow's write: Begin registration →
--   INSERT INTO cycle_enrollments (participant_id, cycle_id, status) VALUES (:p, :c, 'interested')
-- The later ceremony (questions + Open Cycle Agreement signature) flips it to
-- 'active' and inserts the cycle_agreements row.
