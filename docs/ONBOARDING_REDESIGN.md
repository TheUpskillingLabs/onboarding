# Onboarding redesign — LOCKED SPEC (walked through with HQ, 2026-07-06)

**Goals:** capture better data · stronger role branching · mobile-first (one question per
screen, unchanged flow engine). Supersedes proposal v1. DB refactor deferred — fields map
1:1 to future columns (§4).

---

## The flow

| # | Screen | Type | Notes |
|---|--------|------|-------|
| 1 | **Welcome + Google** | view-google-auth | New copy: eyebrow "Join The Labs", H1 "You're in the right place.", observer-friendly lede ("look around, follow the work, show up to an event — go deeper whenever you're ready"), Google explained as the painless path. Footnote "We only see your name and email. That's it." |
| 2 | **What brings you here?** | view-role-intent | Copy unchanged from current build. Selectors become **square checks** (multi-select affordance — circles read as radios). |
| 3 | Signing up as | info | unchanged (email from Google) |
| 4 | Tell us who you are | fields | unchanged (first · last · zip → lab) |
| 5 | What best describes you right now? | choice | unchanged (has Prefer not to say) |
| 6 ● | What field do you mostly work in? | choice | Technology · Healthcare · Education · Government & public sector · Nonprofit & community · Business & finance · Creative & media · Trades & manufacturing · Retail & service · Something else (fill-in) · Prefer not to answer |
| 7 ● | How many years have you been working? | choice | Just starting out · 1–4 · 5–9 · 10–19 · 20+ · Prefer not to answer |
| 8 ● | Highest level of education | choice | HS/GED · Some college · Associate · Bachelor's · Graduate · Trade/technical cert · Prefer not to answer. Footnote: "No credentials required here — this just helps us understand who we're serving." |
| 9 ● | LinkedIn | text | optional, skippable |
| 10 | How did you hear about The Labs? | choice+followUp | unchanged, moves to last-question slot |
| 11 ● | **Participation Agreement** | agreement | full doc (`docs/agreements/The_Upskilling_Labs_Volunteer_Participant_Agreement.md`), scroll-gated, own agree act, records `{doc, version, at}` |
| 12 ● | **Volunteer Guidelines** | agreement | full doc (`…Volunteer_Guidelines.md`), same treatment. Everyone sees both. |
| 13 ● | Keep me posted | consent (optional) | contact opt-in is OPTIONAL (compliance + voice), final button **Become an Upskiller** |

**Best-practice note (HQ asked):** one doc per screen, separate affirmative act per doc —
stronger clickwrap evidence, per-doc version/timestamp, better mobile reading. Legal
once-over recommended.

## The ending (after Become an Upskiller)

Everyone — regardless of roles picked — flows into the cycle pitch:

1. ● **Cycle intro (new beat):** "YOUR ACCOUNT IS READY ✓ / This season: Civics & Elections."
   — short description of the current cycle.
2. Threshold beat 1 — "Thirteen weeks from now, you'll have built something real." (existing ts1)
3. Threshold beat 2 — "Here's the deal." commitments (existing ts2) → **Begin registration**
   enters cycle registration (questions + Open Cycle Agreement signature, unchanged).

"Not now — stay a member, browse the free events" appears on **all three** screens → dashboard.
Onboarding ends here. Mentor/volunteer setup never chains — deferred roles become dashboard
todos. Existing gate-return and pending-waitlist branches keep priority over the pitch.

## Mentor Agreement

`docs/agreements/Volunteer Mentor Agreement.md` becomes the final scroll-gated step of the
**mentor flow**, before "Publish mentor profile" (ceremony after intent — signed at the seam
where it applies, not during signup).

## Data → future DB mapping

| Field | userState | Future home |
|---|---|---|
| work status | answers.work | participants.work_status |
| sector (+fill-in) | answers.sector / sectorOther | participants.sector |
| years experience | answers.yearsExp | participants.years_experience |
| education | answers.education | participants.education_level |
| linkedin | answers.linkedin | participants.linkedin_url |
| referral | referral{source,by} | participants.referral_source / referred_by |
| agreements ● | agreements[] {doc, version, at} | agreement_acceptances (one row per doc) |
| contact opt-in ● | contactOptIn (bool) | participants.contact_opt_in |
| mentor agreement ● | agreements[] entry | agreement_acceptances |

## Additions (walked through after the lock — all BUILT)

- **Thank-you close:** onboarding ends on `view-thankyou` either way — decline at the
  threshold goes straight there; signing shows it via "Finish up" on the confirmation.
  The screen lists everything signed up for (account, roles, documents+versions, cycle
  status, contact prefs).
- **Welcome-summary email:** simulated outbox row (`userState.emails[]`) carrying the same
  summary — production sends a transactional email at this moment. Visible in Admin →
  Signups → detail.
- **Contact permission:** one optional checkbox, original wording ("Yes, I'd like to
  receive updates, newsletters, and invites…"), on the final flow step.
- **Returning members:** hitting Join with an account → `view-welcome-back` (what's on
  file) → change roles (preselected multi-select; only NEW role flows run) or edit
  details (prefilled; accepted agreement versions skip via `step.when`).
- **Admin → Signups:** metrics strip, signups table (live row from
  `olos.userState.v1`/`olos.session.v1` + mock roster), per-signup detail modal
  (intake, agreement versions, welcome email), admin grant/revoke.
- **agreements.js** (GENERATED): `node tools/build-agreements.js` converts
  `docs/agreements/*.md` → `window.AGREEMENTS` (title/version/html per doc). Bump
  versions in the tool when substance changes; members re-see changed docs.

## Decisions log

- Contact opt-in is optional, lives on the final screen — NOT on the welcome screen, NOT
  required (forced marketing consent = compliance smell).
- Questions first, paperwork last (matches "ceremony after intent").
- Work status stays ahead of the new questions.
- Role-intent copy stays as-is; no "Just exploring" option (proposed, declined).
- Guidelines doc is long (~13KB) — accepted; the scroll-gate stands.
