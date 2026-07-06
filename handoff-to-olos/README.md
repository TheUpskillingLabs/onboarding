# Handoff to OLOS — onboarding schema changes

Generated from `docs/DB_CHANGES_ONBOARDING.md` (rev 2). Per the sync policy, **OLOS owns
the schema**: these files belong in OLOS's `supabase/migrations/`, never run from this repo.

## Apply to DEV (first time, by hand)

```bash
# 0. copy the files over
cp handoff-to-olos/migrations/000*.sql  ../OLOS/supabase/migrations/

cd ../OLOS

# 1. sanity: local files vs what dev has applied (expect remote = 00001–00032)
supabase link --project-ref <DEV_PROJECT_REF>
supabase migration list

# 2. pre-checks the doc flags
#    - existing enrollment statuses must be covered by 00035's CHECK:
#      run in the dev SQL editor:  SELECT DISTINCT status FROM cycle_enrollments;
#    - grep OLOS for positional inserts (breaks on any added column):
#      grep -rn "INSERT INTO participants VALUES" app lib

# 3. dry run, then apply
supabase db push --dry-run
supabase db push

# 4. verify
supabase migration list        # remote now shows through 00037
```

**Hold 00037 if legal hasn't signed off** on its two flagged decisions (commons-content
detach-vs-delete, auth.users deletion) — just don't copy that file yet; 00033–00036 are
additive and safe alone. Note: the new tables have RLS enabled with policies arriving in
00037, so until it lands only service-role access touches them (fine — nothing reads them
yet).

## Promote to PROD

Same files, other project:

```bash
supabase link --project-ref <PROD_PROJECT_REF>
supabase db push --dry-run && supabase db push
```

## Automate it (recommended after the first manual pass)

Copy `workflows/supabase-migrations.yml` into OLOS's `.github/workflows/` and add the
five repo secrets it names. From then on: migrations merged to `develop` hit dev,
merged to `main` hit prod. Set the `production` GitHub environment to require manual
approval if you want a human gate before prod applies.

## Rules that keep dev/prod in sync

- Never edit an applied migration file — write a new one.
- Never change schema through the dashboard UI — if it happens, `supabase db diff`
  the drift back into a numbered file.
- Dev first, always; prod gets the identical files.
