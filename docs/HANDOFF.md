# HANDOFF — translating this prototype to Vercel (Next.js) + Supabase

This prototype is the design source of truth AND the architecture contract. Every URL below
exists as a real, working page in the repo; every data file maps to a table; every handoff
param maps to an API call. The intended translation is 1:1 — no redesign decisions left.
Schema/RLS/API detail lives in `docs/OLOS_BACKEND_CHANGES.md` (cited by § below); UX
acceptance criteria live in `docs/UX_EVALUATION.md`.

## 1. Public routes (each is a generated static page here; a route there)

| Prototype URL | Next.js route | Auth | Data source (Supabase) | Notes |
|---|---|---|---|---|
| `/` (index.html landing) | `/` | public | events/library/labs/cycles data + STORIES | Browse-first; every card links to a real page |
| `/about/` | `/about` | public | static content | Sage→Magician page; org unnamed until §3; CTA → `/cycles` |
| `/cycles/` | `/cycles` | public | `cycles` (§2) via `GET /api/cycles/[id]/public` + anchor events + `problem_situations` | The Build Cycles sales page; register CTA → authed registration (below) |
| `/events/`, `/events/{slug}/` | `/events`, `/events/[slug]` | public | `events` Luma cache (§3) | RSVP is email-only (`POST` public, §1.7); slugs are the URL contract |
| `/library/`, `/library/{slug}/` | `/library`, `/library/[slug]` | public | `resources` CMS (§4) | Commons items carry `from` provenance |
| `/labs/`, `/labs/{slug}/` | `/labs`, `/labs/[slug]` | public | `metros` + derived `waiting_count` (§1.1/§1.1b) | Join CTA → authed `POST /api/labs/[metro_id]/waitlist` |
| `/projects/`, `/projects/{slug}/` | `/projects`, `/projects/[slug]` | public | `projects` — **`approved:true` only** (peer-approval rule, §2) | Public by artifact: unapproved projects exist in data, never render |
| `/pods/`, `/pods/{slug}/` | `/pods`, `/pods/[slug]` | public | pods tables (§6/moderator) — identity + shipped output ONLY | Never process data (logs/health/ballots/signals) |
| `/people/`, `/people/{handle}/` | `/people`, `/people/[handle]` | public | `participants` where `public_profile=true` (opt-in tier) | Members-only stays the default; artifact info only |
| `/stories.html` | `/stories` | public | editorial content (no table yet; submissions concierge-reviewed) | Deep links `#s-{id}` |
| `/sitemap.xml` | generated | public | — | 57 URLs; regenerate on content change |

## 2. The signed-in app — real pages (hand-written route shells over app.js)

Every destination is its own page (owner decision — the LinkedIn model). Each is a thin
hand-written shell: its own panel markup only; the nav/tab bar, ceremony views, and shared
modals are injected at boot by `chrome.js` + `app.js` (`injectCeremonies()` — one markup
source). `App.boot('<page>')` = the route's layout+loader: auth guard (signed-out →
`index.html`), the weekly Learning Log gate (every page but Home redirects to `dashboard/`
until the log is saved — production: the same check as middleware), chrome mount, renderers,
route params.

| Prototype page | Nav label | Next.js route | Notes |
|---|---|---|---|
| `dashboard/` | Home | `/dashboard` | The log (+ gate), setup checklist, todos, commitments, week rail |
| `my-cycle/` | My Cycle | `/my-cycle` | Formation pipeline: situations → proposals → ballot → teams; `?register=1` opens the threshold |
| `learning/` | Learning | `/learning` | Full events + library catalogs + saved items (`#sec-events/#sec-library/#sec-saved`) |
| `directory/` | Directory | `/directory` | Member directory, community updates, The Work teasers, city/metro search |
| `directory/?u={id}` | — | `/u/[handle]` | Visitor-mode member profile (members-only), rendered in place; Directory stays lit |
| `me/` | (the avatar) | `/me` | Owner profile — reached through the avatar menu's Profile button, not a nav link |

"Me" is the avatar itself (owner decision): its dropdown opens with a filled **Profile**
button → `me/`, then View-as, feedback, sign out. Mobile: the bottom tab bar carries
Home · Cycle · Learning · Directory · Me (avatar) as real links.

Legacy `?view={panel}` links redirect: `dashboard→/dashboard`, `discover→/learning`,
`cycles→/my-cycle`, `profile→/me`, `events/resources/bookmarks→/learning#…`,
`labs→/directory#sec-cities`.

Persona surfaces: `moderator.html` → `/moderate` (Poderator role), `admin.html` → `/admin` —
same chrome source, persona pill + "Exit to member view" instead of destinations.
`triangulator.html` → the sensemaking tool route (iframe today; module there).

## 3. Flow/ceremony views → client components

`view-google-auth → role-intent → view-flow` (signup, 5 steps, scroll-gated Participant
Agreement) · `view-cycle-threshold` (two beats: value → the deal) · signature step (Open
Cycle Agreement, `version` stamped — §2c `cycle_agreements`) · `view-cycle-signed` ·
`view-team-ignition` · `view-survey-share` (production: `/s/[share_slug]`) · pod chooser,
waitlist join, RSVP, feedback modals. All are client-side flows over the APIs in §8.

## 4. Data contracts (file/object → table)

| Source | Table / production source | § |
|---|---|---|
| `events/data.js` EVENTS | `events` (Luma cache; server proxy) | §3 |
| `library/data.js` RESOURCES | `resources` | §4 |
| `labs/data.js` METROS | `metros` (+ `metro_waitlist_signups` counts) | §1.1 |
| `cycles/data.js` CYCLE_PUBLIC, SITUATIONS | `cycles`, `problem_situations` | §2 |
| `projects/data.js` PROJECTS_PUBLIC | `projects` (+ approval state) | §2 |
| `pods/data.js` PODS | pods tables | §6 |
| `people/data.js` PEOPLE | `participants` (`public_profile=true`) + `mentor_profiles` | §1.8 |
| index.html MEMBERS | `participants` directory (`GET /api/directory`, members-only) | §1.8 |
| index.html SOLUTION_PROPOSALS / CYCLE_PROJECTS / CYCLE_CONFIG | `solution_proposals`, `projects`, cycle config | §2 |
| index.html PARTICIPANT_AGREEMENT / SURVEY_SEED / FEEDBACK_LOG | agreement copy · `field_surveys`+`survey_responses` · feedback (no table yet — flag) | §1.2–1.3 |
| index.html STORIES / stories.html SPOTLIGHTS | editorial (no table yet — flag) | — |

## 5. Handoff params → production equivalents

| Param | Prototype behavior | Production |
|---|---|---|
| `?join={slug}` | One-shot: signed-in auto-joins waitlist; anon gates then auto-joins (the join completes before any navigation) | authed `POST /api/labs/[metro_id]/waitlist` from the lab page |
| `?register=cycle` | Signed-in → redirect `my-cycle/?register=1`; anon → account gate → threshold | `/my-cycle/register` behind auth |
| `my-cycle/?register=1` | One-shot: opens the cycle threshold on the page | the register CTA's authed route |
| `?login=1` / `?signup=1` | The public nav's Log in / Join from every page | `/login` · `/signup` |
| `?survey={slug}` | Deep-link into the survey flow, no account | `/s/[share_slug]` |
| `directory/?u={id}` | Visitor-mode member profile | `/u/[handle]` |
| `?go=dashboard` / `?view={panel}` | LEGACY — pure redirects to the real pages (kept so old links never die) | the routes themselves |

## 6. localStorage → production

| Key | Purpose here | Production |
|---|---|---|
| `olos.session.v1` | Demo session across page loads (display-only, never auth) | Supabase auth session/cookie |
| `olos.userState.v1` | The rest of the demo state (cycle membership + agreement, learning logs — the gate reads these — hearts, follows, updates, ballots, answers). Written by `saveUserState()` — **each call site maps 1:1 to a production POST/PATCH** (grep `saveUserState()` in app.js for the write map) | the Supabase rows behind §8's authed APIs |
| `olos.cycleState.v1` | admin.html Testing Controls → app/moderator (formation phase, log gate) | `cycles` table + admin mutations; weekly cron for `logDueAt` |
| `olos.surveyPool.v1` | Survey → Triangulator hand-off (single browser) | `survey_responses` API |
| `olos.viewAsRole.v1` | Persona lens for the demo | real roles/RLS |
| `olos.sensemaking.v2` | Triangulator canvas state | `sensemaking_sessions` (§1.4) |

## 7. Build pipeline

- `node tools/generate.js` = the server renderer: emits every public page from the data files,
  idempotent, orphan-sweeping. In production this is simply SSG/ISR — the template functions in
  `tools/generate.js` are your page components; the data files are your `SELECT`s.
- `.github/workflows/static.yml` = the deploy (GitHub Pages). On Vercel: build = generator run
  (or native Next SSG); every intra-repo path is relative, so no basePath surprises.
- Styling: `tokens.css` (design tokens) → `system.css` (the shared component layer — single
  source) → per-page vocabulary. Translate as global CSS or port tokens into your system.
- `chrome.js` = the nav/footer single source, consumed at build time (generate.js bakes it
  into every generated page) AND at runtime (index/stories/app/persona pages mount it). In
  production the nav is a server component — chrome.js is its prototype twin, including the
  auth-aware swap (`sessionChrome()`), The Work ▾ menu, and the app bar with the avatar menu.
- `app.js` = the shared signed-in client runtime (userState + persistence, gates, FLOWS
  engine + injected ceremonies/modals, teaser helpers, every panel renderer). It is the map
  of what belongs in the shared client layer vs per-route code when splitting into Next.js
  routes; `app.css` is its style twin (the SPA-era vocabulary, divided per route in
  production).
- `search.js` = client search over the loaded data globals; production swaps in an API-backed
  index. `shared.js` = orb sprite + avatar-menu wiring + tappable/keyboard helpers.

## 8. Deliberately parked (documented, not built)

- Centered Airbnb-style search pill — the LinkedIn-style field shipped instead (owner
  decision); the centered pill remains the possible long-term move if search becomes the
  product's centerpiece.
- Feedback + editorial (STORIES/SPOTLIGHTS) tables — flagged in §4 above.
