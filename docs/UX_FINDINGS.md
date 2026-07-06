# UX Findings — Round 1

**Method:** instrumented persona walkthroughs (8 personas × 390/1280, journey scripts driving
the real UI, screenshot evidence at every step + programmatic checks), a WCAG contrast/target
/keyboard/labels sweep, and a design-language fidelity audit against the Tinder/Airbnb
standard the landing sets (constitution rule 12). Evidence packs live in the session
workspace (`eval/P1-maya/390/01-landing-hero.png`, …, `eval/journey-log.json`).

**Caveats:** this is a simulated expert evaluation — a floor, not a ceiling; the moderated-
test kit (UX_EVALUATION.md §5) still needs real humans. Screenshots captured mid-entrance-
fade were excluded from contrast judgments (re-shot settled).

---

## Executive summary

**What is already top-tier** — the commitment arc is the strongest thing in the product: the
threshold → questions → scroll-gated signature sequence scored straight 5s on Register at
both viewports (the 390px threshold with its five dated ✦ events is the best screen in the
app). The gate lockout reads exactly as designed — one calm banner, a single red marker on
the page, instant unshaming re-entry ("You're back in ✓", zero residual guilt UI). The
Poderator surface holds the shepherd line everywhere (blockers-first in the member's own
words; enforcement explicitly the system's job). Seams work: signup → threshold announces
"Your account is ready ✓"; mentor and volunteer chains open with their explainers. The
public layer keeps its promises: survey and RSVP verified account-free end to end, and the
pod chooser / member drawer bottom-sheets are genuinely Airbnb-native.

**The headline gaps** — one systemic visual bug breaking the image-led language (F1), a
cluster of WCAG failures on core tokens (F5–F7), a broken public trust chain for the
partner persona incl. a license contradiction (F3), the missing leaving-well path the
agreement promises (F4), and a real input race in the flow engine (F8).

---

## Findings (ranked)

### Major

**F1 · Orb art vanishes across the app — duplicate SVG gradient ids** ✅ *fixed in C1: always-visible defs sprite injected by shared.js as body's first child* — *rule 12 · Register/craft · evidence: P3/1280/04, P3/390/04, settled re-shot*
37 copies of `radialGradient#oc/#or/#og` exist per page (inline orbs + shared.js `ORB`).
Browsers resolve `url(#oc)` to the document's *first* instance — which lives in the hidden
landing view once you're in the app — so every media block off the landing renders as a
featureless teal slab: the cycle page's 1200×500 hero media, the dashboard cycle card,
Discover's banner and ORB-placeholder cards. This is the single biggest break of the
Tinder/Airbnb image-led standard: the app's "photography" simply doesn't show.
**Fix:** unique gradient ids per instance (suffix ids in shared.js `ORB` and the inline
SVGs), or one always-visible `<defs>` sprite at `<body>` top.

**F2 · Primary button text fails AA — white on `--teal` = 3.66:1** ✅ *fixed in C1: `.btn-teal` renders `--teal-deep` (5.2:1)* — *a11y · evidence: token math*
`btn-teal` carries 13–15px semibold white text everywhere (Continue, Save, Join). AA needs
4.5:1 below 18.7px bold. **Fix:** small/medium teal buttons use `--teal-deep` `#007882`
(white on it ≈ 4.8:1); keep `--teal` for large display CTAs only, or darken the token.

**F3 · The partner's public trust chain is broken — attribution, provenance, and license** ✅ *fixed in C2: public situations strip with Brought-by on the landing; provenance + license line on the public library; CC BY-SA corrected to the MIT + CC BY 4.0 pair everywhere* — *P7-1/P7-4 · Findability 1 · evidence: journey log*
"Brought by League of Women Voters DC" and the situations live members-only (auth guard
bounces the partner to the landing); the public library section carries no "From the
commons" provenance; and the public footer says **"Content under CC BY-SA"** while the
Open Cycle Agreement says **MIT + CC BY 4.0** — a license contradiction on the two surfaces
where trust is decided. **Fix:** one public "What this cycle is investigating" strip
(titles + Brought-by only) on the landing cycle section; provenance line + license on the
public library card; correct the footer to the agreement's license pair.

**F4 · "Leaving well is respected" has no path** ✅ *fixed in C2: step-back flow (dash cycle card → note to Poderator → stepped_back); never gate-chased; Poderator roster/drawer show it; rejoin one tap; docs route the status write through the §3.7 reconciler* — *P8-5 · Recovery 1 · evidence: journey log (no leave/step-back affordance in the signed-in app)*
The agreement promises it; Dana can't do it. Ghosting stays the only exit — the exact
failure the copy disavows. **Fix:** a "Step back from the cycle" affordance (profile Build
Cycle credential + cycle page) → short flow (reason optional, note to Poderator) → status
the Poderator sees. Prototype: writes `userState.cycleStatus='stepped_back'`, surfaces in
the member drawer.

**F5 · Keyboard users are invisible — no `:focus-visible` on `.btn`/`.choice`/`.tab`/`.nav-link`** ✅ *fixed in C1: global focus-visible rules on index + stories (persona pages already had them)* — *a11y sweep*
Chips have focus rings; the four most-used interactive classes don't. The whole commitment
arc is keyboard-operable (verified — including the scroll-gate, ✓) but you can't *see where
you are*. **Fix:** one global rule: `.btn:focus-visible, .choice:focus-visible,
.tab:focus-visible, .nav-link:focus-visible { outline:2px solid var(--teal); outline-offset:2px; }`.

**F6 · Helper text fails AA — `--meta` 3.70:1 on paper at 13px** ✅ *fixed in C1: `--meta` → `#5F6B70` (5.0:1 paper); `--meta-soft` audit still open* — *a11y · token math*
`.t-small` in `--meta` is the app's workhorse (help lines, metadata, captions). 4.07:1 on
white cards, 3.70:1 on paper — both under 4.5. **Fix:** darken `--meta` to ≈`#5f6b70`
(≥4.6:1 on paper); keep `--meta-soft` (2.31:1) strictly decorative — audit its two dozen
usages for real text.

### Minor

**F7 · Focus-steal race in the flow engine** ✅ *fixed in C2: guarded autofocus on text/fields steps* — *P2-2 · Recovery · reproduced under CPU load ("Marcus20011")*
The `fields` step auto-focuses input 1 on a 60ms timer; typing (or password-manager
autofill) that starts first gets hijacked mid-entry — the zip landed inside the first-name
field. **Fix:** guard the timer: `if(document.activeElement===document.body||
!box.contains(document.activeElement))` before focusing.

**F8 · Touch targets under 44px** ✅ *fixed in C2: ::after hit-area extensions on info-dot/heart/avatar* — *a11y @390 · measurements*
Phase ⓘ `info-dot` 22×22; heart (save) buttons visually ~30px; avatar 42×42 (borderline).
**Fix:** padding-based hit areas (keep visual size), min 44×44.

**F9 · 46 unnamed icon buttons** ✅ *fixed in C2: aria-labels on all hearts (static + mediaHTML) and back icon-btns* — *a11y · sweep*
Every `.heart` plus 5 `.icon-btn`s have no accessible name. **Fix:** `aria-label="Save"` /
state-aware ("Saved ✓") in the two places hearts are minted; label back-arrows and close
buttons ("Back", "Close").

**F10 · Pod-chooser honesty nit** ✅ *fixed in C3: "a few minutes and a signature first"* — *P2-1 · Clarity · evidence: P2/390/13*
"…that takes two minutes first" now undersells the threshold + agreement (~4–5 minutes and
a signature). Gravity copy must never round down. **Fix:** "that takes a few minutes and a
signature first."

**F11 · `--od3` tertiary text 3.79:1 on ink** ✅ *fixed in C3: footer license lines moved to od2; od3 reserved decorative* — *a11y*
Fails AA for normal sizes; passes large. **Fix:** reserve od3 for ≥18px or decorative.

**F12 · "Poderator" lands unexplained on public surfaces** ✅ *fixed in C3: public bylines say "Pod facilitator"; the spotlight story teaches the coined term* — *P1-1 · Clarity · evidence: landing story byline*
First contact with the coined role is a story-card byline with zero context. **Fix:** public
surfaces say "Pod facilitator" (or byline "Poderator — pod facilitator") until the member
app teaches the term.

### Polish

**F13 · Entrance fade flashes gray on slow devices** ✅ *fixed in C3: fades shortened to 180ms.* — every view/panel switch runs a 300ms
opacity fade; mid-fade the whole screen reads washed-out (visible in evidence shots).
Shorten to ~150ms; `prefers-reduced-motion` already honored.
**F14 · Landing media slabs when orb fails are doubly flat** ◐ *partial in C3: orbs now `preserveAspectRatio="slice"` so art covers every media; real photography for the 21/9 cycle hero remains a content decision.* — subsumed by F1; after the id
fix, consider real photography for the cycle hero media (the design already supports `img`).

---

## Matrix (min scores per story; 5-point scale)

| Persona | Stories at 5 | 4 | ≤3 (finding) |
|---|---|---|---|
| P1 Maya | P1-2, P1-3, P1-4 | P1-1 (F12), P1-6 | P1-5 → 3 (F3 license contradiction) |
| P2 Marcus | P2-1, P2-3, P2-4, P2-5, P2-6 | P2-2 (F7), P2-7 | — |
| P3 Jordan | P3-2, P3-4, P3-6 | P3-1, P3-3, P3-5 (F1 slabs dull the surfaces) | — |
| P4 Priya | P4-1, P4-2, P4-4, P4-5 | P4-3 | — |
| P5 Elena | P5-1, P5-2, P5-3, P5-4 | P5-5, P5-6 | — |
| P6 Ray | P6-1, P6-2, P6-3, P6-4 | P6-5 | — |
| P7 Alston | P7-3 | — | P7-1 → 1, P7-2 → 2, P7-4 → 2 (F3) |
| P8 Dana | P8-1, P8-2, P8-3, P8-4 | — | P8-5 → 1 (F4) |

Cross-cutting a11y (F2/F5/F6/F8/F9) applies to every persona and is scored as its own track.

## Design-language fidelity (rule 12 audit)

| Surface | Grade | Notes |
|---|---|---|
| Landing / stories.html | **Native** | The reference. Story row is genuinely Tinder; cards image-led (where F1 doesn't bite) |
| Onboarding flows | **Native** | Sheet + sticky actionbar + one-question rhythm = app-like |
| Threshold / signature / signed | **Native** | The ceremony register is the app at its best |
| Dashboard / Discover / profile | **Native, F1-degraded** | Card grammar right; media slabs undercut the image-led promise |
| Cycle page / formation | **Native, F1-degraded** | Giant hero media currently featureless |
| Pod chooser / member drawer / modals | **Native** | Bottom sheets, Airbnb-grade |
| Triangulator | **Divergent by design** | Tool-chrome; reskinned tokens. Recommend: accept divergence explicitly (owner sign-off) |
| moderator.html | **Drifting** | Cards + chips on-language; the roster/eval tables and text-dense blocks read as a different, flatter product — needs media/avatars warmth and card rhythm, not more tables |
| admin.html | **Drifting** | Same: functional but flat; acceptable for staff? Rule 12 says all elements — recommend a light card-language pass, not a redesign |

## Recommended fix rounds

- **C1 (this week):** F1 orb ids · F2 button contrast · F5 focus-visible · F6 meta contrast — systemic, token-level, high reach.
- **C2:** F3 public trust chain + license line · F4 leaving-well path · F7 focus race · F8/F9 targets + labels.
- **C3:** ✅ shipped (F10–F13, F14 partial) — the moderator/admin design-language warmth pass remains open (needs design intent, not a mechanical fix).
- **Then Phase D:** run the moderated kit with real participants.
