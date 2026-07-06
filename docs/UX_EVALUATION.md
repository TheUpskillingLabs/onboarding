# UX Personas & Evaluation Plan — The Upskilling Labs prototype

**What this is:** the working instrument for evaluating the prototype's UX. Part 1 maps the
app and names the rules it must be judged against. Part 2 defines the personas. Part 3 holds
their user stories with acceptance criteria (each ID'd so findings can cite them). Part 4 is
the evaluation method — how every story gets driven, scored, and turned into a ranked fix
backlog. Part 5 is a moderated-test kit the team can run with real people.

**The bar:** top-tier UX. Not "no bugs" — every moment lands in its intended register, every
persona completes their stories without friction they'd remember, and the app's own design
principles hold everywhere.

---

## 1. The app, mapped

### 1.1 Journey inventory

| Stage | Surfaces | Key mechanics | Intended register |
|---|---|---|---|
| **Discover (public)** | Landing (hero → spotlights → cycles → workshops → library → labs — two-state: one active lab + open waitlists, public metro search inline), the generated content pages (`events/{slug}/`, `library/{slug}/`, `labs/{slug}/` + directory indexes), `stories.html`, About | No gated browse; **every card is a teaser opening the item's real page** (shareable URL, breadcrumb, "more like this", signed-out upsell); story deep links; commons whispers; waitlist joins are city-first (commit the city, then the account ask) | Light, warm, zero pressure |
| **Contribute (public)** | Survey flow (`?survey=` deep link), event RSVP modal | No account needed anywhere; "add another" loop; share screen | Effortless, generous |
| **Join** | Google-auth explainer → role intent → 5-screen signup → Participant Agreement (scroll-gated) | `fields` steps, inline referral follow-up, silent zip→metro (active lab, or a join-the-waitlist nudge when no lab is near) | Quick, respectful — "give your name at the door" |
| **Commit** | Cycle threshold (dark cover, two beats: value → the deal) → registration questions → Open Cycle Agreement signature → signed confirmation (.ics, pod chooser) → committed dates + .ics findable anytime (cycle page "Your commitments" card, dashboard dated rows) | Value before terms, terms before effort; ceremony after intent; honest "Not now"; commitments never presented once and lost | **Weighty but warm — "sign a lease you understood"** |
| **Practice (weekly)** | Dashboard: setup checklist, Learning Log (sliders + blocked toggle + 3 prompts + share preview), todos | Unlimited logs; weekly hard gate (`logDueAt` lockout → instant unlock) | Light ritual; gate firm but never shaming |
| **Form (cycle)** | Cycle page: theme header, phase band + ⓘ modals, week rail, situations, proposals → ballot → tally → team registration; pod chooser | Phase-driven from `olos.cycleState.v1`; ballot locks on cast; ignition at `projectMin` | Legible momentum; ignition celebratory |
| **Build** | Team ignition interstitial, project canvas (frame/intervention/metrics/evidence, roster, mentor request) | Evidence-first mentor requests | Earned, real |
| **Connect** | Discover panel (events, library, directory, updates, labs — metro search, waitlist join/create), member profiles, follow, testimonials, nominations | Members-only profiles; requested-only testimonials; vouched pill; browse cards open the item's real page and back returns with session intact (`olos.session.v1`) | Trustworthy, earned |
| **Sensemake** | Survey pool → Triangulator iframe | `olos.surveyPool.v1` hand-off; concept-before-pool; unsaved-work guard | Focused, tool-like |
| **Shepherd** | `moderator.html`: frame journey, teams, compliance strip, needs-attention, themes, AI bundle, process signals, evaluations, feedback inbox, member drawer, roster | Blockers first; gate does the enforcing; faltering = R&D data | Calm, observational — never managerial |
| **Operate** | `admin.html`: Testing Controls (phases + log gate), cycle control, vote progress, invitations, participants, entity stub | Live cross-tab demo via `cycleState`; aggregates only | Instrumental, honest about being a demo driver |

### 1.2 The app's UX constitution (judge against these — they are owner decisions)

1. **Every seam gets a threshold** — flows never silently chain; close ✓ → name next → consent.
2. **Terms before effort, ceremony after intent** — commitment summary precedes questions; signature ends them.
3. **Any agreement is scroll-gated** — read to the end before agree/sign; "Read to the end ✓".
4. **Registration has gravity; account creation stays light.** "Not now" is always respectable.
5. **The weekly cadence has teeth** — the lockout gate is firm, instant to clear, and never shaming ("You're back in ✓").
6. **Evidence precedes assistance** — mentor requests carry tried/evidence/challenge.
7. **The Poderator is a shepherd, not a manager** — wide member latitude; faltering is process data, never a member record.
8. **Trust is earned, never default** — locked badges, requested-only testimonials, admin-granted vouching.
9. **The commons is whispered early, stated at the threshold, bound at the signature** — never sprung.
10. **Public browse is free** — no gated see-alls; survey and RSVP never require an account.
11. Design system: warm `--paper` only; dark reserved for covers/nav/ceremony; one radius; orb never raw under text; 16px+ inputs; `100dvh` shells; chrome switches at 768px; "The Labs," never "TUL"; "Poderator," never "moderator."
12. **Design language (owner decision): every element follows the Tinder/Airbnb-inspired
    language the landing screen sets** — media-led tappable cards with soft elevation and
    hover lift; flush full-bleed imagery (Tinder swipe-stories); bottom-sheet modals and
    sticky action bars on mobile (Airbnb); bold tight display type with eyebrow labels;
    generous section rhythm; conversational copy. No surface gets to feel like a different
    product — utilitarian screens (admin, Poderator, tables) included.

---

## 2. Personas

Grounded in the app's real audiences and, where possible, its own mock data (Marcus, Jordan,
Elena, Priya, and Dana exist in the prototype's rosters — the personas give them interiority).

### P1 · Maya Torres — The Curious Neighbor *(prospective member)*
- **Context:** 34, works at a nonprofit; a librarian friend texted her a survey link. Phone, evening, one thumb.
- **Wants:** to understand what The Labs is in 90 seconds; to contribute something small without committing; to judge whether this is legit or a bootcamp funnel.
- **Anxieties:** hidden costs, spam, "will I be sold to?"
- **Moments that matter:** first 30 seconds on the landing page; the survey's no-account promise; the first gated thing she hits.
- **Success:** contributes an observation, reads one spotlight, saves the kickoff date — and *chooses* to come back.

### P2 · Marcus Bell — The Career Changer *(core upskiller; mock `m2`)*
- **Context:** 41, ex-operations manager moving into data analysis. Desktop at night, phone at lunch. Family; ~6 hrs/week, honestly.
- **Wants:** structure that keeps him moving; proof-of-work he can show employers; people who notice if he drifts.
- **Anxieties:** imposter feelings; blank forms; committing and then flaking; obligations he didn't see coming.
- **Moments that matter:** the cycle threshold (does it tell him the real cost *before* he's invested?); the week his log is late; being blocked and admitting it.
- **Success:** signs the agreement understanding it, survives the mid-cycle dip, ships with a team, leaves with a portfolio and a testimonial.

### P3 · Jordan Okafor — The Young Builder *(early-career upskiller; mock `m3`)*
- **Context:** 24, CS grad, high agency, low patience for process. Fast on every device.
- **Wants:** a team, momentum, something real to demo; visibility for the work.
- **Anxieties:** "when do we actually BUILD?"; process that reads as bureaucracy; reading long text.
- **Moments that matter:** formation phases (is *now vs. next* always legible?); the ignition moment; the canvas the morning after.
- **Success:** proposal in, team ignited, canvas driving the work, showcase demo, followers.

### P4 · Priya Shah — The Time-Strapped Mentor *(mock `m1`)*
- **Context:** 45, product leader; recruited by a friend at The Labs; two hours a week, ruthlessly guarded.
- **Wants:** to help where she has leverage; reputation that compounds (vouched pill, testimonials); zero admin overhead.
- **Anxieties:** being booked cold; scope creep into managing someone; low-effort asks.
- **Moments that matter:** the 4-step intake (does it respect her time?); the first mentor request she receives (does evidence-first actually filter?).
- **Success:** intake under five minutes, requests arrive with evidence, her profile carries earned quotes she never wrote herself.

### P5 · Elena Ruiz — The Shepherd *(Poderator; mock `m4`)*
- **Context:** community organizer poderating Pod 2. A 10-minute Monday ritual plus glances before events; phone half the time.
- **Wants:** who's blocked (in their own words), where the pod is in the journey, what to unblock this week; a place to log where the *process* failed.
- **Anxieties:** becoming an enforcer; chasing people about logs; anything that reads as grading her members.
- **Moments that matter:** Monday triage (blockers-first); the week the gate arms; filing a process signal instead of "managing" a faltering team.
- **Success:** every blocker acted on within days; zero chasing; signals filed that change the next cycle's design.

### P6 · Ray Delgado — The Operator *(Labs staff / admin)*
- **Context:** runs the cycle ops and the funder demos. Lives in admin.html with the member app open in a second tab.
- **Wants:** to walk the whole formation arc live in a demo; to arm/clear the log gate; invitations with role presets; knobs that actually drive the tally.
- **Anxieties:** a demo that desyncs; accidentally exposing per-voter data; test accounts polluting health metrics.
- **Success:** every control does what it says, cross-tab, first try — and nothing leaks member privacy.

### P7 · Rev. Cheryl Alston — The Community Partner *(problem-bringer; the "Brought by" orgs)*
- **Context:** leads a civic organization; brought "first-time voter information gap" to a survey drive. Rarely logs in — the public surfaces are her surfaces.
- **Wants:** the problem her community voiced taken seriously; visible attribution; to see what became of it; artifacts her org can actually use.
- **Anxieties:** extraction — "we get studied and nothing ships"; jargon walls.
- **Moments that matter:** finding her org's name on the situation; the Showcase; forking the playbook.
- **Success:** the situation → project → commons chain is traceable without an account, and the artifact is genuinely usable.

### P8 · Dana Whitehall — The Overwhelmed Mid-Cycler *(stress-case / retention; mock `m7`)*
- **Context:** week 7. Energy dipped, alignment 2/5, hasn't logged in 8 days, considering quietly disappearing.
- **Wants:** (underneath) a dignified way back in — or a dignified way out.
- **Anxieties:** shame; a wall of accumulated guilt (piled-up todos, red badges); being "in trouble."
- **Moments that matter:** hitting the lockout; the copy on the gate banner; what her Poderator sees and does; the agreement's "leaving well is respected" line becoming real.
- **Success:** one honest log gets her back in with zero shame — or she leaves well, on purpose, and the door stays open.

*(Two emerging personas — the post-cycle **Alum** building on their portfolio and commons
record, and the **Closed-Cycle client** — have thin surfaces today; they enter the roster
when those surfaces exist.)*

---

## 3. User stories with acceptance criteria

Stories are ID'd `P#-n` for the evaluation matrix. **AC** = acceptance criteria the
walkthrough scores against.

### P1 · Maya — The Curious Neighbor
- **P1-1** As a first-time visitor on a phone, I want to grasp what The Labs is without scrolling past the hero, so I can decide to keep reading. — *AC: hero states what/where/who-for; primary CTA visible without scroll at 390px; no jargon (Poderator/formation/frames) above the fold.*
- **P1-2** I want to read a member's story before any pitch, so I can judge this by its people. — *AC: spotlights row is the first section under the hero; a story opens in ≤1 tap; `stories.html` loads fast and reads well at 390px.*
- **P1-3** I want to add a field observation without an account, so I can contribute before I commit. — *AC: survey reachable from the landing in ≤2 taps; zero auth anywhere in the loop; "add another" loops without re-entering context; exit returns me where I started.*
- **P1-4** I want to RSVP to a public workshop with just my email, so attending stays free of signup friction. — *AC: RSVP modal from any event card; email-only; confirmation states what happens next; Esc/outside-click closes.*
- **P1-5** I want to understand the open-source ethos before joining, so I know what I'd be part of. — *AC: commons message present on landing without entering any flow; footer/about reinforce it; no contradiction anywhere public.*
- **P1-6** When I do sign up, I want to know why Google auth and what happens to my data, so trust survives the first gate. — *AC: auth explainer answers "why Google"; gate context chip shows what I was joining; Participant Agreement is readable, scroll-gated, and shorter than 2 minutes.*

### P2 · Marcus — The Career Changer
- **P2-1** As a cycle-curious visitor, I want the full cost of the cycle stated before I answer anything, so I never feel bait-and-switched. — *AC: threshold appears before question 1 from every entry (signup chain, cycles page, formation note, pod chooser); five events dated; weekly gate named; commons named; "Not now" visibly respectable.*
- **P2-2** I want signup on my phone in under 5 minutes, so my first experience isn't a form marathon. — *AC: 5 screens; ≤3 asks per screen; keyboard never covers the active input; Enter advances; no zoom-on-focus.*
- **P2-3** I want to sign the Open Cycle Agreement knowing exactly what I promised, so my signature means something to me. — *AC: scroll-gate forces the read; three commitments in plain language; full-name signature; date stamped; the record appears on my profile.*
- **P2-4** I want my weekly log to take five minutes with zero blank-page dread, so the habit survives busy weeks. — *AC: three scaffolded prompts with example placeholders; sliders with visible values; share preview live; save resets the form and confirms; total interaction <5 min.*
- **P2-5** When I'm blocked, I want saying so to summon help, not judgment. — *AC: blocked toggle reveals "What do you need?"; copy says who sees it (Poderator + Labs team only); the Poderator surface shows my words verbatim, blockers-first.*
- **P2-6** If I miss a week, I want the way back to be one log — clear, firm, unshaming. — *AC: gate banner explains in one sentence; everything else dims but nav doesn't trap; saving instantly unlocks with the "You're back in ✓" beat; no accumulated-guilt UI.*
- **P2-7** I want my profile to build itself from work I already did, so proof accumulates without self-promotion. — *AC: log shares become profile updates; badges locked until earned with how-to-earn tooltips; Build Cycle credential carries the signed agreement.*

### P3 · Jordan — The Young Builder
- **P3-1** As a cycle member, I want to always know which formation phase is live and what I can do *right now*. — *AC: cycle page states phase + current action in one glance; phase ⓘ modals explain in ≤3 sentences; dashboards' "Up next" matches the live phase.*
- **P3-2** I want to submit a proposal fast and refine it later, so momentum isn't punished. — *AC: 5 fields, all with concrete placeholders; UPSERT re-entry pre-filled; "one per member" stated before I start.*
- **P3-3** I want the ballot to be legible in ten seconds — my budget, the threshold, what happens next. — *AC: budget visible (5/3); threshold (5) stated; stepper math can't go negative/over; lock-on-cast confirmed via sheet before it's final.*
- **P3-4** I want joining a team to feel like ignition, not paperwork. — *AC: seats/min/max visible per team; my registration flips state everywhere; at min the interstitial fires with an escape hatch; canvas link persists on dashboard.*
- **P3-5** I want the canvas to be the team's single source of truth. — *AC: frame/intervention/metrics/evidence + roster with open seats; "request a mentor" in context; reachable in ≤2 taps from dashboard.*
- **P3-6** When I ask for a mentor, I want the evidence ask to sharpen my question, not feel like homework. — *AC: the info step sells the why in one screen; three required fields with strong examples; confirmation says who sees it and what happens next.*

### P4 · Priya — The Time-Strapped Mentor
- **P4-1** As a recruited mentor, I want the same signup as everyone plus credit to whoever sent me. — *AC: role intent includes Mentor; "who referred you?" appears inline only when relevant; referral lands in my record.*
- **P4-2** I want mentor intake in 4 steps that publish immediately, so I'm findable today. — *AC: 4 steps, no booking/artifact asks; explainer says exactly where answers appear; profile live on completion, no review queue.*
- **P4-3** I want incoming requests pre-filtered by evidence, so my two hours go where they have leverage. — *AC: requests carry tried/evidence/challenge; directory mentor filter surfaces me; vouched mentors sort first with the ✓ explained.*
- **P4-4** I want testimonials I never write myself, so my reputation reads as earned. — *AC: request → author writes → I can only hide; pending chips cancellable; attribution on every quote.*
- **P4-5** I want to raise my hand later from my profile if I skipped mentoring at signup. — *AC: "I have experience to offer" visible on own profile until completed; same 4-step intake.*

### P5 · Elena — The Shepherd
- **P5-1** As a Poderator, I want Monday triage in ten minutes: blockers first, in the member's own words. — *AC: needs-attention ranks blocked > quiet; blocker text quoted; contact + process-signal + dismiss on every card; empty state celebrates.*
- **P5-2** I want the frame journey to show where each pod is with real artifacts, not status theater. — *AC: five stages with live artifacts; now/done/wait legible; follows admin's phase steps in real time.*
- **P5-3** I want compliance visibility without becoming the enforcer. — *AC: logged/waiting avatars; gated members marked; copy states the gate does the enforcing; no per-member grades anywhere.*
- **P5-4** I want to log process gaps as R&D signals, not manage people. — *AC: composer with process-step select; prefills from nudge cards and team cards; signals never attach to a member record; framing language holds everywhere.*
- **P5-5** I want member context (intake, practice cadence, presence) with edits scoped to contact/pod only. — *AC: drawer from any roster row; practice data read-only; mentor-material flag routes to nominations; staff/test hidden by default.*
- **P5-6** I want the week-7/13 milestone logs visible as practice, never as grades. — *AC: status only (submitted/open); copy says prefilled-from-their-own-logs; no scores.*

### P6 · Ray — The Operator
- **P6-1** As staff, I want to demo the whole formation arc live from Testing Controls. — *AC: each phase step updates member + Poderator tabs without reload; tally shows the naming beat; back-steps restore cleanly.*
- **P6-2** I want to arm the weekly log gate and watch enforcement work. — *AC: one toggle writes `logDueAt`; member tab locks live; clearing restores; state survives phase steps.*
- **P6-3** I want invitations with role presets and scopes I can copy and revoke. — *AC: role chips incl. Poderator; scope select; copyable link; revoke flips status visibly.*
- **P6-4** I want aggregate vote progress with zero per-voter leakage. — *AC: totals and ballots-in only; the no-attribution promise printed on the surface itself.*
- **P6-5** I want config knobs that actually drive behavior, so demos tell the truth. — *AC: threshold changes flow into the next tally; persisted in `cycleState.config`.*

### P7 · Rev. Alston — The Community Partner
- **P7-1** As a problem-bringer, I want our name on the problem, so contribution is visible. — *AC: situations carry "Brought by {org}"; visible on the cycle page without an account… (currently members-only — evaluate the tension).*
- **P7-2** I want to follow what became of our problem without creating an account. — *AC: public trail exists from landing/stories/events to outcomes; Showcase event visible and RSVP-able; commons artifacts publicly reachable at cycle end.*
- **P7-3** I want to send my community to contribute observations with one link. — *AC: `?survey=` deep link opens straight into the flow, mobile-clean, no dead ends.*
- **P7-4** I want the "everything returns to the commons" promise to be checkable. — *AC: Library shows "From the commons" provenance with real linked artifacts; license visible.*

### P8 · Dana — The Overwhelmed Mid-Cycler
- **P8-1** As a member who's gone quiet, I want the lockout to read as a doorway, not a punishment. — *AC: banner is one calm sentence + one action; no red-wall shaming; nav dims but explains; log form is directly reachable from the banner.*
- **P8-2** I want one honest log to bring me fully back. — *AC: instant unlock; "You're back in ✓" beat; no residual badges/debt UI anywhere afterward.*
- **P8-3** I want to say I'm blocked without performing wellness. — *AC: sliders are two taps; blocked field is free-text and optional in feel; privacy line adjacent.*
- **P8-4** I want dismissed suggestions to stay dismissed, so the dashboard doesn't accumulate guilt. — *AC: todos dismissible; no counters of missed things; setup collapses when done.*
- **P8-5** If I need to leave, I want to leave well. — *AC: the agreement's "leaving well is respected" has a real path — a way to tell my Poderator (drawer contact / process, not a buried mailto)… (currently thin — evaluate).*

---

## 4. Evaluation plan

### 4.1 Method stack

**A. Instrumented persona walkthroughs (primary).** One Playwright script per persona that
*drives their stories in sequence* as a journey (not isolated unit checks), at three
viewports — 390×844, 820×1180, 1280×900 — capturing a screenshot at every step plus step
metrics (taps/keystrokes to complete, dead ends, back-outs). Output: an evidence pack per
persona (`eval/P2-marcus/step-07-signature-390.png`, …) and a journey log. Where a story
can't be driven (P7's public outcome trail), the walkthrough documents the gap — that *is*
the finding.

**B. Rubric scoring.** Each story is scored 1–5 on six dimensions against its AC:

| Dimension | 1 (fail) | 3 (passable) | 5 (top-tier) |
|---|---|---|---|
| **Findability** | Entry point not discoverable | Findable with hunting | Where the persona's eyes already are |
| **Clarity** | Persona misunderstands what/why | Understands after re-reading | Never has to think |
| **Effort** | Steps/typing far beyond necessary | Reasonable | Irreducible minimum; momentum preserved |
| **Feedback** | Actions vanish silently | Status visible | Every action lands with proportionate confirmation |
| **Recovery** | Dead ends / data loss | Back works | Honest exits everywhere; nothing punished |
| **Register** | Emotional weight wrong (heavy where light / light where heavy) | Neutral | The moment lands exactly as designed — gravity at the threshold, celebration at ignition, calm at the gate |

**Register** is the app-specific dimension: this product deliberately modulates weight
(browse light → account light → cycle HEAVY → weekly ritual light → lockout firm-but-kind →
ignition celebratory). Generic usability can score 5 while the register is wrong; both must hold.

**C. Constitution compliance sweep.** Surface-by-surface audit against §1.2's twelve rules —
plus Nielsen's ten heuristics for anything the constitution doesn't cover (visibility of
status, error prevention, recognition over recall, etc.).

**C2. Design-language fidelity audit (rule 12).** Every surface graded against the landing's
Tinder/Airbnb markers: media-led cards · flush imagery · soft elevation + hover lift ·
bottom sheets · sticky action bars · display type + eyebrows · section rhythm · tappable
affordances. Output: per-surface fidelity grade (native / drifting / off-language) with the
specific missing markers.

**D. Accessibility pass.** Keyboard-only run of the core arc (signup → sign → log → vote);
focus visibility everywhere; contrast on dark covers (od2 text, red CTAs over grain); touch
targets ≥44px; reduced-motion honored; icon buttons labeled; scroll-gate operable by keyboard.

### 4.2 Severity model

| Level | Definition |
|---|---|
| **Blocker** | A persona cannot complete a core story |
| **Major** | Completes, but with friction/misreading they would remember or misjudge the product by |
| **Minor** | Noticeable friction; recoverable in-moment |
| **Polish** | Register/craft refinement |

Every finding cites: persona-story ID · dimension · severity · evidence screenshot ·
recommendation. Priority = severity × persona reach (a P2 blocker outranks a P6 minor —
Marcus is the product; Ray is staff).

### 4.3 Execution phases

1. **Phase A — Instrument & collect:** build the 8 walkthrough scripts, run at 3 viewports, produce evidence packs. *(No app changes.)*
2. **Phase B — Score & report:** fill the story×dimension matrix, run sweeps C/D, write `docs/UX_FINDINGS.md` — severity-ranked, evidence-linked, with per-persona narrative ("Marcus's cycle, as experienced").
3. **Phase C — Fix rounds:** highest severity×reach first, in the established per-round rhythm (implement → verify.mjs coverage → screenshots → ship). Re-run affected walkthroughs as regression; fold the durable ones into verify.mjs.
4. **Phase D — Real humans:** hand §5's kit to the team (the Ann Marie round proved external eyes catch what builders can't). Simulated evaluation is a floor, not a ceiling.

### 4.4 The matrix (filled during Phase B)

One row per story, one column per dimension, min-score highlighted. Example row:

| Story | Findability | Clarity | Effort | Feedback | Recovery | Register | Min | Finding |
|---|---|---|---|---|---|---|---|---|
| P2-6 gate re-entry | 5 | 4 | 5 | 5 | 4 | **5** | 4 | — |

---

## 5. Moderated-test kit (for real participants)

Five-task scripts per priority persona, think-aloud protocol, ~30 min each. Success =
completion without facilitator help + correct post-task explanation of what happened.

- **Kit 1 (P1, recruit: someone who's never seen it, phone only):** "You got this link from a friend [survey link]. Contribute something." → "Find out what this organization actually is." → "Sign up for a free workshop without creating an account." → "What happens to things people build here?" (probe the commons) → "Decide: would you join? Why?"
- **Kit 2 (P2, recruit: career-changer-adjacent):** "Create an account and register for the cycle. Narrate every screen." → post-signature: "What exactly did you just agree to?" (they should recall all three commitments unprompted) → "It's Friday: do your weekly log." → "You're stuck on data access — tell the system." → "You missed a week [gate armed]: get back in. How did that feel?"
- **Kit 3 (P5, recruit: anyone who's run a team/cohort):** "It's Monday. What needs you?" → "Where is Pod 4 in the cycle?" → "A team keeps stalling at registration — what do you do in this product?" (do they find process signals, or reach for management?) → "Who hasn't logged this week — and what will YOU do about it?" (correct answer: nothing; the gate handles it) → "Look up Marcus's context and update his email."
- **Kit 4 (P3, recruit: recent grad / hackathon type):** "The cycle is in submission — get your idea in." → "Vote." → "Join a team." → "Your team is real — now what?" → "Get help from a mentor without it feeling like a support ticket."

Facilitator watch-fors: where they hesitate >5s, what they say the Open Cycle Agreement
means (P2), whether the Poderator persona ever uses management language about members (P5),
whether the gate lands as fair (P2/P8).
