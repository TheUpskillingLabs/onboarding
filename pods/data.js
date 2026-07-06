/* ── Pods — the content source for /pods/ (public pod pages) and index.html's
   pod chooser. THIS FILE IS THE CMS: edit here, then run `node tools/generate.js`
   and commit both.
   PUBLIC BY ARTIFACT, PRIVATE BY PROCESS (owner decision): a pod's public page
   carries identity and shipped output ONLY — never logs, health bands, ballots,
   or process signals. `team` lists members who OPTED IN to public credit
   (handle = a people/ page exists); others appear in the count only.
   status: 'shipped' (past cycle, has public projects) · 'open' (joinable now) ·
   'forming' (real at 12). appId links open pods to the app's pod chooser. */
const PODS=[
  {slug:'benefits-navigators', name:'Benefits Navigators', cycle:'Spring 2026 · Civic Foundations', status:'shipped',
    focus:'Benefits navigation dead-ends — why residents abandon applications halfway through',
    members:5, team:[{name:'Jordan Okafor', handle:'jordan-okafor'},{name:'Priya Shah', handle:'priya-shah', role:'Mentor'}],
    projects:['benefitsbot'],
    story:'Five people, one help desk, twelve weeks of watching residents hit the same walls. Their project shipped — and their playbook came back to the commons so the next city doesn’t start from zero.'},
  {slug:'ballot-basics', name:'Ballot Basics', cycle:'Spring 2026 · Civic Foundations', status:'shipped',
    focus:'First-time voter information gap — local ballot info that travels',
    members:4, team:[{name:'Elena Ruiz'},{name:'Marcus Bell', handle:'marcus-bell', role:'Mentor'}],
    projects:['ballot-basics'],
    story:'Forty interviews with first-time voters turned into peer-shareable ballot explainers — and the interview kit that made them is free for anyone to reuse.'},
  {slug:'civic-ai', appId:'pod4', name:'Pod 4 · Civic AI', cycle:'Summer 2026 · Civic & Elections', status:'open',
    focus:'Benefits navigation dead-ends — plain-language tools for DC residents',
    members:14, meets:'Tuesdays 6:30 PM · DC Public Library', team:[], projects:[]},
  {slug:'voting-access', appId:'pod2', name:'Pod 2 · Voting Access', cycle:'Summer 2026 · Civic & Elections', status:'open',
    focus:'First-time voter information gap — local ballot info that travels',
    members:13, meets:'Thursdays 7 PM · Virtual', team:[], projects:[]},
  {slug:'open-knowledge', appId:'pod7', name:'Pod 7 · Open Knowledge', cycle:'Summer 2026 · Civic & Elections', status:'forming',
    focus:'Volunteer knowledge walks out the door — keeping what groups learn',
    members:5, meets:'Forming · first session after Kickoff', team:[], projects:[]}
];
if (typeof module !== 'undefined' && module.exports) module.exports = { PODS };
