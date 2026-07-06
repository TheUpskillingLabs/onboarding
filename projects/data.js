/* ── Projects — the content source for /projects/ (public case-study pages).
   THIS FILE IS THE CMS: edit here, then run `node tools/generate.js` and commit both.
   PUBLIC BY ARTIFACT, PRIVATE BY PROCESS (owner decision): only `approved:true`
   case studies get a public page (the peer-approval rule — teammates sign off
   before anything publishes). Unapproved/in-flight projects stay in this file as
   the pipeline's truth but are NEVER emitted. `team` bylines link only to people
   who opted into a public profile (handle = a people/ page exists). `commons`
   links the artifacts the team returned to the Learning Library. */
const PROJECTS_PUBLIC=[
  {slug:'benefitsbot', title:'BenefitsBot', approved:true, cycle:'Spring 2026 · Civic Foundations', pod:'benefits-navigators', grad:'m-teal',
    frame:'Treat benefits enrollment as a wayfinding problem, not a paperwork problem.',
    summary:'A plain-language eligibility guide that walks DC residents through SNAP + Medicaid in one calm flow.',
    problem:'DC residents abandon benefits applications because eligibility rules are opaque and scattered across agencies.',
    outcome:'Piloted in 3 DC Public Library branches; cut intake questions by ~40%.',
    body:['The pod spent a month at a library help desk before writing a line of code. What they saw changed the project: residents weren’t confused by the forms — they were defeated by not knowing where they stood.','So the team reframed the whole thing as wayfinding. BenefitsBot doesn’t fill out applications; it tells you, in plain words, where you are, what you likely qualify for, and what happens next.','The pilot ran in three branches. Intake questions dropped by about forty percent, and the playbook for running the same pilot anywhere came back to the commons.'],
    team:[{name:'Jordan Okafor', handle:'jordan-okafor'},{name:'Priya Shah', handle:'priya-shah', role:'Mentor'},{name:'and three teammates'}],
    commons:[{title:'Benefits wayfinding playbook', slug:'benefits-wayfinding-playbook'}]},
  {slug:'ballot-basics', title:'Ballot Basics', approved:true, cycle:'Spring 2026 · Civic Foundations', pod:'ballot-basics', grad:'m-forest',
    frame:'First-time voting is a social act — information travels through trusted peers, not portals.',
    summary:'Peer-shareable local ballot explainers, built from forty interviews with first-time voters.',
    problem:'First-time voters can find national coverage everywhere and local ballot information almost nowhere.',
    outcome:'Forty first-time voters interviewed; explainers shared peer-to-peer in the pilot; the interview kit returned to the commons.',
    body:['The team’s first instinct was to build a portal. Forty interviews killed that idea: first-time voters don’t search — they ask someone they trust.','Ballot Basics leaned into that. Instead of a destination, the team built explainers designed to be handed from one person to another: shareable, local, and written like a friend talking.','The interview protocol that got forty strangers talking honestly is in the Learning Library, ready for the next team’s topic.'],
    team:[{name:'Elena Ruiz'},{name:'Marcus Bell', handle:'marcus-bell', role:'Mentor'},{name:'and two teammates'}],
    commons:[{title:'First-time voter interview kit', slug:'first-time-voter-interview-kit'}]},
  // In-flight (Summer 2026) — present in the pipeline, NOT approved, NEVER emitted publicly.
  {slug:'permit-guide', title:'Permit guide', approved:false, cycle:'Summer 2026 · Civic & Elections', pod:'civic-ai', grad:'m-navy',
    frame:'Permitting is a language problem before it is a process problem.',
    summary:'Plain-language DC permit navigation — in prototype with 5 residents.',
    team:[{name:'Jordan Okafor', handle:'jordan-okafor'}], commons:[]}
];
if (typeof module !== 'undefined' && module.exports) module.exports = { PROJECTS_PUBLIC };
