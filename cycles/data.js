/* ── Build Cycles — the content source for /cycles/ (the public Build Cycles page)
   and index.html's cycle surfaces. THIS FILE IS THE CMS: edit here, then run
   `node tools/generate.js` and commit both.
   CYCLE_PUBLIC mirrors the `cycles` row production serves via
   GET /api/cycles/[cycle_id]/public (docs §8); SITUATIONS mirrors
   `problem_situations` (docs §2) — the public accountability strip (UX F3)
   shows titles + "Brought by" only. index.html builds its runtime CYCLE object
   on top of CYCLE_PUBLIC (app-only fields stay in the app). */
const CYCLE_PUBLIC={
  slug:'summer-2026-civic-elections',
  name:'Summer 2026', theme:'Civic & Elections', city:'Washington, DC', mode:'open',
  kickoff:'2026-07-14T18:00', weeks:13,
  phases:['Problem Sprint','Frame Sprint','Building'],
  phaseInfo:{
    problem:{title:'Problem Sprint', when:'Weeks 1–5', body:'The cycle starts by looking, not building. Everyone collects things they’ve actually seen, we map them together in the Triangulator, and pods form around the problems that keep showing up. By week 5, your pod picks one to own.'},
    frame:{title:'Frame Sprint', when:'Weeks 6–9', body:'Your pod digs into its problem — interviews, field visits, homework nobody assigned. At the Hackathon, all that digging becomes proposals: new ways of seeing the problem, and what to build about it. Then everyone votes.'},
    building:{title:'Building', when:'Weeks 10–13', body:'Winning proposals become teams of 3–5. You build something real, test it with real people, and bring everything — the wins and the misses — back to the commons at the Showcase Summit.'}
  }
};
const SITUATIONS=[
  {id:'s1', title:'Benefits navigation dead-ends', owner:'DC Public Library', line:'Residents give up on benefits applications halfway through.', origin:'Built from community observations in the Triangulator · Week 3', context:'Residents abandon benefits applications mid-way. Frontline librarians field the fallout daily but the failure points are invisible to the agencies upstream.', adoptedBy:'Pod 4 · Civic AI'},
  {id:'s2', title:'First-time voter information gap', owner:'League of Women Voters DC', line:'First-time voters can’t find local ballot information anywhere.', origin:'Built from community observations in the Triangulator · Week 3', context:'First-time voters can find national coverage everywhere and local ballot information almost nowhere. The gap is worst exactly where votes matter most.', adoptedBy:'Pod 2 · Voting Access'},
  {id:'s3', title:'Volunteer knowledge walks out the door', owner:'Civic Tech DC', line:'When a volunteer leader leaves, everything they knew leaves too.', origin:'Built from community observations in the Triangulator · Week 4', context:'Local civic groups run on a few overloaded volunteers. When leadership turns over, everything they knew leaves with them.', adoptedBy:null}
];
if (typeof module !== 'undefined' && module.exports) module.exports = { CYCLE_PUBLIC, SITUATIONS };
