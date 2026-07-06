/* ── Metros — the content source for /labs/ (this directory's generated pages),
   index.html's metro search + lab cards, and the profile credibility band.
   THIS FILE IS THE CMS: edit here, then run `node tools/generate.js` and commit both.
   Backend contract (docs §1.1 metros + §1.1b metro_waitlist_signups).
   Two states only (owner decision): 'active' (DC) or 'waitlist' (everyone else).
   `waiting` mirrors COUNT(metro_waitlist_signups); `members` is active-lab only.
   `slug` is the URL contract: labs/{slug}/ here ↔ /labs/[slug] in production.
   Metros created at runtime by createWaitlistMetro() are in-memory only — they
   get a generated page when they're added here and the generator runs. */
const METROS={
  dc:          {slug:'dc',           name:'Washington, DC', st:'DC', status:'active',   partner:'DC Public Library',            members:312, blurb:'The flagship. Weekly workshops, monthly showcase, a cycle in progress.'},
  baltimore:   {slug:'baltimore',    name:'Baltimore',      st:'MD', status:'waitlist', partner:'Enoch Pratt Free Library',     waiting:38,  blurb:'Thirty-eight names and a library partner already at the table. Baltimore is close.'},
  philadelphia:{slug:'philadelphia', name:'Philadelphia',   st:'PA', status:'waitlist', partner:'Free Library of Philadelphia', waiting:57,  blurb:'The longest list outside DC. Fifty-seven people are ready to build — Philadelphia is next in line by the numbers.'},
  greensboro:  {slug:'greensboro',   name:'Greensboro',     st:'NC', status:'waitlist', waiting:12,  blurb:'Twelve names in and growing. Greensboro’s list started the way every lab starts — with one person.'},
  columbia:    {slug:'columbia',     name:'Columbia',       st:'SC', status:'waitlist', waiting:9,   blurb:'Nine people want a Columbia lab. A college town with a builder streak — the list knows it.'},
  pittsburgh:  {slug:'pittsburgh',   name:'Pittsburgh',     st:'PA', status:'waitlist', waiting:26,  blurb:'Steel built this city. The next thing gets built by the people who live here — 26 of them are already on the list.'},
  miami:       {slug:'miami',        name:'Miami',          st:'FL', status:'waitlist', waiting:41,  blurb:'Forty-one names deep and moving fast. Miami wants a lab, loudly.'}
};
if (typeof module !== 'undefined' && module.exports) module.exports = { METROS };
