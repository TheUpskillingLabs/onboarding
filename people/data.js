/* ── People — the content source for /people/ (public member portfolios).
   THIS FILE IS THE CMS: edit here, then run `node tools/generate.js` and commit both.
   OPT-IN ONLY (owner decision): profiles are members-only by default — the signup
   promise holds. A member appears here (and gets a public page) only after opting
   into the public portfolio tier (production: participants.public_profile).
   Pages carry artifact info only: name, headline, expertise, verified pill, public
   projects, city. Never contact details, logs, or anything process-side.
   (Elena Ruiz is deliberately absent — she hasn't opted in.) */
const PEOPLE=[
  {handle:'priya-shah', name:'Priya Shah', headline:'Product & AI mentor', city:'Washington, DC', verified:true,
    expertise:['AI tools','Product','Facilitation'],
    bio:'Product lead turned mentor. I help pods scope small and ship weekly.',
    projects:['benefitsbot'], roles:['Mentor']},
  {handle:'marcus-bell', name:'Marcus Bell', headline:'Data mentor · analyst', city:'Baltimore', verified:false,
    expertise:['Data','Research','Strategy'],
    bio:'Fifteen years in public-sector data. Ask me about messy spreadsheets.',
    projects:['ballot-basics'], roles:['Mentor']},
  {handle:'jordan-okafor', name:'Jordan Okafor', headline:'Builder · Civic AI cycle', city:'Washington, DC', verified:false,
    expertise:['Engineering','AI tools'],
    bio:'Shipping my first civic tool this cycle — a plain-language permit guide.',
    projects:['benefitsbot'], roles:['Builder']},
  {handle:'alex-rivera', name:'Alex Rivera', headline:'Upskiller', city:'Washington, DC', verified:false,
    expertise:['AI tools'],
    bio:'Learning by building, in the open.',
    projects:[], roles:['Builder']}
];
if (typeof module !== 'undefined' && module.exports) module.exports = { PEOPLE };
