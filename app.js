/* ── app.js — The Labs' signed-in client runtime, extracted from index.html.
   One file shared by index.html (the landing + onboarding funnel host) and every
   app page (dashboard/ my-cycle/ learning/ directory/ me/): userState + the
   olos.userState.v1/olos.session.v1 persistence pair, the gates (auth + weekly
   Learning Log), the FLOWS engine and ceremony logic, the teaser helpers, and
   every panel renderer. Each page supplies its own markup and boot; this file is
   the map of what belongs in the shared client layer vs per-route code when the
   dev team splits it into Next.js routes (docs/HANDOFF.md §7).
   Load order: shared.js → the seven data.js files → chrome.js → app.js → the
   page's inline boot → search.js. */
const userState = {name:'Alex', initials:'AR', roles:[], isMentor:false, signedIn:false, completed:{}, profileAnswers:{}, mentorAnswers:{}, volunteerAnswers:{}, saved:[], lab:{name:'',status:''}, waitlists:[], updates:[], learningLogs:[], mentorRequests:[], testimonials:[], testimonialRequests:[], following:[], ballot:null, projectId:null, nominations:[], answers:{}, agreements:[], contactOptIn:false, emails:[]};
/* Agreement acceptances — one {doc, version, at} row per signed document
   (production: agreement_acceptances). hasAgreed checks the CURRENT version,
   so a version bump re-presents the document on the next signup/update pass. */
function hasAgreed(doc){ const A=window.AGREEMENTS||{}; const v=A[doc]&&A[doc].version; return userState.agreements.some(a=>a.doc===doc&&(!v||a.version===v)); }
function recordAgreement(doc){ if(hasAgreed(doc)) return; const A=window.AGREEMENTS||{}; userState.agreements.push({doc, version:(A[doc]&&A[doc].version)||'v1', at:Date.now()}); }
const FLOW_ROLES=['mentor','volunteer','cycle']; // roles with a deferrable setup flow ('events' is passive)
const ROLE_ITEMS={
  mentor:{title:'Complete the mentor section of your profile', sub:'Tell pods what you bring and how to reach you.'},
  volunteer:{title:'Complete the volunteer section of your profile', sub:'Tell us where and how you want to help.'},
  cycle:{title:'Register for the Civic & Elections Cycle', sub:'Pick a problem area and your commitment.'}
};
/* METROS now lives in labs/data.js (the labs directory's content source — see the
   script tags above). Shared by onboarding (zip→metro), the metro search, Discover,
   the profile credibility band, and the generated labs/ pages. */
// Cycle context for the dashboard command center. TODO: drive phase/week/milestones from real cycle data.
// The cycle runs the vision's three-month arc: Problem Sprint (pods form around
// Problem Situations) → Frame Sprint / Hackathon (projects form around frames) →
// Building. Its public rhythm is the six anchor events (marked ✦ on the week rail).
const CYCLE={ ...CYCLE_PUBLIC, /* public fields live in cycles/data.js — the /cycles/ page and this app share them */ phase:'Problem Sprint', phaseIndex:0, pod:'Pod 4 · Civic AI', milestones:[ {label:'✦ Problem Sprint — investigate together', when:'Wk 3'}, {label:'✦ Meet the Pods — discovery goes public', when:'Wk 6'}, {label:'✦ Hackathon — the Frame Sprint', when:'Wk 9'}, {label:'✦ Meet the Projects — critique the framing', when:'Wk 10'}, {label:'✦ Showcase Summit — everything returns to the commons', when:'Wk 13'} ] };
/* ── Upskiller stories — the landing's hero-adjacent row; the CTA card and every
   "Read more" deep-link into stories.html (Upskiller Spotlights), which holds the
   full set. Production swaps the data source, not the markup. ── */
const STORIES=[
  {id:'hector', quote:'The program gave me purpose again\u2014connecting me with mission-driven public servants to tackle real problems. AI as an empowerment tool for people-first civic design.', name:'Hector Perla', tag:'ADHD Brain \u00b7 Inaugural AI Cohort', grad:'m-teal'},
  {id:'suzie', quote:'I left realizing my gap is exactly where my strength lies\u2014translating between tools, teams, and user needs. AI is about community, trust, and the human side of technology.', name:'Suzie Zhang', tag:'FinLit Coach \u00b7 Inaugural AI Cohort', grad:'m-forest'},
  {id:'jordan', quote:'Twelve resident interviews in, the problem stopped being abstract. We shipped a benefits guide three library branches actually use.', name:'Jordan Okafor', tag:'BenefitsBot \u00b7 Civic & Elections Cycle', grad:'m-navy'},
  {id:'elena', quote:'I came for the AI skills and stayed for the pod. Facilitating other people\u2019s growth turned out to be the skill I was building all along.', name:'Elena Ruiz', tag:'Pod facilitator \u00b7 Voting Access', grad:'m-teal'},
  {id:'marcus', quote:'Mentoring here isn\u2019t office hours into the void \u2014 teams bring evidence, and you get to challenge real thinking at the exact right moment.', name:'Marcus Bell', tag:'Data Mentor \u00b7 Two Cycles', grad:'m-forest'},
  {id:'aisha', quote:'My case study became a playbook, the playbook became a workshop, and the workshop hired me. Build in the open \u2014 the commons pays you back.', name:'Aisha Karim', tag:'Design Mentor \u00b7 Career Changer', grad:'m-navy'}
];
function renderLandingStories(){
  const row=document.getElementById('story-row'); if(!row) return;
  row.innerHTML=STORIES.map(st=>'<div class="card tappable story-card" onclick="location.href=\'stories.html#s-'+st.id+'\'">'
    +'<div class="story-media '+(st.grad||'m-teal')+'" aria-hidden="true">'+ORB+'</div>'
    +'<div class="card-body">'
    +'<p class="t-body story-quote" style="margin-bottom:14px;">\u201c'+escHTML(st.quote)+'\u201d</p>'
    +'<div class="t-h4" style="margin-top:auto;">'+escHTML(st.name)+'</div>'
    +'<div class="lbl" style="margin-top:4px;">'+escHTML(st.tag)+'</div>'
    +'<a class="see" style="display:inline-block;margin-top:12px;" href="'+appRel()+'stories.html#s-'+st.id+'" onclick="event.stopPropagation()">Read more \u2192</a>'
    +'</div></div>').join('')
    +'<div class="card tappable story-cta" onclick="location.href=\'stories.html\'">'
    +'<div class="card-body" style="display:flex;flex-direction:column;height:100%;">'
    +'<div class="lbl lbl-teal" style="margin-bottom:10px;">Your turn</div>'
    +'<div class="t-h3" style="margin-bottom:10px;">Share your story or read more</div>'
    +'<p class="t-body" style="margin-bottom:18px;">Spotlights are public \u2014 read more from the community, or add your own.</p>'
    +'<a class="see" style="margin-top:auto;" href="'+appRel()+'stories.html" onclick="event.stopPropagation()">Upskilling Stories \u2192</a>'
    +'</div></div>';
  enhanceTappables();
}
// Portfolio is data-driven: the upskiller baseline is seeded; mentor/volunteer evidence is synthesized
// at render time from the role flows (only when that role is completed), so the grid reads role-blended.
const PROJECTS=[
  { title:'BenefitsBot', roleType:'upskiller', featured:true, tag:'Build Cycle', role:'Spring 2026 Cycle · Pod lead',
    problem:'DC residents abandon benefits applications because eligibility rules are opaque and scattered across agencies.',
    summary:'A plain-language eligibility guide that walks residents through SNAP + Medicaid in one calm flow.',
    outcome:'Piloted in 3 DC Public Library branches; cut intake questions by ~40%.', artifact:{label:'View prototype', href:'#'} },
  { title:'Prompt patterns deck', roleType:'upskiller', featured:false, tag:'Workshop', role:'Workshop · Author',
    summary:'Reusable prompts for community research, packaged for non-technical organizers.',
    outcome:'Adopted by 2 partner orgs; 120+ downloads.' },
  { title:'Library hours finder', roleType:'upskiller', featured:false, tag:'Open', role:'Solo · Contributor',
    summary:'A tiny tool that surfaces branch hours from an unstructured PDF.',
    outcome:'Used by 300+ residents in its first month.' }
];
function slug(s){ return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }

/* EVENTS now lives in events/data.js (that directory's content source). */
/* RESOURCES now lives in library/data.js (that directory's content source). */
/* ── Community directory — mock members. Production swap: GET /api/directory. */
const DAY=86400000;
const MEMBERS=[
  {id:'m1', handle:'priya-shah', name:'Priya Shah', initials:'PS', headline:'Product & AI mentor', metro:'Washington, DC', roles:['mentor'], verified:true, followers:48, expertise:['AI tools','Product','Facilitation'], bio:'Product lead turned mentor. I help pods scope small and ship weekly.', updates:[{body:'Ran office hours with two pods on scoping their Discovery readouts.', at:Date.now()-2*DAY},{body:'Published a prompt-pattern cheat sheet for the cohort.', at:Date.now()-9*DAY}], testimonials:[{quote:'Priya unblocked us every single week — she asks the question we were avoiding.', from:'Jordan Okafor · Pod 4'},{quote:'Our scoping went from mush to shippable in one session.', from:'Sam Whitfield · Pod 4'}], projects:[{title:'Mentoring — Civic AI pods', tag:'Mentor', summary:'Weekly office hours on scoping and shipping.'}]},
  {id:'m2', handle:'marcus-bell', name:'Marcus Bell', initials:'MB', headline:'Data mentor · analyst', metro:'Baltimore', roles:['mentor'], followers:21, expertise:['Data','Research','Strategy'], bio:'Fifteen years in public-sector data. Ask me about messy spreadsheets.', updates:[{body:'Helped Pod 2 untangle their benefits-eligibility dataset.', at:Date.now()-4*DAY}], testimonials:[{quote:'Marcus made our messy spreadsheet make sense in an afternoon.', from:'Elena Ruiz · Pod 2'}], projects:[{title:'Mentoring — data pods', tag:'Mentor', summary:'Deep dives on data cleaning and analysis.'}]},
  {id:'m3', handle:'jordan-okafor', name:'Jordan Okafor', initials:'JO', headline:'Builder · Civic AI cycle', metro:'Washington, DC', roles:['upskiller'], followers:9, expertise:['Engineering','AI tools'], bio:'Shipping my first civic tool this cycle — a plain-language permit guide.', updates:[{body:'Permit guide prototype is live in test with 5 residents.', at:Date.now()-1*DAY},{body:'First user interview done. Everything I assumed was wrong. Great.', at:Date.now()-6*DAY}], projects:[{title:'Permit guide', tag:'Build Cycle', summary:'Plain-language DC permit navigation.'}]},
  {id:'m4', name:'Elena Ruiz', initials:'ER', headline:'Volunteer · community research', metro:'Philadelphia', roles:['volunteer','upskiller'], followers:14, expertise:['Research','Outreach & community'], bio:'Helping stand up the Philadelphia lab. Field researcher by instinct.', updates:[{body:'Collected 14 field observations for the Civic & Elections survey.', at:Date.now()-3*DAY}], projects:[{title:'Philly lab formation', tag:'Volunteer', summary:'Groundwork for the Philadelphia lab.'}]},
  {id:'m5', name:'Sam Whitfield', initials:'SW', headline:'Builder · writer', metro:'Washington, DC', roles:['upskiller'], followers:7, expertise:['Writing','Policy'], bio:'Policy writer learning to prototype. Words first, then working software.', updates:[{body:'Drafted the case study for our pod’s voting-info project.', at:Date.now()-5*DAY}], projects:[{title:'Voting info cards', tag:'Build Cycle', summary:'Scannable local-election explainers.'}]},
  {id:'m6', name:'Aisha Karim', initials:'AK', headline:'Design mentor · volunteer', metro:'Washington, DC', roles:['mentor','volunteer'], verified:true, followers:33, expertise:['Design','Facilitation'], bio:'Service designer. I run the design crits and keep the showcase honest.', updates:[{body:'Design crit #4 done — six projects reviewed, all sharper for it.', at:Date.now()-2*DAY}], testimonials:[{quote:'Aisha\u2019s crits are the reason our showcase demo landed.', from:'Sam Whitfield · Pod 4'}], projects:[{title:'Design crit series', tag:'Mentor', summary:'Recurring community design reviews.'}]}
];
/* ── Formation — mirrors OLOS's real pipeline: submit → budget-vote → tally
   (projects named) → self-serve registration. No staking, no commit-to-ignite.
   SITUATIONS (Month 1 · Problem Sprint): the problem statements this cycle voted
   in — read-only history, mapped in the Triangulator.
   SOLUTION_PROPOSALS (Month 2 · Hackathon / Frame Sprint): each pairs a problem
   statement with a new FRAME + intervention + metrics + evidence. Members budget-
   vote; winners are named and become project teams (3 min · 5 max); members
   register for exactly one. Eligibility choice (deliberate, easily flipped):
   everyone in the pod votes, submitters get the larger budget — mirrors OLOS's
   problem-statement vote. Production: solution_proposals + votes + projects
   (docs/OLOS_BACKEND_CHANGES.md §2). */
const CYCLE_CONFIG={ submitterVotes:5, nonSubmitterVotes:3, voteThreshold:5, projectMin:3, projectMax:5, maxProjects:4 };
/* SITUATIONS now lives in cycles/data.js (that directory's content source). */
const SOLUTION_PROPOSALS=[
  {id:'p1', problemStatementId:'s1', title:'BenefitsBot', frame:'Treat benefits enrollment as a wayfinding problem, not a paperwork problem.', intervention:'A plain-language guide that walks residents through SNAP + Medicaid in one calm flow, piloted at library help desks.', metrics:'Completion rate at 3 pilot branches; intake questions per application.', evidence:'12 resident interviews · 3 librarian shadow shifts · journey map', submittedBy:'m3', votes:[{voterRef:'m4',count:3},{voterRef:'m5',count:2}], status:'open'},
  {id:'p2', problemStatementId:'s2', title:'Ballot Basics', frame:'First-time voting is a social act — information travels through trusted peers, not portals.', intervention:'Peer-shareable local ballot explainers distributed through school and library networks.', metrics:'Share rate; % of recipients who report feeling prepared to vote.', evidence:'Survey of 40 first-time voters · precinct data review', submittedBy:'m4', votes:[{voterRef:'m3',count:2}], status:'open'}
];
let CYCLE_PROJECTS=[];
/* Cross-file cycle state — written by admin.html's Testing Controls, read here at
   boot and live via the storage event. Shape: {formationPhase, projects?}. */
const CYCLE_STATE_KEY='olos.cycleState.v1';
function readCycleState(){ try{ return JSON.parse(localStorage.getItem(CYCLE_STATE_KEY)||'{}')||{}; }catch(e){ return {}; } }
function applyCycleState(){
  const st=readCycleState();
  CYCLE.formationPhase=st.formationPhase||'submission';
  CYCLE.logDueAt=st.logDueAt||null;
  if(Array.isArray(st.projects)&&st.projects.length) CYCLE_PROJECTS=st.projects;
  else if(['tallied','registration','closed'].includes(CYCLE.formationPhase)&&!CYCLE_PROJECTS.length) tallyAndFormProjects();
  const panel=document.getElementById('panel-cycles');
  if(panel&&panel.classList.contains('active')) renderCycleFormation();
  renderTodos();
  applyLogGate();
}
window.addEventListener('storage', e=>{ if(e.key===CYCLE_STATE_KEY) applyCycleState(); });
window.addEventListener('storage', e=>{ if(e.key===USTATE_KEY&&userState.signedIn){ readUserState(); renderTodos(); renderLearningLog(); applyLogGate(); } });
function situationById(id){ return SITUATIONS.find(s=>s.id===id); }
let peopleFilter='all';

function memberById(id){ return MEMBERS.find(m=>m.id===id); }
/* ── Follow — the marketplace's attention primitive. Production: follows table
   (follower_id, followed_id) + ?following=true on the updates feed. ── */
function isFollowing(id){ return userState.following.includes(id); }
function followBtnHTML(m){ const on=isFollowing(m.id); return '<button class="btn '+(on?'btn-ghost-teal':'btn-teal')+' btn-sm" onclick="toggleFollow(\''+m.id+'\',event)">'+(on?'Following ✓':'Follow')+'</button>'; }
function memberMetaText(m){ return m.metro+' · Joined Spring 2026 · '+((m.followers||0)+(isFollowing(m.id)?1:0))+' followers'; }
function verifiedPill(m){ return m.verified?'<span class="status active" title="Vouched for by The Labs — added by the Labs team, not self-serve">✓ Vouched by The Labs</span>':''; }
/* ── Nominations — members surface talent; the Labs team follows up (concierge,
   never gate). Production: nominations table (nominator_id, nominee_name, as_role, reason). ── */
let nominateTarget=null;
function nominateBtnHTML(m){ return '<button class="btn btn-ghost-teal btn-sm" onclick="startNominate(\''+m.id+'\',event)">Nominate</button>'; }
function startNominate(id,e){
  if(e) e.stopPropagation();
  if(!userState.signedIn){ gateCreateAccount('nominations', e); return; }
  const m=id?memberById(id):null; nominateTarget=m||null;
  startFlow('nominate', ()=>goApp(m?'discover':'dashboard'), m?{nominee:m.name}:undefined);
}
function toggleFollow(id,e){
  if(e) e.stopPropagation();
  const i=userState.following.indexOf(id);
  if(i>=0) userState.following.splice(i,1); else userState.following.push(id);
  saveUserState();
  const m=memberById(id);
  // Refresh whichever surface the toggle lives on.
  const pp=document.getElementById('panel-profile'), pn=document.getElementById('prof-name');
  if(pp&&pp.classList.contains('active')&&pn&&pn.textContent===m.name){
    const act=document.getElementById('prof-actions'); if(act) act.innerHTML=followBtnHTML(m)+' <button class="btn btn-ghost-teal btn-sm" onclick="showView(\'stub\')">Say hi in Slack</button>';
    const meta=document.getElementById('prof-meta'); if(meta) meta.textContent=memberMetaText(m);
  }
  if(document.getElementById('disc-people')){ renderDiscPeople(); renderDiscUpdates(); }
}
let updatesFilter='all';
function isSaved(title){ return (userState.saved||[]).some(s=>s.title===title); }
function mediaHTML(item, title){ return '<div class="media '+(item.img?'':(item.grad||'m-teal'))+'" style="aspect-ratio:16/10;">'+(item.img?'<img src="'+item.img+'" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">':ORB)+'<button class="heart'+(isSaved(title)?' saved':'')+'" aria-label="Save" onclick="toggleHeart(event,this)"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg></button><div class="m-tag">'+escHTML(item.tag||'')+'</div></div>'; }
function fmtEvt(e){ const d=new Date(e.start_at); const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]; let h=d.getHours(); const ap=h>=12?'PM':'AM'; h=h%12||12; return mo+' '+d.getDate()+' · '+h+' '+ap; }

/* ── Teaser cards — every card is the metadata for its real page (events/{slug}/,
   library/{slug}/, labs/{slug}/ — generated by tools/generate.js). Cards are real
   <a> links: shareable, middle-clickable, native keyboard. Buttons inside them
   stop propagation AND preventDefault so they don't navigate the anchor. ── */
function eventTeaserHTML(e){
  return '<a class="card tappable" href="'+appRel()+'events/'+e.slug+'/">'+mediaHTML({img:e.img, grad:e.grad, tag:e.kind||(e.location_type==='virtual'?'Virtual':'In person')}, e.name)
    +'<div class="card-body"><div class="lbl lbl-teal">'+fmtEvt(e)+'</div><div class="t-h4" style="margin:6px 0 4px;">'+escHTML(e.name)+'</div><p class="t-small">'+escHTML(e.location_name)+'</p></div></a>';
}
function resourceTeaserHTML(r){
  const typeLabel={guide:'Guide', recording:'Recording', template:'Template', course:'Course', playbook:'Playbook'}[r.content_type]||'Guide';
  const prov=r.from?'<p class="t-small" style="color:var(--teal-deep);font-weight:600;">From the commons · '+escHTML(r.from)+'</p>':'<p class="t-small">'+escHTML(r.author||'The Upskilling Labs')+'</p>';
  return '<a class="card tappable" href="'+appRel()+'library/'+r.slug+'/">'+mediaHTML({img:r.img, grad:r.grad, tag:typeLabel}, r.title)
    +'<div class="card-body"><div class="lbl lbl-teal">'+escHTML(r.meta||'')+'</div><div class="t-h4" style="margin:6px 0 4px;">'+escHTML(r.title)+'</div>'+prov+'</div></a>';
}
function labTeaserHTML(m,i){
  const joined=m.status==='waitlist'&&userState.signedIn&&userState.waitlists.includes(m.slug);
  const pill=m.status==='active'?'<span class="status active">Active</span>':joined?'<span class="status active">On the list ✓</span>':'<span class="status forming">Waitlist open</span>';
  const sub=m.status==='active'?escHTML(m.partner)+' · '+m.members+' members':m.waiting+(m.waiting===1?' person':' people')+' waiting';
  return '<a class="card tappable" href="'+appRel()+'labs/'+m.slug+'/"><div class="media '+GRAD[(i||0)%GRAD.length]+'" style="aspect-ratio:16/9;">'+ORB+'<div class="m-tag">'+(m.slug==='dc'?'Flagship':'')+'</div></div>'
    +'<div class="card-body"><div class="card-row" style="margin-bottom:6px;">'+pill+'</div><div class="t-h4" style="margin-bottom:4px;">'+escHTML(m.name+(m.st&&m.slug!=='dc'?', '+m.st:''))+'</div><p class="t-small">'+sub+'</p></div></a>';
}

/* ── Landing + legacy-panel renderers — the same teaser contract as Discover ── */
function renderLandingEvents(){ const c=document.getElementById('landing-events'); if(!c) return; c.innerHTML=EVENTS.filter(e=>!e.anchor).map(eventTeaserHTML).join(''); }
function renderLandingLibrary(){ const c=document.getElementById('landing-library'); if(!c) return; c.innerHTML=RESOURCES.filter(r=>r.status==='published').slice(0,8).map(resourceTeaserHTML).join(''); }
function renderLandingLabs(){ const c=document.getElementById('landing-labs'); if(!c) return; const list=[METROS.dc, ...Object.values(METROS).filter(m=>m.status==='waitlist').sort((a,b)=>b.waiting-a.waiting).slice(0,3)]; c.innerHTML=list.map(labTeaserHTML).join(''); }
function renderPanelEvents(){ const c=document.getElementById('panel-events-cards'); if(!c) return; c.innerHTML=EVENTS.map(eventTeaserHTML).join(''); enhanceTappables(); }
function renderPanelResources(){ const c=document.getElementById('panel-resources-cards'); if(!c) return; c.innerHTML=RESOURCES.filter(r=>r.status==='published').map(resourceTeaserHTML).join(''); enhanceTappables(); }

/* ── Discover renderers ── */
function renderDiscover(){ renderDiscCycle(); renderDiscEvents(); renderDiscLibrary(); renderDiscPeople(); renderDiscUpdates(); renderDiscLabs(); renderDiscSaved(); enhanceTappables(); }
function renderDiscCycle(){
  const el=document.getElementById('disc-cycle'); if(!el) return;
  el.innerHTML='<div class="cycle-banner s-cover grain on-dark">'+ORB
    +'<div class="cb-body"><span class="cb-status">Registration Open Now</span><div class="lbl lbl-teal" style="margin:14px 0 6px;">Summer 2026 · Washington, DC</div><h3 class="t-h2">Civic &amp; Elections Cycle</h3><p class="t-body" style="margin-top:8px;max-width:52ch;">Kicks off July 14, 2026 · a 13-week cohort shipping a real civic project.</p><a class="see" style="display:inline-block;margin-top:14px;" onclick="startFlow(\'survey\', ()=>goApp(\'discover\'))">Add a field observation →</a></div>'
    +'<div class="cb-cta"><button class="btn btn-red btn-lg" onclick="goApp(\'cycles\')">Join this cycle</button></div></div>';
}
function renderDiscEvents(){
  const c=document.getElementById('disc-events'); if(!c) return;
  c.innerHTML=EVENTS.map(eventTeaserHTML).join('');
}
function renderDiscLibrary(){
  const c=document.getElementById('disc-library'); if(!c) return;
  c.innerHTML=RESOURCES.filter(r=>r.status==='published').map(resourceTeaserHTML).join('');
}
function renderDiscPeople(){
  const chips=document.getElementById('disc-people-chips'); const c=document.getElementById('disc-people'); if(!c) return;
  const cats=[['all','All'],['mentor','Mentors'],['volunteer','Volunteers'],['upskiller','Builders']];
  if(chips) chips.innerHTML=cats.map(([v,l])=>'<button class="chip'+(peopleFilter===v?' active':'')+'" onclick="peopleFilter=\''+v+'\';renderDiscPeople()">'+l+'</button>').join('');
  const list=MEMBERS.filter(m=>peopleFilter==='all'||m.roles.includes(peopleFilter)).slice().sort((a,b)=>peopleFilter==='mentor'?((b.verified?1:0)-(a.verified?1:0)):0);
  const jitNote=peopleFilter==='mentor'?'<div class="lcard" style="padding:14px 18px;margin-bottom:16px;background:var(--tint);"><span class="t-small"><b>Working on a project?</b> Mentors respond to evidence-backed requests, not cold asks — <a class="see" onclick="startFlow(\'mentorRequest\', ()=>goApp(\'discover\'))">request a mentor →</a></span></div>':'';
  c.innerHTML=jitNote+list.map(m=>'<div class="card tappable" onclick="showMemberProfile(\''+m.id+'\')"><div class="card-body"><div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;"><span class="avatar-lg" style="width:52px;height:52px;font-size:18px;flex-shrink:0;">'+m.initials+'</span><div style="min-width:0;flex:1;"><div class="t-h4">'+escHTML(m.name)+(m.verified?' <span title="Vouched for by The Labs" style="color:var(--teal-deep);">✓</span>':'')+'</div><p class="t-small" style="color:var(--teal-deep);font-weight:600;">'+escHTML(m.headline)+'</p></div><div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">'+followBtnHTML(m)+nominateBtnHTML(m)+'</div></div><p class="t-small" style="margin-bottom:12px;">'+escHTML(m.metro)+' · '+((m.followers||0)+(isFollowing(m.id)?1:0))+' followers'+(m.handle?' · <a class="see" href="'+appRel()+'people/'+m.handle+'/" onclick="event.stopPropagation()">Public page ↗</a>':'')+'</p><div class="tag-wrap">'+m.roles.map(r=>'<span class="tag-btn active" style="pointer-events:none;">'+(r==='upskiller'?'Builder':r[0].toUpperCase()+r.slice(1))+'</span>').join('')+'</div></div></div>').join('');
  enhanceTappables();
}
function allUpdates(){
  const out=[];
  MEMBERS.forEach(m=>(m.updates||[]).forEach(u=>out.push({who:m.name, initials:m.initials, memberId:m.id, body:u.body, at:u.at})));
  (userState.updates||[]).forEach(u=>out.push({who:userState.name+' (you)', initials:userState.initials, memberId:null, body:u.body, at:u.at}));
  return out.sort((a,b)=>b.at-a.at);
}
function renderDiscUpdates(){
  const c=document.getElementById('disc-updates'); if(!c) return;
  const chips=document.getElementById('disc-updates-chips');
  if(chips) chips.innerHTML=[['all','All'],['following','Following']].map(([v,l])=>'<button class="chip'+(updatesFilter===v?' active':'')+'" onclick="updatesFilter=\''+v+'\';renderDiscUpdates()">'+l+'</button>').join('');
  let list=allUpdates();
  if(updatesFilter==='following'){ list=list.filter(u=>u.memberId&&isFollowing(u.memberId));
    if(!list.length){ c.innerHTML='<div class="lcard" style="padding:18px 20px;"><p class="t-small" style="color:var(--meta);">You\u2019re not following anyone yet — follow mentors and builders from the community directory to see their work here first.</p></div>'; return; } }
  c.innerHTML=list.slice(0,6).map(u=>'<div class="lcard" style="padding:18px 20px;'+(u.memberId?'cursor:pointer;':'')+'" '+(u.memberId?'onclick="showMemberProfile(\''+u.memberId+'\')"':'')+'><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'+avatarSm(u.initials,u.who)+'<div><div class="t-h4" style="font-size:14px;">'+escHTML(u.who)+'</div><div class="t-small" style="color:var(--meta);">'+relDate(u.at)+'</div></div></div><p class="t-small">'+escHTML(u.body)+'</p></div>').join('');
}
function renderDiscLabs(){
  const c=document.getElementById('disc-labs'); if(!c) return;
  // The active lab first, then the three busiest waitlists — each card links to its real labs/{slug}/ page.
  const list=[METROS.dc, ...Object.values(METROS).filter(m=>m.status==='waitlist').sort((a,b)=>b.waiting-a.waiting).slice(0,3)];
  c.innerHTML=list.map(labTeaserHTML).join('');
}
function renderDiscSaved(){
  const wrap=document.getElementById('disc-saved-wrap'); const c=document.getElementById('disc-saved'); if(!wrap||!c) return;
  const items=userState.saved||[];
  if(!items.length){ wrap.style.display='none'; c.innerHTML=''; return; }
  wrap.style.display='block';
  c.innerHTML=items.map(s=>'<div class="card tappable" onclick="goApp(\'bookmarks\')"><div class="card-body"><div class="lbl lbl-teal" style="margin-bottom:6px;">'+escHTML(s.kind||'Saved')+'</div><div class="t-h4">'+escHTML(s.title)+'</div>'+(s.meta?'<p class="t-small" style="margin-top:4px;">'+escHTML(s.meta)+'</p>':'')+'</div></div>').join('');
}

/* ── Metro search + waitlists — the labs page filters METROS live as you type.
   Two states: 'active' (go to your lab) or 'waitlist' (join it). A query that
   matches nothing offers "start the waitlist" — the creator is name #1.
   Joining and creating require an account (owner decision) — anonymous visitors
   route through gateCreateAccount and the pending* vars finish the job after signup.
   Backend: metros + metro_waitlist_signups (docs §1.1/§1.1b). */
let metroQuery='';
let pendingWaitlist=null;        // metro slug to open the join modal for after signup
let pendingWaitlistCreate=null;  // city name an anonymous visitor tried to start a waitlist for
const titleCity=s=>s.trim().replace(/\s+/g,' ').split(' ').map(w=>w?w[0].toUpperCase()+w.slice(1).toLowerCase():'').join(' ');
function metroMatches(q){
  const n=q.trim().toLowerCase();
  let list=Object.values(METROS);
  if(n) list=list.filter(m=>m.name.toLowerCase().includes(n)||(m.name+', '+m.st).toLowerCase().includes(n)||(m.st||'').toLowerCase()===n);
  return list.sort((a,b)=>(a.status==='active'?-1:b.status==='active'?1:(b.waiting||0)-(a.waiting||0)));
}
function metroCardHTML(m,i){
  const joined=m.status==='waitlist'&&userState.signedIn&&userState.waitlists.includes(m.slug);
  const title=escHTML(m.name+(m.st&&m.slug!=='dc'?', '+m.st:''));
  // Cards are real links to labs/{slug}/ — except runtime-created metros (m.founded),
  // which have no generated page until they're added to labs/data.js and the generator runs.
  const wrap=m.founded?['<div class="card tappable" onclick="openWaitlistJoin(\''+m.slug+'\')">','</div>']
    :['<a class="card tappable" href="'+appRel()+'labs/'+m.slug+'/">','</a>'];
  if(m.status==='active'){
    // Buttons inside a link-card: stop propagation AND preventDefault so the anchor doesn't navigate.
    const go=userState.signedIn?"goApp('cycles')":"gateCreateAccount('the DC lab',event)";
    return wrap[0]+'<div class="media '+GRAD[i%GRAD.length]+'" style="aspect-ratio:16/9;">'+ORB+'<div class="m-tag">Flagship</div></div>'
      +'<div class="card-body"><div class="card-row" style="margin-bottom:6px;"><span class="status active">Active</span></div><div class="t-h4" style="margin-bottom:4px;">'+title+'</div>'
      +'<p class="t-small">'+escHTML(m.partner)+' · '+m.members+' members</p>'
      +'<button class="btn btn-teal btn-sm btn-block" style="margin-top:14px;" onclick="event.stopPropagation();event.preventDefault();'+go+'">'+(userState.signedIn?'Go to your lab':'Join this lab')+'</button></div>'+wrap[1];
  }
  const waitingLine=m.waiting+(m.waiting===1?' person waiting':' people waiting');
  const sub=joined?'You’re on the list · '+waitingLine:(m.partner?escHTML(m.partner)+' · ':'')+waitingLine;
  const pill=joined?'<span class="status active">On the list ✓</span>':'<span class="status forming">Waitlist open</span>';
  return wrap[0]+'<div class="media '+GRAD[i%GRAD.length]+'" style="aspect-ratio:16/9;">'+ORB+(joined?'<div class="m-tag">On the list</div>':'')+'</div>'
    +'<div class="card-body"><div class="card-row" style="margin-bottom:6px;">'+pill+'</div><div class="t-h4" style="margin-bottom:4px;">'+title+'</div>'
    +'<p class="t-small">'+sub+'</p>'
    +(joined?'':'<button class="btn btn-teal btn-sm btn-block" style="margin-top:14px;" onclick="event.preventDefault();openWaitlistJoin(\''+m.slug+'\',event)">Join the waitlist</button>')
    +'</div>'+wrap[1];
}
function createCardHTML(){
  // The create button reads the module metroQuery — never inline the raw typed string into onclick.
  const city=escHTML(titleCity(metroQuery));
  return '<div class="lcard" style="padding:28px;grid-column:1/-1;">'
    +'<div class="t-h3" style="margin-bottom:6px;">We’re not in '+city+' yet.</div>'
    +'<p class="t-body" style="margin-bottom:16px;">Be the first name on the list. Enough names, and we come.</p>'
    +'<button class="btn btn-teal" onclick="startWaitlistCreate(event)">Start the '+city+' waitlist</button></div>';
}
function renderMetroList(resultsId,countId,inputId,opts){
  const c=document.getElementById(resultsId); if(!c) return;
  const inp=document.getElementById(inputId); if(inp&&inp.value!==metroQuery) inp.value=metroQuery;
  const q=metroQuery.trim();
  const count=document.getElementById(countId);
  // Landing variant (showAll:false): the curated cards cover the resting state — render only once typing starts.
  if(!q&&!(opts&&opts.showAll)){ if(count) count.textContent=''; c.innerHTML=''; return; }
  const list=metroMatches(metroQuery);
  if(count) count.textContent=q?(list.length?list.length+(list.length===1?' city':' cities'):'No lab here yet'):'Every city, active lab first';
  c.innerHTML=list.map(metroCardHTML).join('')+(!list.length&&q.length>=2?createCardHTML():'');
  enhanceTappables(); // standalone re-render — keyboard access for the fresh cards
}
function renderMetroResults(){
  renderMetroList('metro-results','metro-count','metro-search-input',{showAll:true});           // labs panel (members)
  renderMetroList('landing-metro-results','landing-metro-count','landing-metro-input',{showAll:false}); // public landing search
}
function metroSearchEnter(){
  const list=metroMatches(metroQuery);
  if(list.length===1){ if(list[0].status==='active'){ userState.signedIn?goApp('cycles'):gateCreateAccount('the DC lab'); } else openWaitlistJoin(list[0].slug); }
  else if(!list.length&&metroQuery.trim().length>=2) startWaitlistCreate();
}

/* Join — the modal carries the moment: we're not there yet, N people want it, one tap.
   City first, account second (owner decision): anonymous visitors see this modal too;
   the join tap commits the city (pendingWaitlist), THEN routes into account creation. */
function openWaitlistJoin(slug,e){ if(e) e.stopPropagation();
  const m=METROS[slug]; if(!m) return;
  if(userState.signedIn&&userState.waitlists.includes(slug)){ showWaitlistDone(slug); return; }
  document.getElementById('wl-eyebrow').textContent=m.name+(m.st&&m.slug!=='dc'?', '+m.st:'')+' · Waitlist';
  document.getElementById('wl-title').textContent='We’re not in '+m.name+' yet.';
  document.getElementById('wl-ctx').textContent=m.waiting+' '+(m.waiting===1?'person wants':'people want')+' a '+m.name+' lab. Add your name — we’ll email you the day it ignites.';
  document.getElementById('wl-fine').textContent=userState.signedIn
    ?'One tap. One email when it happens. That’s it.'
    :'Takes a free account — sign in with Google and your name goes on the list.';
  document.getElementById('wl-join-btn').onclick=userState.signedIn
    ?()=>confirmWaitlistJoin(slug)
    :()=>{ pendingWaitlist=slug; closeWaitlist(); gateCreateAccount('the '+m.name+' waitlist'); };
  document.getElementById('wl-body').style.display='block'; document.getElementById('wl-done').style.display='none';
  document.getElementById('waitlist-modal').classList.add('open');
}
function confirmWaitlistJoin(slug){
  const m=METROS[slug]; if(!m||userState.waitlists.includes(slug)) return;
  m.waiting++; userState.waitlists.push(slug); writeSession();
  showWaitlistDone(slug);
  renderMetroResults(); renderDiscLabs(); renderLandingLabs(); renderTodos(); renderCredBand();
}
function showWaitlistDone(slug,founded){
  const m=METROS[slug]; if(!m) return;
  document.getElementById('wl-done-title').textContent=founded?'The '+m.name+' waitlist is live ✓':'You’re on the list ✓';
  document.getElementById('wl-done-body').textContent=founded
    ?'You’re number 1. Every lab started with one name. Tell your people — the list is how we pick the next city.'
    :'You’re number '+m.waiting+' in '+m.name+'. We’ll email you when '+m.name+' ignites. Nothing else to do.';
  document.getElementById('wl-body').style.display='none'; document.getElementById('wl-done').style.display='block';
  document.getElementById('waitlist-modal').classList.add('open');
}
function closeWaitlist(){ document.getElementById('waitlist-modal').classList.remove('open'); }

/* Create — free-text: any city can start a list. Production: POST /api/labs
   creates the metro row + the creator's signup in one transaction. */
function startWaitlistCreate(e){ if(e) e.stopPropagation();
  const name=titleCity(metroQuery); if(!name) return;
  if(!userState.signedIn){ pendingWaitlistCreate=name; gateCreateAccount('the '+name+' waitlist', e); return; }
  createWaitlistMetro(name);
}
function createWaitlistMetro(name){
  const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if(!slug) return;
  if(METROS[slug]){ metroQuery=METROS[slug].name; renderMetroResults(); openWaitlistJoin(slug); return; } // typed a city that already exists
  METROS[slug]={slug, name, st:'', status:'waitlist', waiting:1, founded:true};
  userState.waitlists.push(slug); writeSession();
  metroQuery=name;
  showWaitlistDone(slug, true);
  renderMetroResults(); renderDiscLabs(); renderLandingLabs(); renderTodos(); renderCredBand();
}
function consumePendingWaitlist(){
  if(!userState.signedIn) return;
  if(pendingWaitlistCreate){ const n=pendingWaitlistCreate; pendingWaitlistCreate=null; createWaitlistMetro(n); return; }
  // The city was committed pre-auth — finish the join without asking twice.
  if(pendingWaitlist){ const s=pendingWaitlist; pendingWaitlist=null; if(METROS[s]) confirmWaitlistJoin(s); }
}

/* ── Formation engine — the phase (from olos.cycleState.v1) picks the renderer:
   submission → proposal upsert · voting → budget ballot · tallied → naming beat ·
   registration/closed → team cards. Teams become real when registration reaches
   projectMin — that is the only ignition. */
function inCycle(){ return !!(userState.signedIn&&userState.completed&&userState.completed.cycle); }
function inProject(){ return !!userState.projectId; }
function myProposal(){ return SOLUTION_PROPOSALS.find(p=>p.submittedBy==='you'); }
function sumVotes(p){ return (p.votes||[]).reduce((a,v)=>a+v.count,0); }
function myVoteBudget(){ return myProposal()?CYCLE_CONFIG.submitterVotes:CYCLE_CONFIG.nonSubmitterVotes; }
const CHEV='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
function renderCycleSituations(){
  const c=document.getElementById('cycle-situations'); if(!c) return;
  c.innerHTML=SITUATIONS.map(s=>{
    return '<div class="card expandable tappable" onclick="toggleExpand(this,event)"><div class="card-body">'
      +'<div class="card-row"><div class="lbl lbl-teal">Brought by '+escHTML(s.owner)+'</div><span class="card-chev">'+CHEV+'</span></div>'
      +'<div class="t-h3" style="margin:8px 0 8px;">'+escHTML(s.title)+'</div>'
      +'<p class="t-small" style="margin-bottom:10px;">'+escHTML(s.line||'')+'</p>'
      +'<span class="status">Voting closed</span>'
      +'</div><div class="card-expand"><div class="kv"><span class="k lbl">The situation</span><span class="t-small">'+escHTML(s.context)+'</span></div>'
      +'<div class="kv"><span class="k lbl">Where it came from</span><span class="t-small">'+escHTML(s.origin)+'</span></div>'
      +'<p class="t-small" style="color:var(--meta);">This cycle\u2019s situations are settled — next, the Hackathon turns them into proposals for what to build.</p>'
      +'</div></div>';
  }).join('');
  enhanceTappables();
}
const FORMATION_COPY={
  submission:{eyebrow:'From the Hackathon · solution proposals', head:'Given what we now understand, what should we build?', sub:'A proposal is a problem plus a new way of seeing it. Get yours in before voting opens \u2014 submitters vote with '+CYCLE_CONFIG.submitterVotes+' votes, everyone else with '+CYCLE_CONFIG.nonSubmitterVotes+'.'},
  voting:{eyebrow:'Budget voting · one ballot per member', head:'Back the proposals you believe in', sub:'Spread your votes or stack them — a proposal needs '+CYCLE_CONFIG.voteThreshold+' votes to form a project. Your ballot locks when you cast it.'},
  tallied:{eyebrow:'Votes are in', head:'\u2728 Naming the winning proposals\u2026', sub:'The tally is done. Winning proposals become named project teams — registration opens next.'},
  registration:{eyebrow:'Project registration · self-serve', head:'Join a project team', sub:'Teams are real at '+CYCLE_CONFIG.projectMin+' members and cap at '+CYCLE_CONFIG.projectMax+'. One project per member — pick where you\u2019ll build.'},
  closed:{eyebrow:'Cycle formation · closed', head:'Teams are formed', sub:'Registration has closed for this cycle. The teams below are building toward Showcase.'}
};
function renderCycleFormation(){
  const body=document.getElementById('formation-body'); if(!body) return;
  const phase=CYCLE.formationPhase||'submission';
  const copy=FORMATION_COPY[phase]||FORMATION_COPY.submission;
  document.getElementById('formation-eyebrow').textContent=copy.eyebrow;
  document.getElementById('formation-head').textContent=copy.head;
  document.getElementById('formation-sub').textContent=copy.sub;
  const note=document.getElementById('formation-note');
  note.innerHTML=(!inCycle()&&phase!=='tallied')
    ? '<div class="lcard" style="padding:16px 20px;margin-bottom:20px;background:var(--tint);"><span class="t-small" style="color:var(--teal-deep);font-weight:600;">Formation is for cycle members.</span> <span class="t-small">Register for this cycle to submit a proposal, vote on the ballot, and join a project team.</span> <a class="see" style="display:inline-block;margin-left:6px;" onclick="'+(userState.signedIn?'startCycleRegistration(()=>goApp(\'cycles\'))':'gateCreateAccount(\'the Civic &amp; Elections Cycle\',event)')+'">'+(userState.signedIn?'Register for the cycle →':'Create an account →')+'</a></div>' : '';
  // Preserve expanded cards across re-renders (the ballot re-renders on every stepper tap).
  const expanded=[...body.querySelectorAll('.card.expanded')].map(el=>el.dataset.pid).filter(Boolean);
  if(phase==='submission') renderProposalSubmission(body);
  else if(phase==='voting') renderSolutionBallot(body);
  else if(phase==='tallied') renderTallied(body);
  else renderProjectRegistration(body, phase==='closed');
  expanded.forEach(pid=>{ const el=body.querySelector('.card[data-pid="'+pid+'"]'); if(el) el.classList.add('expanded'); });
  enhanceTappables();
}
function proposalCardHTML(p, extra, expandExtra){
  const s=situationById(p.problemStatementId)||{};
  return '<div class="card expandable tappable" data-pid="'+p.id+'" onclick="toggleExpand(this,event)"><div class="card-body">'
    +'<div class="card-row"><div class="lbl lbl-teal">From \u201c'+escHTML(s.title||'')+'\u201d · '+escHTML(s.owner||'')+'</div><span class="card-chev">'+CHEV+'</span></div>'
    +'<div class="t-h3" style="margin:8px 0 6px;">'+escHTML(p.title)+'</div>'
    +'<p class="t-body" style="color:var(--teal-deep);font-weight:600;margin-bottom:10px;">'+escHTML(p.frame)+'</p>'
    +(extra||'')
    +'</div><div class="card-expand">'
    +'<div class="kv"><span class="k lbl">Intervention</span><span class="t-small">'+escHTML(p.intervention)+'</span></div>'
    +'<div class="kv"><span class="k lbl">Metrics</span><span class="t-small">'+escHTML(p.metrics)+'</span></div>'
    +'<div class="kv"><span class="k lbl">Evidence</span><span class="t-small">'+escHTML(p.evidence)+'</span></div>'
    +(expandExtra||'')
    +'</div></div>';
}
/* Phase: submission — one proposal per member, UPSERT via the flow engine. */
function renderProposalSubmission(body){
  const mine=myProposal();
  const mineCard = inCycle() ? (mine
    ? '<div class="lcard" style="padding:20px 24px;margin-bottom:20px;"><div class="lbl lbl-teal" style="margin-bottom:6px;">Your proposal · submitted</div><div class="t-h4" style="margin-bottom:4px;">'+escHTML(mine.title)+'</div><p class="t-small" style="margin-bottom:12px;">'+escHTML(mine.frame)+'</p><button class="btn btn-ghost-teal btn-sm" onclick="editMyProposal()">Edit proposal</button></div>'
    : '<div class="lcard" style="padding:20px 24px;margin-bottom:20px;"><div class="lbl lbl-teal" style="margin-bottom:6px;">Your proposal</div><p class="t-small" style="margin-bottom:12px;">One proposal per member. Submitters vote with '+CYCLE_CONFIG.submitterVotes+' votes when voting opens.</p><button class="btn btn-teal btn-sm" onclick="startProposalFlow()">Submit a proposal</button></div>') : '';
  const others=SOLUTION_PROPOSALS.filter(p=>p.submittedBy!=='you');
  body.innerHTML=mineCard
    +(others.length?'<div class="cards two">'+others.map(p=>proposalCardHTML(p,'<span class="status soon">Awaiting the vote</span>')).join('')+'</div>'
      :'<div class="lcard" style="padding:18px 20px;"><p class="t-small" style="color:var(--meta);">No proposals yet — the Hackathon is where they emerge.</p></div>');
}
function startProposalFlow(){ startFlow('solutionProposal', ()=>goApp('cycles')); }
function editMyProposal(){ const m=myProposal(); if(m) startFlow('solutionProposal', ()=>goApp('cycles'), {title:m.title, frame:m.frame, intervention:m.intervention, metrics:m.metrics, evidence:m.evidence}); }
/* Phase: voting — a budget ballot. pendingVotes holds the draft; casting locks it. */
let pendingVotes={};
function pendingTotal(){ return Object.values(pendingVotes).reduce((a,b)=>a+b,0); }
function renderSolutionBallot(body){
  const member=inCycle(); const cast=userState.ballot; const budget=myVoteBudget(); const remaining=budget-pendingTotal();
  const bar=!member?'':(cast
    ? '<div class="lcard" style="padding:16px 20px;margin-bottom:20px;background:var(--tint);" aria-live="polite"><span class="t-small" style="color:var(--teal-deep);font-weight:600;">Ballot cast ✓</span> <span class="t-small">Your '+budget+' votes are in — ballots lock once cast. The tally lands when the window closes.</span></div>'
    : '<div class="lcard" id="ballot-bar" style="padding:16px 20px;margin-bottom:20px;position:sticky;top:12px;z-index:5;display:flex;align-items:center;gap:16px;flex-wrap:wrap;" aria-live="polite"><div style="flex:1;min-width:200px;"><div class="t-h4" style="margin-bottom:2px;"><span id="votes-remaining">'+remaining+'</span> of '+budget+' votes left</div><p class="t-small" style="color:var(--meta);">'+(myProposal()?'Submitters vote with '+CYCLE_CONFIG.submitterVotes:'Members vote with '+CYCLE_CONFIG.nonSubmitterVotes)+' · a proposal needs '+CYCLE_CONFIG.voteThreshold+' votes to form</p></div><button class="btn btn-teal" id="ballot-submit" '+(pendingTotal()===0?'disabled':'')+' onclick="openBallotConfirm()">Cast ballot</button></div>');
  if(!SOLUTION_PROPOSALS.length){ body.innerHTML='<div class="lcard" style="padding:18px 20px;"><p class="t-small" style="color:var(--meta);">No proposals made it to the ballot — the Hackathon is where they emerge.</p></div>'; return; }
  body.innerHTML=bar+'<div class="cards two">'+SOLUTION_PROPOSALS.map(p=>{
    const yours=cast?(cast.allocations[p.id]||0):(pendingVotes[p.id]||0);
    const total=sumVotes(p)+(cast?0:yours);
    const pct=Math.min(100, Math.round(total/CYCLE_CONFIG.voteThreshold*100));
    const gauge='<div style="height:6px;background:var(--rule-soft);overflow:hidden;margin:12px 0 6px;"><div style="height:100%;width:'+pct+'%;background:var(--teal);"></div></div><span class="lbl">'+total+' of '+CYCLE_CONFIG.voteThreshold+' votes to form</span>';
    const minePill=p.submittedBy==='you'?'<span class="status active" style="margin-left:8px;">Yours</span>':'';
    const stepper=(!member||cast)
      ? (yours?'<p class="t-small" style="color:var(--teal-deep);font-weight:600;margin-top:10px;">Your allocation: '+yours+' vote'+(yours>1?'s':'')+'</p>':'')
      : '<div style="display:flex;align-items:center;gap:10px;margin-top:12px;" onclick="event.stopPropagation()"><button class="btn btn-ghost-teal btn-sm" aria-label="Remove a vote from '+escHTML(p.title)+'" '+(yours===0?'disabled':'')+' onclick="voteStep(\''+p.id+'\',-1,event)">−</button><span class="t-h4" style="min-width:24px;text-align:center;">'+yours+'</span><button class="btn btn-ghost-teal btn-sm" aria-label="Add a vote to '+escHTML(p.title)+'" '+(remaining===0?'disabled':'')+' onclick="voteStep(\''+p.id+'\',1,event)">+</button><span class="t-small" style="color:var(--meta);">your votes</span></div>';
    return proposalCardHTML(p, minePill+gauge+stepper);
  }).join('')+'</div>';
}
function voteStep(id,delta,e){
  if(e) e.stopPropagation();
  if(userState.ballot||!inCycle()) return;
  const cur=pendingVotes[id]||0;
  if(delta>0&&pendingTotal()>=myVoteBudget()) return;
  const next=Math.max(0,cur+delta); if(next===cur) return;
  if(next===0) delete pendingVotes[id]; else pendingVotes[id]=next;
  renderCycleFormation();
}
function openBallotConfirm(){
  if(!pendingTotal()) return;
  document.getElementById('ballot-summary').innerHTML=Object.entries(pendingVotes).map(([id,n])=>{
    const p=SOLUTION_PROPOSALS.find(x=>x.id===id);
    return '<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--rule);"><span class="t-small" style="color:var(--ink);">'+escHTML(p?p.title:id)+'</span><span class="t-small" style="font-weight:600;">'+n+' vote'+(n>1?'s':'')+'</span></div>';
  }).join('');
  document.getElementById('ballot-confirm').classList.add('open');
}
function closeBallotConfirm(){ document.getElementById('ballot-confirm').classList.remove('open'); }
function confirmBallot(){
  if(!pendingTotal()) return;
  Object.entries(pendingVotes).forEach(([id,n])=>{ const p=SOLUTION_PROPOSALS.find(x=>x.id===id); if(p) p.votes.push({voterRef:'you',count:n}); });
  userState.ballot={allocations:{...pendingVotes}, at:Date.now()};
  saveUserState();
  pendingVotes={};
  closeBallotConfirm();
  renderCycleFormation(); renderTodos();
}
/* Phase: tallied — the naming beat. OLOS names new projects with an LLM at tally
   time (lib/llm/names.ts); the prototype fakes it deterministically. */
const TEAM_WORDS=['Wayfinder','Beacon','Relay','Lantern','Compass','Cairn','Meridian','Prism'];
function generateProjectName(p){ let h=0; for(const ch of p.title) h=(h*31+ch.charCodeAt(0))%997; return 'Team '+TEAM_WORDS[h%TEAM_WORDS.length]; }
function tallyAndFormProjects(){
  const podSize=MEMBERS.length+1;
  const cap=Math.min(CYCLE_CONFIG.maxProjects, Math.floor(podSize/CYCLE_CONFIG.projectMin));
  const winners=SOLUTION_PROPOSALS.filter(p=>sumVotes(p)>=CYCLE_CONFIG.voteThreshold)
    .sort((a,b)=>sumVotes(b)-sumVotes(a)).slice(0,cap);
  SOLUTION_PROPOSALS.forEach(p=>{ p.status=winners.includes(p)?'formed':'tallied'; });
  const taken=new Set();
  CYCLE_PROJECTS=winners.map(p=>{
    // Seed two already-registered pod members per team so self-serve registration
    // has real momentum (and your join can tip a team past projectMin).
    const candidates=[p.submittedBy, ...(p.votes||[]).map(v=>v.voterRef), ...MEMBERS.map(m=>m.id)]
      .filter(r=>r&&r!=='you'&&!taken.has(r)&&memberById(r));
    const seed=[...new Set(candidates)].slice(0,2);
    seed.forEach(r=>taken.add(r));
    return { id:'proj-'+p.id, proposalId:p.id, name:generateProjectName(p), title:p.title,
      frame:p.frame, intervention:p.intervention, metrics:p.metrics, evidence:p.evidence,
      problemStatementId:p.problemStatementId, members:seed.map(r=>({ref:r})),
      min:CYCLE_CONFIG.projectMin, max:CYCLE_CONFIG.projectMax };
  });
  return CYCLE_PROJECTS;
}
function renderTallied(body){
  const ranked=SOLUTION_PROPOSALS.slice().sort((a,b)=>sumVotes(b)-sumVotes(a));
  body.innerHTML='<div class="lcard" style="padding:20px 24px;margin-bottom:20px;background:var(--tint);"><span class="t-small" style="color:var(--teal-deep);font-weight:600;">\u2728 Naming projects\u2026</span> <span class="t-small">Winning proposals get named and become project teams. Registration opens when the Labs team flips the window.</span></div>'
    +ranked.map(p=>{ const v=sumVotes(p); const formed=v>=CYCLE_CONFIG.voteThreshold;
      return '<div class="lcard" style="padding:18px 22px;margin-bottom:12px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;"><div style="flex:1;min-width:200px;"><div class="t-h4">'+escHTML(p.title)+'</div><p class="t-small" style="color:var(--meta);">'+v+' vote'+(v===1?'':'s')+(p.submittedBy==='you'?' · yours':'')+'</p></div>'+(formed?'<span class="status active">Forms a project</span>':'<span class="status">Below threshold</span>')+'</div>'; }).join('');
}
/* Phase: registration/closed — self-serve team cards. Ignition fires the first
   time a team reaches projectMin. */
function renderProjectRegistration(body, closed){
  if(!CYCLE_PROJECTS.length){ body.innerHTML='<div class="lcard" style="padding:18px 20px;"><p class="t-small" style="color:var(--meta);">Voting didn\u2019t form any projects this round — the Labs team will re-open proposals.</p></div>'; return; }
  body.innerHTML='<div class="cards two">'+CYCLE_PROJECTS.map(pr=>{
    const n=pr.members.length; const youIn=pr.members.some(m=>m.ref==='you'); const full=n>=pr.max;
    const roster=pr.members.map(m=>{ const isYou=m.ref==='you'; const mm=isYou?userState:memberById(m.ref); return avatarSm(isYou?userState.initials:(mm?mm.initials:'?'), isYou?userState.name+' (you)':(mm?mm.name:'Member')); }).join('');
    const state = youIn?'<p class="t-small" style="color:var(--teal-deep);font-weight:600;">You\u2019re on this team'+(n>=pr.min?' — it\u2019s real.':' · '+(pr.min-n)+' more to reach '+pr.min+'.')+'</p><button class="btn btn-teal btn-block" style="margin-top:10px;" onclick="event.stopPropagation();openProjectCanvas(\''+pr.id+'\')">Open the project canvas →</button>'
      : closed?'<p class="t-small" style="color:var(--meta);">Registration closed.</p>'
      : full?'<p class="t-small" style="color:var(--meta);">Team full ('+pr.max+').</p>'
      : inProject()?'<p class="t-small" style="color:var(--meta);">One project per member — you\u2019re on '+escHTML((CYCLE_PROJECTS.find(x=>x.id===userState.projectId)||{}).name||'a team')+'.</p>'
      : inCycle()?'<button class="btn btn-teal btn-block" onclick="event.stopPropagation();registerForProject(\''+pr.id+'\')">Join this team</button>'
      : '<p class="t-small" style="color:var(--meta);">Cycle members can register.</p>';
    return '<div class="card expandable tappable" data-pid="'+pr.id+'" onclick="toggleExpand(this,event)"><div class="card-body">'
      +'<div class="card-row"><div class="lbl lbl-teal">'+escHTML(pr.name)+'</div><span class="card-chev">'+CHEV+'</span></div>'
      +'<div class="t-h3" style="margin:8px 0 6px;">'+escHTML(pr.title)+'</div>'
      +'<p class="t-body" style="color:var(--teal-deep);font-weight:600;margin-bottom:10px;">'+escHTML(pr.frame)+'</p>'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><div style="display:flex;gap:6px;">'+roster+'</div><span class="lbl" style="margin-left:6px;">'+n+' of '+pr.max+' · real at '+pr.min+'</span></div>'
      +state
      +'</div><div class="card-expand">'
      +'<div class="kv"><span class="k lbl">Intervention</span><span class="t-small">'+escHTML(pr.intervention)+'</span></div>'
      +'<div class="kv"><span class="k lbl">Metrics</span><span class="t-small">'+escHTML(pr.metrics)+'</span></div>'
      +'<div class="kv"><span class="k lbl">Evidence</span><span class="t-small">'+escHTML(pr.evidence)+'</span></div>'
      +'</div></div>';
  }).join('')+'</div>';
}
function registerForProject(id){
  const pr=CYCLE_PROJECTS.find(x=>x.id===id);
  if(!pr||pr.members.some(m=>m.ref==='you')||pr.members.length>=pr.max) return;
  if(!userState.signedIn){ gateCreateAccount('a project team', null); return; }
  if(!inCycle()){ startCycleRegistration(()=>goApp('cycles')); return; }
  if(userState.projectId) return; // one project per member
  pr.members.push({ref:'you'});
  userState.projectId=pr.id; saveUserState();
  renderTodos();
  if(pr.members.length>=pr.min&&!pr.ignited){
    pr.ignited=true;
    document.getElementById('ignition-copy').textContent='\u201c'+pr.title+'\u201d reached '+pr.members.length+' members — '+pr.name+' is live.';
    showView('team-ignition');
  } else renderCycleFormation();
}
function openProjectCanvas(id){
  const pr=(id&&CYCLE_PROJECTS.find(x=>x.id===id))||CYCLE_PROJECTS.find(x=>x.members.some(m=>m.ref==='you'))||CYCLE_PROJECTS[0];
  if(!pr){ goApp('cycles'); return; }
  const s=situationById(pr.problemStatementId)||{};
  document.getElementById('pc-situation').textContent=s.title||'';
  document.getElementById('pc-title').textContent=pr.title;
  document.getElementById('pc-teamname').textContent=pr.name;
  document.getElementById('pc-frame').textContent=pr.frame;
  document.getElementById('pc-intervention').textContent=pr.intervention;
  document.getElementById('pc-metrics').textContent=pr.metrics;
  document.getElementById('pc-evidence').textContent=pr.evidence;
  document.getElementById('pc-owner').textContent=s.owner||'';
  const roster=document.getElementById('pc-roster');
  const cells=[];
  for(let i=0;i<pr.max;i++){
    const c=pr.members[i];
    if(c){ const isYou=c.ref==='you'; const m=isYou?userState:(memberById(c.ref)||{initials:'?',name:'Member'});
      cells.push('<div class="lcard" style="padding:16px;display:flex;align-items:center;gap:12px;min-width:200px;">'+avatarSm(isYou?userState.initials:m.initials, isYou?userState.name:m.name)+'<div><div class="t-h4" style="font-size:14px;">'+escHTML(isYou?userState.name+' (you)':m.name)+'</div><div class="t-small" style="color:var(--teal-deep);font-weight:600;">Builder</div></div></div>'); }
    else cells.push('<div class="lcard" style="padding:16px;display:flex;align-items:center;gap:12px;min-width:200px;border-style:dashed;opacity:.7;"><span style="width:32px;height:32px;border-radius:50%;border:2px dashed var(--meta-soft);flex-shrink:0;"></span><div class="t-small">Open seat</div></div>');
  }
  roster.innerHTML=cells.join('');
  showView('project-canvas');
}

/* ── Member profiles (directory → visitor view) ── */
function showMemberProfile(id){
  // Visitor-mode profiles live on directory/?u={id} (production: /u/[handle]) —
  // every other page hands off to it.
  if(window.APP_PAGE!=='directory'){ location.href=appRel()+'directory/index.html?u='+encodeURIComponent(id); return; }
  const m=memberById(id); if(!m) return;
  viewingMemberProfile=true;
  renderActivity();
  document.getElementById('prof-avatar').textContent=m.initials;
  document.getElementById('prof-name').textContent=m.name;
  document.getElementById('prof-headline').textContent=m.headline;
  document.getElementById('prof-meta').textContent=memberMetaText(m);
  const bio=document.getElementById('prof-bio'); if(bio) bio.innerHTML=escHTML(m.bio);
  renderBadges(true); // established mock members show the earned treatment
  if(m.verified){ const b=document.getElementById('prof-badges'); if(b) b.insertAdjacentHTML('afterbegin', verifiedPill(m)); }
  document.getElementById('prof-roles').innerHTML=m.roles.map(r=>'<span class="tag-btn active" style="pointer-events:none;cursor:default;">'+(r==='upskiller'?'Builder':r[0].toUpperCase()+r.slice(1))+'</span>').join('');
  document.getElementById('prof-actions').innerHTML=followBtnHTML(m)+' <button class="btn btn-ghost-teal btn-sm" onclick="showView(\'stub\')">Say hi in Slack</button>';
  const cred=document.getElementById('prof-cred'); if(cred){ cred.style.display='none'; cred.innerHTML=''; }
  const ce=document.getElementById('prof-case-edit'); if(ce) ce.style.display='none';
  const mc=document.getElementById('prof-mentor-cta'); if(mc) mc.style.display='none';
  document.getElementById('prof-featured').innerHTML='';
  document.getElementById('prof-projects').innerHTML=(m.projects||[]).map((p,i)=>projectCardHTML({...p, role:p.tag}, i)).join('');
  renderProfUpdates(m.updates||[], false);
  const bm=document.getElementById('prof-bookmarks'); if(bm) bm.innerHTML='';
  document.getElementById('prof-skills').innerHTML='<div class="tag-wrap">'+(m.expertise||[]).map(t=>'<span class="tag-btn active" style="pointer-events:none;">'+escHTML(t)+'</span>').join('')+'</div>';
  const rd=document.getElementById('prof-roledetail'); if(rd){ rd.innerHTML=(m.testimonials&&m.testimonials.length)?'<div class="cards two"><div class="lcard" style="padding:24px;"><div class="lbl lbl-teal" style="margin-bottom:8px;">As a mentor</div>'+testimonialBlockHTML(m.testimonials, false)+'</div></div>':''; rd.style.display=rd.innerHTML?'block':'none'; }
  const so=document.getElementById('prof-signout-wrap'); if(so) so.style.display='none';
  const pv=document.getElementById('prof-preview-bar');
  if(pv){ pv.style.display='block'; pv.innerHTML='<div style="background:var(--ink);color:var(--od1);padding:11px var(--pad);display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;"><span class="t-small" style="color:var(--od2);">Viewing '+escHTML(m.name)+'’s profile.</span><button class="btn-link" style="color:#fff;font-weight:600;font-size:13px;" onclick="closeMemberProfile()">Back to the Directory</button></div>'; }
  document.getElementById('panel-directory').classList.remove('active');
  document.getElementById('panel-profile').classList.add('active');
  history.replaceState(null,'','?u='+encodeURIComponent(id));
  window.scrollTo(0,0);
}
function closeMemberProfile(){
  viewingMemberProfile=false;
  document.getElementById('panel-profile').classList.remove('active');
  document.getElementById('panel-directory').classList.add('active');
  history.replaceState(null,'',location.pathname);
  window.scrollTo(0,0);
}
/* ── Profile updates feed (real content behind the activity strip) ── */
function renderProfUpdates(list, isOwner=false){
  const c=document.getElementById('prof-updates'); if(!c) return;
  const items=(list||[]).slice().sort((a,b)=>b.at-a.at);
  if(!items.length){ c.innerHTML='<p class="t-small" style="color:var(--meta);">No updates yet.</p>'; return; }
  c.innerHTML=items.map(u=>'<div class="lcard" style="padding:16px 18px;margin-bottom:10px;"><div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;margin-bottom:6px;"><span class="t-small" style="color:var(--meta);">'+relDate(u.at)+'</span>'
    +(isOwner?'<span style="display:flex;gap:14px;"><a class="see" style="font-size:12px;color:var(--meta);" onclick="deleteUpdate('+u.at+')">Delete</a></span>':'')
    +'</div><p class="t-body">'+escHTML(u.body)+'</p></div>').join('');
}
function deleteUpdate(at){
  const i=userState.updates.findIndex(u=>u.at===at); if(i<0) return;
  userState.updates.splice(i,1); saveUserState();
  renderProfUpdates(userState.updates, true); renderActivity(); renderDiscUpdates();
}

/* ── Survey pool — shared with triangulator.html via same-origin localStorage.
   PROTOTYPE LIMIT: single-browser only. Every visitor sees the seed +
   their own submissions; real cross-user aggregation is the OLOS
   survey_responses API (docs/OLOS_BACKEND_CHANGES.md). ── */
const SURVEY_POOL_KEY='olos.surveyPool.v1';
const SURVEY_SEED=[
  {title:'Restructuring the Political System', summary:'A high-level desire to shift the fundamental political structure of the United States to model other international systems.'},
  {title:'Media Misinformation', summary:'Broad concerns regarding how misleading media and digital influencing are negatively impacting civic engagement.'},
  {title:'Campaign Finance & District Competitiveness', summary:'Observations that financial influence and gerrymandering have reduced the competitiveness of congressional districts.'},
  {title:'Ranked Choice Voting Education', summary:'The implementation of ranked choice voting lacks sufficient public education to help voters understand its systemic benefits and how it changes voting behaviors.'},
  {title:'Targeting Legislative Influence', summary:'It is currently too labor-intensive and expensive to identify the most effective individuals or groups to lobby specific legislators on specific issues at the right time.'},
  {title:'Local Candidate Information Gaps', summary:'Voters lack easily accessible, actionable information about local county-level candidates, often relying heavily on name recognition from campaign signs.'},
  {title:'Public Engagement on Government AI', summary:'Citizens lack the tools and platforms to provide feedback on or inform how government agencies and companies deploy artificial intelligence in their communities.'},
  {title:'Recycling Contamination & Civic Decay', summary:'Improper recycling in public spaces leads to systemic waste and creates a visible, self-perpetuating belief that responsible civic behavior doesn’t matter.'},
  {title:'Campaign Finance', summary:'Reform efforts consistently hit roadblocks like the Citizens United decision.'},
  {title:'Civic Distrust & Disinformation', summary:'A toxic combination of distrust in voting, a lack of civics literacy, and internet-era disinformation is allowing political entities to manipulate voters’ worst instincts.'},
  {title:'Logistical & Educational Barriers to Voting', summary:'Voting is burdened by physical hurdles (childcare, time off work) and a lack of plain-language education on how local elections directly impact citizens’ daily lives.'},
  {title:'The Death of Political Compromise', summary:'The electorate and activists are failing to recognize that compromise is a fundamental component of democracy, negatively impacting civic engagement.'},
  {title:'Civics Talent Pipeline Shortage', summary:'There is a noticeable shortage of talent to fill junior roles within the civics and elections workforce.'},
  {title:'False Transparency in Government', summary:'Government agencies and schools exhibit a disconnect with their constituencies, presenting a “false flag” of transparency that leaves communities feeling ignored without understanding how aggregate sentiment is utilized.'},
  {title:'AI Bot Interference in Constituent Engagement', summary:'Artificial intelligence is being used to flood communication channels, rendering actual, organic constituent engagement ineffective.'},
  {title:'Hopelessness & Lack of Election Information', summary:'Voters feel hopeless and lack basic awareness of when local elections occur, relying on passive information like mailers or word of mouth.'},
  {title:'Structural Election Imbalances', summary:'The current electoral system features gerrymandering, dominant two-party privileges, and districts so large that politicians effectively choose their voters.'},
  {title:'Political Bubbles & NIMBYism', summary:'Citizens are highly polarized and isolated in social bubbles, proposing solutions or pushing back on reforms without understanding the broader impacts, trade-offs, or equity implications beyond their circles.'},
  {title:'Volunteer Burnout & Knowledge Transfer', summary:'Local volunteer roles, such as PTA leadership, fall on a few individuals. There is a need for tools to reduce the operational burden and retain institutional knowledge as volunteer leadership turns over.'},
  {title:'Aging Civic Leadership', summary:'Local civic organizations are heavily reliant on aging populations for leadership and membership, struggling to recruit younger generations who face competing career and family priorities.'},
  {title:'Uncontested Local Candidate Transparency', summary:'It is incredibly difficult to research the records of local election candidates, especially those running uncontested or without a communications budget, leaving voters feeling uninformed.'}
];
function seedTriangulatorPool(){
  let pool=null;
  try{ pool=JSON.parse(localStorage.getItem(SURVEY_POOL_KEY)||'null'); }catch(e){}
  if(!Array.isArray(pool)){
    pool=SURVEY_SEED.map((s,i)=>({id:'item_'+String(i+1).padStart(2,'0'), title:s.title, summary:s.summary, submittedAt:0}));
    try{ localStorage.setItem(SURVEY_POOL_KEY, JSON.stringify(pool)); }catch(e){}
  }
  return pool;
}
function appendSurveyObservation(title, summary){
  const pool=seedTriangulatorPool();
  pool.push({id:'survey_'+Date.now()+'_'+Math.floor(Math.random()*1e4), title:title, summary:summary, submittedAt:Date.now()});
  try{ localStorage.setItem(SURVEY_POOL_KEY, JSON.stringify(pool)); }catch(e){}
}
function surveyShareUrl(){ return location.href.split(/[?#]/)[0]+'?survey=civics-elections'; }
function copySurveyLink(btn){
  const url=document.getElementById('survey-share-url').value;
  const done=()=>{ const t=btn.textContent; btn.textContent='Copied ✓'; setTimeout(()=>btn.textContent=t,1600); };
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(done,done); } else { const i=document.getElementById('survey-share-url'); i.select(); document.execCommand('copy'); done(); }
}
function showSurveyShare(){
  const i=document.getElementById('survey-share-url'); if(i) i.value=surveyShareUrl();
  const ex=document.getElementById('survey-exit'); if(ex) ex.textContent=userState.signedIn?'Back to dashboard':'Back to The Labs';
  const n=(flow&&flow._count)||0;
  const h=document.querySelector('#view-survey-share h1'); if(h) h.textContent=n>1?('Thanks — your '+n+' observations are in the pool.'):'Thanks — your observations are in the pool.';
  showView('survey-share');
}
function exitSurveyShare(){ if(userState.signedIn) goApp('dashboard'); else showView('landing'); }
function exitTriangulator(){ if(userState.signedIn) goApp('dashboard'); else showView('landing'); }
function openTriangulator(){
  seedTriangulatorPool();
  const ex=document.getElementById('tri-exit'); if(ex) ex.textContent=userState.signedIn?'← Back to Dashboard':'← Back to The Labs';
  const fr=document.getElementById('triangulator-frame');
  if(fr&&!fr.getAttribute('src')) fr.setAttribute('src',appRel()+'triangulator.html'); // lazy-load; never reset once set
  showView('triangulator');
}
/* ── Learning Log — the weekly practice that replaced the Practice Journal (and the
   Pulse before it). One low-friction flow: a private health check (metrics visible to
   the member's Poderator + The Labs admins only), three scaffolded prompts that kill
   blank-page anxiety, and an optional share of the concatenated log to the Discover
   feed. Unlimited logs — no weekly lockout in the prototype; the weekly-cron cadence
   is a production note. Production: learning_logs (docs/OLOS_BACKEND_CHANGES.md §6). */
function llVal(id){ const e=document.getElementById(id); return e?e.value.trim():''; }
function llSeg(lead,v){ v=(v||'').trim(); if(!v) return ''; return lead+' '+v.replace(/^[…\s]+/,'').replace(/[.\s]+$/,'')+'. '; }
function llPreviewText(){
  return (llSeg('This week, I figured out', llVal('ll-accomplished'))
        + llSeg('I\u2019m currently exploring', llVal('ll-exploring'))
        + llSeg('Next week, my focus is', llVal('ll-next'))).trim();
}
function llSyncPreview(){ const p=document.getElementById('ll-preview'); if(!p) return; const t=llPreviewText(); p.textContent=t||'Your log reads back here as you type.'; p.style.color=t?'var(--charcoal)':'var(--meta)'; }
function toggleBlocked(){ const on=document.getElementById('ll-blocked').checked; const w=document.getElementById('ll-blocked-wrap'); w.style.display=on?'block':'none'; if(on) document.getElementById('ll-blocker').focus(); }
/* ── Learning Log gate — the weekly rhythm has teeth (owner decision): when a
   cycle member's log is overdue, the app locks to the dashboard's Learning Log
   until they save one. The prototype arms the gate from admin.html's Testing
   Controls (olos.cycleState.v1.logDueAt — the simulated weekly cron); saving a
   log with at >= logDueAt clears it member-side. Production: a weekly cron
   stamps the due window; middleware gates member routes until a learning_logs
   row exists for the current week (docs/OLOS_BACKEND_CHANGES.md §6). ── */
function logGateActive(){
  return !!(userState.signedIn && inCycle() && CYCLE.logDueAt
    && userState.cycleStatus!=='stepped_back' /* stepped-back members are never chased (F4) */
    && !userState.learningLogs.some(l=>l.at>=CYCLE.logDueAt));
}
let gateJustCleared=false;
function applyLogGate(){
  const active=logGateActive();
  if(active) gateJustCleared=false;
  const shell=document.getElementById('app-shell'); if(!shell) return;
  shell.classList.toggle('log-locked', active);
  document.body.classList.toggle('log-locked', active); // the injected nav/tabbar sit outside the shell
  const b=document.getElementById('log-gate-banner');
  if(b){
    if(active){
      b.style.display='block';
      b.innerHTML='<div class="gate-banner"><div class="lbl" style="color:var(--red);margin-bottom:6px;">Weekly practice · overdue</div>'
        +'<div class="t-h4" style="margin-bottom:4px;">Complete your Learning Log to get back in</div>'
        +'<p class="t-small" style="margin-bottom:12px;">The Labs runs on a weekly rhythm — one log, five minutes. Everything else unlocks the moment you save it.</p>'
        +'<button class="btn btn-red btn-sm" onclick="focusLearningLog()">Go to your Learning Log ↓</button></div>';
    } else if(gateJustCleared){
      b.style.display='block';
      b.innerHTML='<div class="gate-banner unlocked"><div class="t-h4" style="color:var(--teal-deep);margin-bottom:4px;">You’re back in ✓</div><p class="t-small">Logged for the week — the whole app is open again. See you next Friday.</p></div>';
    } else b.style.display='none';
  }
  // Keep the due chip in step when the gate flips while the dashboard is open.
  const due=document.getElementById('ll-due');
  if(due) due.innerHTML=active?'<span class="status risk">Overdue</span>':(inCycle()?'<span class="status">Due Fridays</span>':'');
  // If the member is elsewhere in the app when the week turns over (live via the
  // storage event), pull them to the gate. Views outside the shell (e.g. the
  // Triangulator mid-session) are left alone — the guard catches the next exit.
  if(active && window.APP_PAGE && window.APP_PAGE!=='home'){ location.replace(appRel()+'dashboard/index.html'); return; }
}
function focusLearningLog(){ const t=document.getElementById('ll-accomplished'); if(t){ t.scrollIntoView({block:'center'}); t.focus({preventScroll:true}); } }
function renderLearningLog(){
  const n=userState.learningLogs.length;
  const ct=document.getElementById('ll-count'); if(ct) ct.textContent=(n||'No')+' log'+(n===1?'':'s')+' this cycle';
  const due=document.getElementById('ll-due');
  if(due) due.innerHTML=logGateActive()?'<span class="status risk">Overdue</span>':(inCycle()?'<span class="status">Due Fridays</span>':'');
  const rec=document.getElementById('ll-recent'); if(!rec) return;
  const items=userState.learningLogs.slice(-2).reverse();
  rec.innerHTML=items.length?items.map(l=>{
    const para=(llSeg('This week, I figured out', l.log_content.accomplished)
              + llSeg('I\u2019m currently exploring', l.log_content.exploring)
              + llSeg('Next week, my focus is', l.log_content.next)).trim();
    return '<div style="border-top:1px solid var(--rule);padding:10px 0 2px;"><div class="t-small" style="color:var(--meta);margin-bottom:4px;">'+relDate(l.at)+' · Clarity '+l.metrics.clarity+' · Alignment '+l.metrics.alignment+(l.metrics.is_blocked?' · <span style="color:var(--red);font-weight:600;">Blocked</span>':'')+' · '+(l.share_publicly?'Shared to Discover':'Health check private')+'</div><p class="t-small">'+escHTML(para)+'</p></div>';
  }).join('')
    :'<p class="t-small" style="color:var(--meta);">Health checks go only to your Poderator and The Labs team. What you share is always your call.</p>';
}
function saveLearningLog(){
  const content={accomplished:llVal('ll-accomplished'), exploring:llVal('ll-exploring'), next:llVal('ll-next')};
  if(!content.accomplished&&!content.exploring&&!content.next){ document.getElementById('ll-accomplished').focus(); return; }
  const wasGated=logGateActive();
  const blocked=document.getElementById('ll-blocked').checked;
  const share=document.getElementById('ll-share').checked;
  // kind distinguishes the weekly log from the week-7/13 milestone evaluations
  // (same flow, evaluation prompts, prefilled — docs §6 "Milestone Logs").
  userState.learningLogs.push({ at:Date.now(), phase:CYCLE.phase, kind:'weekly',
    metrics:{ clarity:+document.getElementById('ll-clarity').value, alignment:+document.getElementById('ll-alignment').value, is_blocked:blocked, blocker_context:blocked?llVal('ll-blocker'):null },
    log_content:content, share_publicly:share });
  if(share){ userState.updates.push({body:llPreviewText(), at:Date.now()}); renderDiscUpdates(); renderActivity(); }
  saveUserState();
  // reset the form — log as often as you like
  ['ll-accomplished','ll-exploring','ll-next','ll-blocker'].forEach(id=>{ document.getElementById(id).value=''; });
  ['ll-clarity','ll-alignment'].forEach(id=>{ document.getElementById(id).value=3; document.getElementById(id+'-out').textContent='3'; });
  document.getElementById('ll-blocked').checked=false; document.getElementById('ll-share').checked=false;
  document.getElementById('ll-blocked-wrap').style.display='none';
  llSyncPreview();
  if(wasGated&&!logGateActive()) gateJustCleared=true; // the unlock moment
  applyLogGate();
  renderLearningLog(); renderTodos();
}

/* Public event RSVP — free & first-come-first-served, so it never gates on an account. */
function openRsvp(ctx, e){ if(e) e.stopPropagation();
  document.getElementById('rsvp-ctx').textContent='You\u2019re saving a spot for '+ctx+'.';
  const em=document.getElementById('rsvp-email'); em.value=userState.signedIn?'alex.rivera@gmail.com':'';
  document.getElementById('rsvp-body').style.display='block'; document.getElementById('rsvp-done').style.display='none';
  document.getElementById('rsvp-modal').classList.add('open');
}
function closeRsvp(){ document.getElementById('rsvp-modal').classList.remove('open'); }
function submitRsvp(){ const em=document.getElementById('rsvp-email'); if(!em.value.trim()||!/@/.test(em.value)){ em.focus(); return; } document.getElementById('rsvp-body').style.display='none'; document.getElementById('rsvp-done').style.display='block'; }

/* Dismissible "Up next" cards */
const dismissedTodos=new Set();
function dismissTodo(id,e){ if(e) e.stopPropagation(); dismissedTodos.add(id); saveUserState(); renderTodos(); }
// One blended tag cloud at the profile bottom: upskiller work areas + mentor expertise + volunteer focus,
// each tagged by source, de-duped by label.
function mergedSkills(){
  const out=[], seen=new Set();
  const add=(label,source)=>{ const k=String(label).toLowerCase(); if(!label||seen.has(k))return; seen.add(k); out.push({label,source}); };
  if(userState.completed&&userState.completed.mentor){ (userState.mentorAnswers.expertise||[]).forEach(t=>add(t,'mentor')); }
  const pa=userState.profileAnswers||{}; (pa.workAreas||['Benefits navigation','Community research','Rapid prototyping']).forEach(t=>add(t,'upskiller'));
  if(userState.completed&&userState.completed.volunteer){ (userState.volunteerAnswers.areas||[]).forEach(t=>add(t,'volunteer')); }
  return out;
}
let mentorStep = 1; let gateContext = ''; let mentorBack=()=>showView('role-intent');

function scrollTop(){ const v=document.querySelector('.view.active .vscroll'); if(v) v.scrollTop=0; else window.scrollTo(0,0); }
function scrollToSection(id){ const el=document.getElementById(id); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); }

/* ── Real-page routing ──────────────────────────────────────────────────────
   Each signed-in destination is its own page (owner decision — LinkedIn model):
   dashboard/ (Home) · my-cycle/ · learning/ · directory/ · me/. The legacy panel
   ids below map old links (?view=, goApp calls) onto the real pages. index.html
   keeps APP_PAGE unset — it hosts the landing + onboarding funnel. */
function appRel(){ return window.LABS_REL||''; }
const PANEL_ROUTES={ dashboard:'dashboard/index.html', cycles:'my-cycle/index.html', discover:'learning/index.html',
  events:'learning/index.html#sec-events', resources:'learning/index.html#sec-library', bookmarks:'learning/index.html#sec-saved',
  labs:'directory/index.html#sec-cities', profile:'me/index.html' };
const PAGE_PANELS={ home:['dashboard'], cycle:['cycles'], learning:['discover','events','resources','bookmarks'], directory:['labs'], me:['profile'] };
const APP_PANELS=['discover','dashboard','profile','cycles','events','resources','labs','bookmarks'];
function showView(id){
  closeHamMenu();
  // Auth guard: the app shell is members-only. Signed-out visitors (e.g. arriving
  // from a shared survey link) route back to the public landing instead.
  if(APP_PANELS.includes(id) && !userState.signedIn) id='landing';
  // Learning Log gate: an overdue member reaches only the dashboard (and the
  // public pages) until they save a log — the weekly rhythm is a hard gate.
  if(userState.signedIn && logGateActive() && id!=='dashboard'
     && (APP_PANELS.includes(id)||['triangulator','project-canvas','team-ignition'].includes(id))) id='dashboard';
  // Destinations are real pages: a panel id either belongs to THIS page (show the
  // shell) or is a navigation. Ceremony views toggle in place on any page.
  if(APP_PANELS.includes(id)){
    if(window.APP_PAGE && (PAGE_PANELS[window.APP_PAGE]||[]).includes(id)){
      document.querySelectorAll('#screens > .view').forEach(v=>v.classList.remove('active'));
      document.getElementById('app-shell').classList.add('active');
      window.scrollTo(0,0);
      return;
    }
    location.href=appRel()+PANEL_ROUTES[id]; return;
  }
  if(window.APP_PAGE && id==='landing'){ location.href=appRel()+'index.html'; return; }
  document.querySelectorAll('#screens > .view').forEach(v=>v.classList.remove('active'));
  const el=document.getElementById('view-'+id); if(el) el.classList.add('active');
  if(id==='landing') renderLanding();
  window.scrollTo(0,0); document.querySelectorAll('.vscroll').forEach(s=>s.scrollTop=0);
}
function toggleHamMenu(){
  const btn=document.getElementById('ham-btn'); const menu=document.getElementById('ham-menu');
  if(!btn||!menu) return;
  const open=menu.classList.toggle('open'); btn.classList.toggle('open',open);
}
function closeHamMenu(){
  const btn=document.getElementById('ham-btn'); const menu=document.getElementById('ham-menu');
  if(btn) btn.classList.remove('open'); if(menu) menu.classList.remove('open');
}
function goApp(id){ showView(id); }
function copyProfileLink(btn){
  const url=location.href.split(/[?#]/)[0]+'#u/alex-rivera';
  const done=()=>{ const t=btn.textContent; btn.textContent='Link copied ✓'; setTimeout(()=>btn.textContent=t,1600); };
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(done,done); } else done();
}
let viewingMemberProfile=false;
function showProfile(isOwner=true){ viewingMemberProfile=false; renderActivity(); renderProfileView(isOwner); showView('profile'); }
/* showAppView retired — each destination is a real page with its own chrome. */
function applyGate(){ const el=document.getElementById('gate-ctx'); if(!el) return; if(gateContext){ el.style.display='inline-flex'; el.innerHTML='Joining '+gateContext; } else { el.style.display='none'; } }
let gateReturnTo=null;
function startCreateAccount(){ gateContext=''; gateReturnTo=null; applyGate(); showView('google-auth'); }
function gateCreateAccount(ctx, e){ if(e) e.stopPropagation();
  // Signed-in members act directly — route to the relevant app view instead of the create-account funnel.
  if(userState.signedIn){ const c=(ctx||'').toLowerCase(); if(/workshop|session|event/.test(c)) goApp('events'); else if(/lab|waitlist/.test(c)) goApp('labs'); else if(/cycle/.test(c)) goApp('cycles'); else goApp('dashboard'); return; }
  gateContext=ctx||'';
  // Remember the destination so signup can return the member to what they came for.
  { const c=(ctx||'').toLowerCase();
    gateReturnTo=/workshop|session|event/.test(c)?()=>goApp('events'):/lab|waitlist/.test(c)?()=>goApp('labs'):/cycle|frame/.test(c)?()=>goApp('cycles'):null; }
  applyGate(); showView('google-auth'); }
function toggleExpand(card, e){ if(e){ const t=e.target; if(t.closest('button')) return; } card.classList.toggle('expanded'); }

/* ── Pods — "Join a pod" opens a chooser of real pods, never a bare form. One pod
   per member; pods run 12–30 (see CLAUDE.md). Production: pods/pod_memberships. */
const PODS_OPEN=PODS.filter(p=>p.status==='open'||p.status==='forming').map(p=>({id:p.appId, name:p.name, focus:p.focus, members:p.members, meets:p.meets, forming:p.status==='forming'})); /* single source: pods/data.js */
let pendingPod=null;
function renderPodChooser(){
  document.getElementById('pod-list').innerHTML=PODS_OPEN.map(p=>'<div class="lcard" style="padding:16px 18px;margin-bottom:10px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">'
    +'<div style="flex:1;min-width:180px;"><div class="t-h4" style="font-size:15px;">'+escHTML(p.name)+'</div><p class="t-small" style="margin:4px 0;">'+escHTML(p.focus)+'</p><p class="t-small" style="color:var(--meta);">'+(p.forming?p.members+' joined · pods are real at 12':p.members+' of 30 · '+escHTML(p.meets))+'</p></div>'
    +'<button class="btn btn-teal btn-sm" onclick="choosePod(\''+p.id+'\')">Join</button>'
    +'</div>').join('');
}
/* ── Cycle threshold — the seam between account and cycle registration gets a
   real door (owner decision). Terms before effort: presence, reliability, and
   the commons rule precede the questions; the Open Cycle Agreement signature
   (the last flow step) completes registration. All registration entry points
   route through startCycleRegistration — never silently chain into the flow. ── */
function coreEvents(){ return EVENTS.filter(e=>e.anchor&&!/kickoff/i.test(e.name)); }
let thresholdFromSignup=false; // fromSignup adds the cycle-pitch beat (ts0) up front and routes the exit through the thank-you close
function startCycleRegistration(backFn, fromSignup){
  thresholdFromSignup=!!fromSignup;
  document.getElementById('th-eyebrow').textContent=fromSignup?'Your account is ready ✓':'Summer 2026 · Civic & Elections · An Open Cycle';
  document.getElementById('th-events').innerHTML=coreEvents().map(e=>'<div class="th-ev"><span class="t-small" style="color:var(--od1);font-weight:600;">✦ '+escHTML(e.name)+'</span><span class="t-small" style="color:var(--od2);flex-shrink:0;">'+fmtEvt(e)+'</span></div>').join('');
  // From signup: the pitch beat introduces THIS season first. Everywhere else:
  // open on the value beat — commitments come second (facilitator feedback).
  document.getElementById('ts0').style.display=fromSignup?'block':'none';
  document.getElementById('ts1').style.display=fromSignup?'none':'block'; document.getElementById('ts2').style.display='none';
  showView('cycle-threshold');
}
function thresholdNext(){
  const ts0=document.getElementById('ts0');
  if(ts0.style.display!=='none'){ ts0.style.display='none'; document.getElementById('ts1').style.display='block'; }
  else { document.getElementById('ts1').style.display='none'; document.getElementById('ts2').style.display='block'; }
  const sc=document.querySelector('#view-cycle-threshold .vscroll'); if(sc) sc.scrollTop=0;
}
function beginCycleRegistration(){
  // Registration STOPS at the deal screen (owner decision, 2026-07): seeing the
  // commitment + tapping Begin registration records it, and the thank-you closes.
  // No problem-statement questions, no in-flow signature — the intake questions
  // and the Open Cycle Agreement ceremony move to a later, separate moment
  // (concierge/email follow-up in production). FLOWS('cycle') is retained but
  // unreferenced from registration.
  userState.cycleStatus='interested'; saveUserState(); renderTodos();
  if(nextRoleInQueue()) return; // more added roles waiting — their flows first, thank-you last
  showThankYou('interested');
}
function declineCycleThreshold(){ pendingPod=null; renderTodos(); if(nextRoleInQueue()) return; /* declining the cycle still asks the other added roles' details */ if(thresholdFromSignup){ showThankYou(false); } else { goApp('dashboard'); } } // an honest exit — the cycle todo stays, nothing nags; from signup it still closes with the thank-you
/* Signing lands here: the confirmation carries the kickoff date, a calendar
   file of the anchor events, and the pod chooser if no pod was picked. */
function cycleICS(){
  const dt=s=>s.replace(/[-:]/g,'')+'00';
  return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//The Upskilling Labs//Open Cycle//EN\r\n'
    +EVENTS.filter(e=>e.anchor).map(e=>'BEGIN:VEVENT\r\nUID:'+e.api_id+'@theupskillinglabs\r\nDTSTART:'+dt(e.start_at)+'\r\nSUMMARY:'+e.name.replace(/,/g,'\\,')+'\r\nLOCATION:'+(e.location_name||'').replace(/,/g,'\\,')+'\r\nEND:VEVENT').join('\r\n')
    +'\r\nEND:VCALENDAR';
}
function icsHref(){ return 'data:text/calendar;charset=utf-8,'+encodeURIComponent(cycleICS()); }
/* "Your commitments" — the anchor-event dates a member signed up to, findable ANY
   time after signing (facilitator user story), with the .ics always one tap away.
   Single source: the anchor events in events/data.js — same rows the .ics carries. */
function commitmentsHTML(){
  const a=userState.cycleAgreement;
  return '<div class="lcard" style="padding:22px 24px;" id="cycle-commitments">'
    +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:6px;">'
    +'<div><div class="lbl lbl-teal" style="margin-bottom:4px;">Your commitments</div>'
    +'<p class="t-small" style="color:var(--meta);">'+(a?'Open Cycle Agreement · signed '+new Date(a.at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'The six anchor events — everyone plans around these')+'</p></div>'
    +'<a class="btn btn-ghost-teal btn-sm" download="open-cycle-events.ics" href="'+icsHref()+'">Add to your calendar (.ics)</a></div>'
    +EVENTS.filter(e=>e.anchor).map(e=>'<div class="kv"><span class="k lbl" style="width:110px;">'+fmtEvt(e)+'</span><span class="t-body">✦ '+escHTML(e.name)+'<span class="t-small" style="color:var(--meta);"> · '+escHTML(e.location_name)+'</span></span></div>').join('')
    +'</div>';
}
function renderCycleCommitments(){
  const c=document.getElementById('cycle-commitments-wrap'); if(!c) return;
  if(!inCycle()){ c.style.display='none'; c.innerHTML=''; return; }
  c.style.display='block'; c.innerHTML=commitmentsHTML();
}
function showCycleSigned(chosePod){
  const a=userState.cycleAgreement||{};
  document.getElementById('cs-agreement').textContent='Open Cycle Agreement · signed '+new Date(a.at||Date.now()).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+' — it lives on your profile.';
  document.getElementById('cs-ics').href=icsHref();
  document.getElementById('cs-actions').innerHTML=chosePod
    ? '<p class="t-small" style="margin-bottom:12px;">Your pod: <b>'+escHTML(CYCLE.pod)+'</b> ✓</p><button class="btn btn-teal btn-lg btn-block" onclick="goApp(\'cycles\')">Go to your cycle →</button>'
    : '<button class="btn btn-teal btn-lg btn-block" onclick="goApp(\'cycles\');openPodChooser()">Choose your pod →</button><button class="btn-link" style="color:var(--meta);margin-top:16px;" onclick="goApp(\'cycles\')">Go to your cycle →</button>';
  // Signing from the signup ending still closes with the thank-you (owner
  // decision: onboarding ends on thanks either way) — and the summary email
  // goes out with the registration included.
  if(thresholdFromSignup){ sendWelcomeEmail(true); document.getElementById('cs-actions').innerHTML+='<button class="btn-link" style="color:var(--meta);margin-top:16px;display:block;margin-left:auto;margin-right:auto;" onclick="showThankYou(true)">Finish up — see everything you signed up for →</button>'; }
  showView('cycle-signed');
}
/* ── The thank-you close + the welcome-summary email (simulated — production:
   a transactional send on signup completion; see docs/OLOS_BACKEND_CHANGES.md).
   The screen and the email carry the same summary: one source of truth. ── */
function signupSummaryRows(registered){
  const A=window.AGREEMENTS||{};
  const rows=[
    ['Your account', (userState.fullName||'')+' · alex.rivera@gmail.com · '+((userState.lab&&userState.lab.name)||'The Labs')],
    ['How you want to take part', (userState.roles&&userState.roles.length?userState.roles.map(r=>({cycle:'Build Cycle',events:'Events & workshops',volunteer:'Volunteer',mentor:'Mentor'}[r]||r)).join(' · '):'Exploring for now')],
    ['What you signed', userState.agreements.map(g=>((A[g.doc]&&A[g.doc].title)||g.doc)+' ('+new Date(g.at).toLocaleDateString('en-US',{month:'short',day:'numeric'})+')').join(' · ')||'—'],
    ['Build Cycle', registered==='interested'?'You’re in — we’ll email you the next step to complete registration':registered?'Registered — Civics & Elections · Kickoff July 14':'Not this cycle — the door stays open'],
    ['Hearing from us', userState.contactOptIn?'Updates, newsletters, and invites — you said yes':'Account-critical messages only']
  ];
  return rows;
}
function sendWelcomeEmail(registered){
  if(userState.emails.some(e=>e.kind==='welcome')) return; // once
  userState.emails.push({ kind:'welcome', to:'alex.rivera@gmail.com',
    subject:'Welcome to The Upskilling Labs — here’s what you signed up for',
    body:signupSummaryRows(registered).map(r=>r[0]+': '+r[1]).join('\n'), at:Date.now() });
  saveUserState(); // production: the API triggers the transactional email — this row is the outbox record
}
function showThankYou(registered){
  sendWelcomeEmail(registered);
  document.getElementById('ty-rows').innerHTML=signupSummaryRows(registered).map(r=>'<div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--rule);text-align:left;"><span class="lbl" style="width:130px;flex-shrink:0;padding-top:2px;">'+escHTML(r[0])+'</span><span class="t-small" style="flex:1;color:var(--charcoal);">'+escHTML(r[1])+'</span></div>').join('');
  renderTodos(); showView('thankyou');
}
/* Onboarding never exits into the member portal (owner decision) — the thank-you
   is the terminus. Done returns to: the marketing site (standalone join/ page,
   via window.JOIN_RETURN from its ?return= param) or the public landing. */
function closeOnboarding(){ if(window.JOIN_RETURN){ location.href=window.JOIN_RETURN; return; } if(document.getElementById('view-landing')) showView('landing'); else location.href='../index.html'; }
/* ── Leaving well (UX_FINDINGS F4) — the agreement promises it, so it has a
   path: step back from the cycle with a note to your Poderator. No guilt UI,
   the door stays open, commons contributions stay credited. Production:
   enrollment status writes route through reconcileEnrollmentActivation (§3.7). ── */
function startStepBack(){ document.getElementById('sb-note').value=''; document.getElementById('stepback-modal').classList.add('open'); }
function closeStepBack(){ document.getElementById('stepback-modal').classList.remove('open'); }
function confirmStepBack(){
  userState.cycleStatus='stepped_back';
  userState.stepBackNote=(document.getElementById('sb-note').value||'').trim();
  saveUserState();
  closeStepBack(); applyLogGate(); renderDashCycle(); renderCredBand(); renderTodos();
}
function rejoinCycle(){ userState.cycleStatus='active'; saveUserState(); renderDashCycle(); renderCredBand(); renderTodos(); }
function openPodChooser(){ renderPodChooser(); document.getElementById('pod-chooser').classList.add('open'); }
function closePodChooser(){ document.getElementById('pod-chooser').classList.remove('open'); }
function applyPod(id){ const p=PODS_OPEN.find(x=>x.id===id); if(!p) return; CYCLE.pod=p.name; userState.pod=p.name; saveUserState(); p.members++; renderDashCycle(); }
function choosePod(id){
  closePodChooser();
  if(!userState.signedIn){ gateCreateAccount('a pod in the Civic & Elections Cycle', null); return; }
  if(inCycle()){ applyPod(id); goApp('cycles'); }
  else { pendingPod=id; startCycleRegistration(()=>goApp('cycles')); } // register first (through the threshold); the pick applies after signing
}
/* Phase info — a compact modal per phase (ⓘ icons on the phase band labels). */
const PHASE_INFO=CYCLE_PUBLIC.phaseInfo; /* single source: cycles/data.js — the /cycles/ page renders the same blurbs */
function openPhaseInfo(key){ const p=PHASE_INFO[key]; if(!p) return; document.getElementById('phase-info-when').textContent=p.when; document.getElementById('phase-info-title').textContent=p.title; document.getElementById('phase-info-body').textContent=p.body; const mo=document.getElementById('phase-info-modal'); mo.classList.add('open'); const c=mo.querySelector('.gate-close'); if(c) c.focus(); }
function closePhaseInfo(){ document.getElementById('phase-info-modal').classList.remove('open'); }
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ closePodChooser(); closePhaseInfo(); closeWaitlist(); } });

function signinReturning(){ userState.signedIn=true; writeSession(); showView('dashboard'); } // → navigates to dashboard/ (the real Home page)
function updateRoleBtn(){ const c=document.querySelectorAll('#role-options input:checked'); document.getElementById('role-continue-btn').disabled=c.length===0; document.querySelectorAll('#role-options .opt-card').forEach(x=>x.classList.toggle('selected',x.querySelector('input').checked)); }
function submitRoleIntent(){
  const picked=[...document.querySelectorAll('#role-options input:checked')].map(c=>c.value);
  if(roleUpdateMode){
    // A member updating how they take part — never re-run signup. EVERY newly
    // added role with a setup flow asks its details, one flow after another
    // (cycle → mentor → volunteer), each through its own seam; the queue ends
    // on the thank-you.
    roleUpdateMode=false;
    const prev=userState.roles||[];
    const added=['cycle','mentor','volunteer'].filter(r=>picked.includes(r)&&!prev.includes(r)&&!userState.completed[r]);
    userState.roles=picked; userState.isMentor=picked.includes('mentor'); saveUserState(); renderTodos();
    roleQueue=added;
    // Upgrading into a real role requires the documents (owner decision): anyone
    // missing the Guidelines or Participation Agreement at their CURRENT versions
    // signs them FIRST — this catches events-only members leveling up, and
    // version bumps force a re-sign the same way.
    if(added.length&&(!hasAgreed('guidelines')||!hasAgreed('participation'))){ startFlow('agreements', ()=>showWelcomeBack()); return; }
    if(!nextRoleInQueue()) showWelcomeBack();
    return;
  }
  userState.roles=picked; userState.isMentor=picked.includes('mentor'); saveUserState(); startFlow('signup', ()=>showView('role-intent'));
}
function continueWithGoogle(){
  // Already a member? Google recognizes the account — show what's on file and
  // offer updates (owner decision) instead of re-running signup.
  if(userState.signedIn){ showWelcomeBack(); return; }
  userState.signedIn=true; showView('role-intent');
}
/* ── The returning-member branch: review what's on file, then update ── */
let roleUpdateMode=false;
let roleQueue=[]; // newly added roles awaiting their setup flows (update path)
function nextRoleInQueue(){ const next=roleQueue.shift(); if(next){ startRoleFlow(next, ()=>showWelcomeBack(), true); return true; } return false; }
function showRoleUpdate(){ roleUpdateMode=true; document.querySelectorAll('#role-options input').forEach(i=>{ i.checked=(userState.roles||[]).includes(i.value); }); updateRoleBtn(); showView('role-intent'); }
function editSignupDetails(){
  const parts=(userState.fullName||'').split(' '); const a=userState.answers||{};
  startFlow('signup', ()=>showWelcomeBack(), { _edit:true,
    first:userState.name||parts[0]||'', last:parts.slice(1).join(' '), zip:a.zip||'',
    work:a.work, sector:a.sector, sectorOther:a.sectorOther, yearsExp:a.yearsExp, education:a.education,
    linkedin:a.linkedin, hearAbout:a.hearAbout, referredBy:(userState.referral&&userState.referral.by)||'',
    keepPosted:userState.contactOptIn });
}
function showWelcomeBack(){
  document.getElementById('wb-greeting').textContent='Welcome back, '+(userState.name||'friend')+'.';
  document.getElementById('wb-rows').innerHTML=signupSummaryRows(!!userState.completed.cycle)
    .map(r=>'<div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--rule);text-align:left;"><span class="lbl" style="width:130px;flex-shrink:0;padding-top:2px;">'+escHTML(r[0])+'</span><span class="t-small" style="flex:1;color:var(--charcoal);">'+escHTML(r[1])+'</span></div>').join('');
  showView('welcome-back');
}
function renderMentor(){ document.getElementById('ms1').style.display=mentorStep===1?'block':'none'; document.getElementById('ms2').style.display=mentorStep===2?'block':'none'; document.getElementById('me-next').textContent=mentorStep===2?'Set up my profile':'Next'; }
function mentorSlideNext(){ if(mentorStep===1){ mentorStep=2; renderMentor(); document.querySelector('#view-mentor-explainer .vscroll').scrollTop=0; } else { startFlow('mentor', ()=>{ mentorStep=1; renderMentor(); showView('mentor-explainer'); }); } }

/* ════ Flow engine ════ */
let flow=null, fstep=0, fans={};
const WORK=['Employed full time','Employed part-time','Self-employed','Unemployed and jobseeking','In a career transition','Student','Prefer not to say'];
const LEVELS=[['Beginner','New to this area'],['Developing','Some hands-on experience'],['Proficient','Comfortable working solo'],['Advanced','Deep experience, can guide others']];
const HOURS=['2–4 hrs / week','5–8 hrs / week','8+ hrs / week'];
const TZ=['ET — Eastern','CT — Central','MT — Mountain','PT — Pacific','GMT','CET — Central European','IST — India Standard'];
const EXPERTISE=['AI tools','Design','Product','Data','Writing','Facilitation','Research','Strategy','Operations','Policy','Engineering'];
const ENGAGE=['Workshops','Office hours','Slack support','Pod coaching'];
const VOL_AREAS=['Events & logistics','Outreach & community','Mentoring support','Content & docs','Tech & tooling','Partnerships'];
const VOL_WAYS=['At in-person events','Behind the scenes','On-call for specific needs','An ongoing role'];
const PNTA='Prefer not to answer'; // every demographic ask carries an honest out (owner decision)
const SECTORS=['Technology','Healthcare','Education','Government & public sector','Nonprofit & community','Business & finance','Creative & media','Trades & manufacturing','Retail & service','Something else',PNTA];
const YEARS_EXP=['Just starting out','1–4 years','5–9 years','10–19 years','20+ years',PNTA];
const EDUCATION=['High school or GED','Some college','Associate degree','Bachelor’s degree','Graduate degree','Trade or technical certification',PNTA];
/* Events-only signups travel light (owner decision): no background questions, no
   agreements — name/zip, how they heard of us, the contact opt-in, done. The deeper
   asks arrive if they ever add a real role (welcome-back → change roles re-runs
   only what's missing, and the agreement steps' when-guards catch up then). */
function eventsOnly(){ const r=userState.roles||[]; return r.length>0 && r.every(x=>x==='events'); }
function FLOWS(name){
  if(name==='signup') return { eyebrow:'Your profile', finalLabel:eventsOnly()?'Sign me up':'Become an Upskiller', finalClass:'btn-red',
    onComplete:()=>{ const f=(fans.first||'Alex').trim()||'Alex'; userState.name=f; userState.fullName=f+' '+(fans.last||'Rivera'); userState.initials=(f[0]||'A').toUpperCase()+((fans.last||'R')[0]||'R').toUpperCase(); userState.signedIn=true; const z=String(fans.zip||''); const labKey=/^20[0-5]/.test(z)?'dc':/^21[0-2]/.test(z)?'baltimore':/^19[0-4]/.test(z)?'philadelphia':'dc'; userState.lab={...METROS[labKey]}; /* metro auto-assigned from zip — a waitlist metro drives the dashboard nudge */  userState.profileVisibility='labs'; /* members-only profiles — public tier deferred (see backend doc) */ userState.referral={source:fans.hearAbout||'', by:(fans.referredBy||'').trim()};
      // The intake answers — one object, mirrors the future participants row.
      userState.answers={...userState.answers, zip:String(fans.zip||''), work:fans.work||'', sector:fans.sector||'', sectorOther:(fans.sectorOther||'').trim(), yearsExp:fans.yearsExp||'', education:fans.education||'', linkedin:(fans.linkedin||'').trim(), hearAbout:fans.hearAbout||''};
      if(!eventsOnly()){ recordAgreement('participation'); recordAgreement('guidelines'); } userState.contactOptIn=!!fans.keepPosted;
      writeSession(); saveUserState();
      if(fans._edit){ showWelcomeBack(); return; } // returning member updating details — no re-onboarding
      if(pendingWaitlist||pendingWaitlistCreate){ gateReturnTo=null; showView('landing'); consumePendingWaitlist(); /* finish the committed join HERE (the pending city is in-memory — it can't survive a navigation) */ }
      else if(gateReturnTo){ const r=gateReturnTo; gateReturnTo=null; r(); }
      else if((userState.roles||[]).includes('cycle')){ startCycleRegistration(()=>showView('dashboard'), true); } /* the cycle pitch shows only when Join a Cycle was picked */
      else { showThankYou(false); } /* volunteer / mentor / events signups stop right here — agreements done, thank you, that's it (owner decision) */ },
    steps:[ {id:'email',type:'info',section:'About you',q:'Signing up as',help:eventsOnly()?'We pulled this from your Google account. Two quick questions and you’re done.':'We pulled this from your Google account. Eight quick questions, two short documents — about three minutes, all told.',render:'<div class="flow-emaillarge">alex.rivera@gmail.com</div>'},
      {id:'about',type:'fields',section:'About you',q:'Tell us who you are',help:'Your zip just finds the lab nearest you — nothing else.',fields:[
        {id:'first',label:'First name',ph:'Alex',required:true,half:true},
        {id:'last',label:'Last name',ph:'Rivera',required:true,half:true},
        {id:'zip',label:'Zip code',ph:'20001',required:true,inputmode:'numeric'} ]},
      {id:'work',type:'choice',section:'About you',q:'What best describes you right now?',options:WORK.map(w=>({v:w,label:w})),when:()=>!eventsOnly()},
      {id:'sector',type:'choice',section:'Your background',q:'What field do you mostly work in?',options:SECTORS.map(s=>({v:s,label:s})),followUp:{id:'sectorOther',label:'Tell us your field (optional)',ph:'e.g. Agriculture',when:v=>v==='Something else'},when:()=>!eventsOnly()},
      {id:'yearsExp',type:'choice',section:'Your background',q:'How many years have you been working?',options:YEARS_EXP.map(y=>({v:y,label:y})),when:()=>!eventsOnly()},
      {id:'education',type:'choice',section:'Your background',q:'What’s your highest level of education?',help:'No credentials required here — this just helps us understand who we’re serving.',options:EDUCATION.map(e=>({v:e,label:e})),when:()=>!eventsOnly()},
      {id:'linkedin',type:'text',section:'Your background',q:'LinkedIn profile',help:'Optional — makes it easy for pods and mentors to find you.',ph:'linkedin.com/in/yourname',required:false,when:()=>!eventsOnly()},
      {id:'hearAbout',type:'choice',section:'Last question',q:'How did you hear about The Labs?',help:'Everyone registers through the same path — this helps us thank the people and places that send folks our way.',options:[{v:'referral',label:'A friend or colleague referred me'},{v:'invited',label:'Someone at The Labs invited me',sub:'A mentor, facilitator, or organizer'},{v:'event',label:'A workshop, summit, or event'},{v:'other',label:'Somewhere else',sub:'Social media, the library, word of mouth'}],followUp:{id:'referredBy',label:'Who referred you? (optional — so we can thank them)',ph:'e.g. Priya Shah',when:v=>v==='referral'||v==='invited'}},
      /* The paperwork — questions first, documents last (owner decision). One
         document per screen, each scroll-gated with its own agree act — separate
         assent per document is the stronger clickwrap pattern, and each acceptance
         records its own {doc, version, at}. Already-accepted current versions skip
         (returning members). */
      {id:'agreeGuidelines',type:'consent',section:'The paperwork · 1 of 2',q:'The Volunteer Guidelines',help:'How we work together — read it to the end.',agreementTitle:'The Volunteer Guidelines',agreementHTML:(window.AGREEMENTS&&window.AGREEMENTS.guidelines.html)||'',text:'I have read and agree to the Volunteer Guidelines.',when:()=>!eventsOnly()&&!hasAgreed('guidelines')},
      {id:'agreeParticipation',type:'consent',section:'The paperwork · 2 of 2',q:'The Participation Agreement',help:'This is the deal between you and The Labs — read it to the end.',agreementTitle:'The Volunteer Participation Agreement',agreementHTML:(window.AGREEMENTS&&window.AGREEMENTS.participation.html)||'',text:'I have read and agree to the Volunteer Participation Agreement.',when:()=>!eventsOnly()&&!hasAgreed('participation')},
      {id:'keepPosted',type:'consent',optional:true,section:'Last thing',q:'Can we contact you?',help:'Entirely up to you — account-critical messages arrive either way.',text:'Yes, I’d like to receive updates, newsletters, and invites from The Upskilling Labs.'} ]};
  if(name==='agreements') return { eyebrow:'Your agreements', finalLabel:'I agree', finalClass:'btn-red',
    // The catch-up flow: presented when a member upgrades into a role that
    // requires documents they haven't accepted at the current versions
    // (events-only members leveling up; anyone after a version bump).
    onComplete:()=>{ recordAgreement('guidelines'); recordAgreement('participation'); saveUserState();
      if(!nextRoleInQueue()) showThankYou(userState.cycleStatus==='interested'?'interested':!!userState.completed.cycle); },
    steps:[ {id:'agreeGuidelines',type:'consent',section:'1 of 2',q:'The Volunteer Guidelines',help:'Taking on a role at The Labs starts with the documents — read it to the end.',agreementTitle:'The Volunteer Guidelines',agreementHTML:(window.AGREEMENTS&&window.AGREEMENTS.guidelines.html)||'',text:'I have read and agree to the Volunteer Guidelines.',when:()=>!hasAgreed('guidelines')},
      {id:'agreeParticipation',type:'consent',section:'2 of 2',q:'The Participation Agreement',help:'This is the deal between you and The Labs — read it to the end.',agreementTitle:'The Volunteer Participation Agreement',agreementHTML:(window.AGREEMENTS&&window.AGREEMENTS.participation.html)||'',text:'I have read and agree to the Volunteer Participation Agreement.',when:()=>!hasAgreed('participation')} ]};
  if(name==='survey') return { eyebrow:'Field survey · Civic & Elections', finalLabel:'Submit observation', finalClass:'btn-teal',
    onComplete:()=>{ appendSurveyObservation((fans.obsTitle||'').trim(), (fans.obsSummary||'').trim());
      flow._count=(flow._count||0)+1;
      if(fans.addMore==='more'){ delete fans.obsTitle; delete fans.obsSummary; delete fans.addMore;
        flow.steps[1].help='That\u2019s '+flow._count+' added this session \u2014 keep them coming.';
        fstep=1; renderFlowStep(); return; }
      userState.completed.surveyFill=true; saveUserState(); renderTodos(); showSurveyShare(); },
    steps:[ {id:'context',type:'info',q:'Help map the problem',help:'Every cycle opens with one assignment: observe. Raw observations — field notes, anecdotes, things you’ve seen with your own eyes — are the material the whole cycle builds on. No account needed.',render:'<div class="flow-emaillarge" style="font-size:18px;line-height:1.5;">What have you noticed about how civic life and elections actually work — or don’t?</div>'},
      {id:'obsTitle',type:'text',q:'Give your observation a short title',ph:'e.g. Local candidate information gaps',required:true},
      {id:'obsSummary',type:'textarea',q:'Describe what you observed',help:'What happened, where, and why it struck you. Observations beat opinions — describe the thing, not your take on it.',ph:'e.g. At my polling place, three voters asked staff who the school-board candidates were...',required:true},
      {id:'addMore',type:'choice',q:'Add another observation?',options:[{v:'more',label:'Yes, add another',sub:'Each one goes straight into the pool'},{v:'done',label:'I’m done for now',sub:'You can always come back'}]} ]};
  if(name==='mentorRequest') return { eyebrow:'Request a mentor', finalLabel:'Send the request', finalClass:'btn-teal',
    onComplete:()=>{ userState.mentorRequests.push({...fans, at:Date.now()}); saveUserState(); renderTodos(); showView('stub'); },
    steps:[ {id:'jitInfo',type:'info',q:'Evidence precedes assistance',help:'Mentors aren\u2019t assigned — they\u2019re activated when your work shows where they\u2019d have the most leverage. Investigate, try, document, reflect — then ask.',render:'<div class="flow-emaillarge" style="font-size:18px;line-height:1.5;">\u201cHere\u2019s what we\u2019ve learned. Where would you challenge our thinking?\u201d beats \u201cWhat should we do?\u201d</div>'},
      {id:'tried',type:'textarea',q:'What have you investigated and tried so far?',help:'Interviews run, experiments attempted, dead ends hit.',ph:'e.g. 12 resident interviews, a paper prototype that confused everyone...',required:true},
      {id:'evidenceLinks',type:'textarea',q:'Link your evidence',help:'Learning Log entries, interview summaries, failed experiments, prototype screenshots, research synthesis.',ph:'e.g. journal entries from weeks 3–5, the interview synthesis doc, prototype v1 screenshots...',required:true},
      {id:'challenge',type:'textarea',q:'Where do you want your thinking challenged?',help:'The sharper the question, the more leverage the conversation has.',ph:'e.g. We\u2019re convinced the barrier is language complexity — challenge that.',required:true},
      {id:'expertiseNeeded',type:'tags',q:'What kind of expertise would help?',options:EXPERTISE,required:true} ]};
  if(name==='solutionProposal') return { eyebrow:'Solution proposal · '+CYCLE.name, finalLabel:(myProposal()?'Update proposal':'Submit proposal'), finalClass:'btn-teal',
    onComplete:()=>{
      // UPSERT — one proposal per member; re-entering the flow pre-fills for edit.
      let mine=myProposal();
      if(!mine){ mine={id:'p-you', problemStatementId:'s3', submittedBy:'you', votes:[], status:'open'}; SOLUTION_PROPOSALS.push(mine); }
      mine.title=fans.title; mine.frame=fans.frame; mine.intervention=fans.intervention; mine.metrics=fans.metrics; mine.evidence=fans.evidence;
      renderTodos(); goApp('cycles');
    },
    steps:[ {id:'title',type:'text',q:'Name the proposal',help:'Short and memorable — this is what the pod votes on.',ph:'e.g. BenefitsBot',required:true},
      {id:'frame',type:'textarea',q:'What\u2019s the new frame?',help:'A fresh way of understanding the situation that opens better possibilities for action.',ph:'e.g. Treat benefits enrollment as a wayfinding problem, not a paperwork problem.',required:true},
      {id:'intervention',type:'textarea',q:'What would you build?',help:'The intervention — concrete enough to register a team around.',ph:'e.g. A plain-language guide piloted at library help desks...',required:true},
      {id:'metrics',type:'text',q:'How would you know it\u2019s working?',help:'One or two measurable signals.',ph:'e.g. Completion rate at 3 pilot branches',required:true},
      {id:'evidence',type:'textarea',q:'What evidence backs the frame?',help:'Interviews, observations, data — from the Problem Sprint.',ph:'e.g. 12 resident interviews · journey map',required:true} ]};
  if(name==='nominate') return { eyebrow:'Recognize a member', finalLabel:'Send nomination', finalClass:'btn-teal',
    onComplete:()=>{ userState.nominations.push({...fans, at:Date.now()}); saveUserState(); nominateTarget=null; showView('stub'); },
    steps:[ {id:'nominee',type:'text',q:'Who are you recognizing?',help:'Their name as it appears in the directory.',ph:'e.g. Priya Shah',required:true,when:f=>!f.nominee},
      {id:'as',type:'choice',q:'Recognize them as\u2026',options:[{v:'upskiller',label:'Standout Upskiller',sub:'Consistently shows up and ships'},{v:'mentor',label:'Mentor material',sub:'Generous with evidence-backed help'},{v:'advisor',label:'Advisor',sub:'Strategic judgment The Labs should tap'}],required:true},
      {id:'reason',type:'textarea',q:'What did they do?',help:'A sentence is plenty — nominations go to the Labs team, who follow up with the member.',ph:'e.g. Debugged three pods\u2019 scoping questions in one office hour...',required:true} ]};
  if(name==='cycle') return { eyebrow:'Civic & Elections · Summer 2026 · An Open Cycle', finalLabel:'Sign & register', finalClass:'btn-red',
    // Ceremony after intent: the Open Cycle Agreement signature is the LAST step
    // and completes registration — completed.cycle only flips on signing.
    onComplete:()=>{
      userState.cycleAgreement={ name:(fans.signature||'').trim(), at:Date.now(), version:'open-2026-07-v2' }; /* v2: softened terms, same substance (facilitator pass) */
      const chosePod=!!pendingPod;
      finishRoleFlow('cycle');
      if(pendingPod){ applyPod(pendingPod); pendingPod=null; }
      showCycleSigned(chosePod);
    },
    // The overview info step was cut — the threshold's value beat (ts1) now carries
    // that context BEFORE the commitments, so the flow itself stays short: four
    // questions, then the signature (facilitator feedback: fewer things to process).
    steps:[ {id:'problem',type:'textarea',q:'What problem area excites you most?',help:'A sentence or two is plenty.',ph:'e.g. how AI can help DC residents navigate benefits eligibility...',required:true},
      {id:'level',type:'choice',q:'Where are you at in your primary area?',options:LEVELS.map(l=>({v:l[0],label:l[0],sub:l[1]}))},
      {id:'goals',type:'textarea',q:'What do you most want from this cycle?',ph:'What would make this time well spent?',required:true},
      {id:'hours',type:'choice',q:'How much time can you commit?',options:HOURS.map(h=>({v:h,label:h}))},
      {id:'signature',type:'signature',q:'The Open Cycle Agreement',help:'Signing is how your pod knows you mean it. It’s short — read the whole thing.',
        terms:[
          {title:'I’ll be there.', body:'In person, at the five core events: the Problem Sprint, Meet the Pods, the Hackathon, Meet the Projects, and the Showcase Summit. My pod plans around me being there.'},
          {title:'I’ll check in every week.', body:'Five minutes, once a week. If I skip it, the app pauses until I catch up. If life gets in the way, I’ll tell my Poderator instead of going quiet.'},
          {title:'Our project is open source.', body:'What we build is an open-source community project — MIT for code, CC BY 4.0 for everything else, with everyone who worked on it credited. Once the cycle ends, I’m free to do whatever I want with it, and so is anyone else.'}
        ]} ]};
  if(name==='mentor') return { eyebrow:'Mentor profile', finalLabel:'Publish mentor profile', finalClass:'btn-teal', onComplete:()=>{ recordAgreement('mentor'); finishRoleFlow('mentor'); if(nextRoleInQueue()) return; showThankYou(userState.cycleStatus==='interested'?'interested':!!userState.completed.cycle); /* mentor publish closes on the thank-you (owner decision) */ },
    steps:[ {id:'expertise',type:'tags',q:'What do you bring?',help:'Pick the areas where you can help — everything here shows on your mentor profile — visible to all Labs members — which is how upskillers and project teams find you.',options:EXPERTISE,required:true},
      {id:'engage',type:'checks',q:'How would you like to engage?',help:'Select all that work for you.',options:ENGAGE,required:true},
      {id:'pods',type:'textarea',q:'Who have you mentored, and how?',help:'Tell us where, when, and how you\u2019ve mentored — inside or outside The Labs. No names needed.',ph:'e.g. 3 pods in the Civic AI cycle — weekly office hours on scoping and shipping.',required:true},
      {id:'tz',type:'choice',q:'What time zone are you in?',options:TZ.map(t=>({v:t,label:t}))},
      /* Ceremony after intent (owner decision): the Mentor Agreement is signed at
         the seam where it applies — the last step before publishing, never during
         signup. Skips if the current version is already on file. */
      {id:'agreeMentor',type:'consent',q:'The Mentor Agreement',help:'One document — read it to the end, then publish.',agreementTitle:'The Volunteer Mentor Agreement',agreementHTML:(window.AGREEMENTS&&window.AGREEMENTS.mentor.html)||'',text:'I have read and agree to the Volunteer Mentor Agreement.',when:()=>!hasAgreed('mentor')} ]};
  if(name==='volunteer') return { eyebrow:'Volunteer profile', finalLabel:'Save profile', finalClass:'btn-teal', onComplete:()=>{ finishRoleFlow('volunteer'); if(nextRoleInQueue()) return; showThankYou(userState.cycleStatus==='interested'?'interested':!!userState.completed.cycle); /* volunteer save closes on the thank-you (owner decision) */ },
    steps:[ {id:'seam',type:'info',q:'Before you start',help:'Three quick questions so the Labs team can match you to events and needs. Your answers go to the team — nothing publishes without your say-so.',render:'<div class="flow-emaillarge" style="font-size:18px;line-height:1.5;">Your volunteer profile<br>Three questions · about a minute</div>'},
      {id:'areas',type:'tags',q:'Where would you like to help?',help:'Pick the areas that fit. Choose as many as you like.',options:VOL_AREAS,required:true},
      {id:'ways',type:'checks',q:'How would you like to pitch in?',help:'Select all that work for you.',options:VOL_WAYS,required:true},
      {id:'hours',type:'choice',q:'How much time can you commit?',options:HOURS.map(h=>({v:h,label:h}))} ]};
  if(name==='profile') return { eyebrow:'Your profile', finalLabel:'Save profile', finalClass:'btn-teal',
    onComplete:()=>{ userState.profileAnswers={...fans}; userState.completed.profile=true; saveUserState(); const cb=document.getElementById('profile-checklist-cb'); if(cb&&!cb.checked){cb.checked=true;tickChecklist(cb);} renderProfileView(); (flow.returnTo||showProfile)(); },
    steps:[ {id:'bio',type:'textarea',q:'How would you describe yourself?',help:"A few sentences — what you're working on and what you bring.",ph:'Product-minded generalist learning by shipping...',required:true},
      {id:'location',type:'text',q:'What city are you in?',help:'Shows on your member profile.',ph:'Washington, DC',required:false},
      {id:'linkedin',type:'text',q:'LinkedIn profile',help:'Optional — makes it easy for pods and mentors to find you.',ph:'linkedin.com/in/yourname',required:false},
      {id:'website',type:'text',q:'Personal website or portfolio',help:'Optional — anywhere you share your work.',ph:'yoursite.com',required:false} ]};
}
/* ── Agreement scroll-gate (owner decision): ANY agreement — this one, the Open
   Cycle Agreement, and every future one — must be scrolled to its end before
   the agree/sign control activates. Content that fits without scrolling counts
   as read. Returns an isRead() getter; onRead fires once. ── */
function attachAgreeGate(scrollEl, hintEl, onRead){
  let read=false;
  const check=()=>{ if(read) return;
    if(scrollEl.scrollTop+scrollEl.clientHeight>=scrollEl.scrollHeight-8){
      read=true; hintEl.classList.add('read'); hintEl.textContent='Read to the end ✓'; onRead(); } };
  scrollEl.addEventListener('scroll', check, {passive:true});
  setTimeout(check, 80); // fits-without-scrolling counts as read
  return ()=>read;
}
/* The Participant Agreement — rendered (not just referenced) on the signup
   consent step, behind the scroll-gate. Plain language on purpose. */
const PARTICIPANT_AGREEMENT=[
  {h:'Who this is between', p:'You and The Upskilling Labs, a community R&D lab. This covers your member account; registering for a Build Cycle adds its own agreement later.'},
  {h:'Be someone people can build with', p:'Real name, honest work, no harassment. The Labs runs on mutual reliance — treat members, mentors, and hosts accordingly.'},
  {h:'Your profile is members-only', p:'What you add to your profile is visible to Labs members, not the public web. You choose what to share beyond the basics.'},
  {h:'Your data', p:'We collect what you give us — profile, answers, Learning Logs — to run the Labs. Log health checks are visible only to your Poderator and the Labs team. We never sell your data.'},
  {h:'Events', p:'Public events are free and open. If you RSVP, show up or free the seat. Sessions may be photographed for the community archive — tell the host if you’d rather not appear.'},
  {h:'Updates', p:'We’ll email you about your cohort and Labs news. Unsubscribe anytime; account-critical messages still arrive.'},
  {h:'Leaving', p:'Close your account whenever you like. Contributions already returned to the commons stay in the commons.'}
];
function startFlow(name, backFn, preload, returnTo){ flow=FLOWS(name); flow.name=name; flow.backTo=backFn||(()=>showView('landing')); flow.returnTo=returnTo||null; fans=preload?{...preload}:{}; fstep=fVisible()[0]||0; renderFlowStep(); showView('flow'); } // start at the first VISIBLE step — preloads can hide step 0 via step.when
function startRoleFlow(role, backFn, fromSignup){
  // Every role flow enters through its own seam — never a silent chain:
  // cycle → the threshold (gravity), mentor → the explainer, volunteer → its info step.
  if(role==='cycle'){ startCycleRegistration(backFn, fromSignup); }
  else if(role==='mentor'){ mentorBack=backFn||(()=>showView('dashboard')); mentorStep=1; renderMentor(); showView('mentor-explainer'); }
  else { startFlow(role, backFn||(()=>showView('dashboard'))); }
}
function finishRoleFlow(role){ if(role==='mentor')userState.mentorAnswers={...fans}; else if(role==='volunteer')userState.volunteerAnswers={...fans}; userState.completed[role]=true; saveUserState(); renderProfileChecklist(); renderDashCycle(); renderProfileView(); if(flow&&flow.returnTo)flow.returnTo(); else showView('dashboard'); }
function pad2(n){ return n<10?'0'+n:''+n; }
// Visible step indices — supports optional conditional steps via step.when(fans).
function fVisible(){ return flow.steps.map((s,i)=>i).filter(i=>{ const s=flow.steps[i]; return !s.when||s.when(fans); }); }
function renderFlowStep(){
  const step=flow.steps[fstep];
  document.getElementById('flow-eyebrow').textContent=step.section?flow.eyebrow+' · '+step.section:flow.eyebrow; /* section labels pace the journey — the counter says how far, the section says what's next */
  document.getElementById('flow-q').textContent=step.q;
  const help=document.getElementById('flow-help'); help.textContent=step.help||''; help.style.display=step.help?'block':'none';
  const vis=fVisible(); const pos=vis.indexOf(fstep);
  document.getElementById('flow-counter').textContent=pad2(pos+1)+' / '+pad2(vis.length);
  const seg=document.getElementById('flow-seg'); seg.innerHTML=''; for(let i=0;i<vis.length;i++){ const b=document.createElement('div'); b.className='seg-bar'+(i<pos?' done':'')+(i===pos?' active':''); b.innerHTML='<span class="seg-fill"></span>'; seg.appendChild(b); }
  document.getElementById('flow-back').onclick=()=>{ const v=fVisible(); const p=v.indexOf(fstep); if(p>0){ fstep=v[p-1]; renderFlowStep(); } else { flow.backTo(); } };
  renderFlowInput(step); document.getElementById('flow-scroll').scrollTop=0;
}
function flowAdvance(){ const v=fVisible(); const p=v.indexOf(fstep); if(p<v.length-1){ fstep=v[p+1]; renderFlowStep(); } else { flow.onComplete(); } }
function renderFlowInput(step){
  const box=document.getElementById('flow-input'); box.innerHTML='';
  const actions=document.getElementById('flow-actions'); const _v=fVisible(); const isLast=_v.indexOf(fstep)===_v.length-1;
  const contLabel=isLast?flow.finalLabel:'Continue'; const contClass=isLast?flow.finalClass:'btn-teal';
  function setActions(o){ actions.innerHTML=''; actions.style.display='flex'; const btn=document.createElement('button'); btn.className='btn btn-block '+contClass; btn.textContent=contLabel; btn.disabled=!o.enabled; btn.onclick=flowAdvance; actions.appendChild(btn); if(o.skip){ const s=document.createElement('button'); s.className='btn-link flow-skip'; s.style.color='var(--meta)'; s.textContent='Skip for now'; s.onclick=flowAdvance; actions.appendChild(s); } }
  function enable(on){ const b=actions.querySelector('.btn'); if(b) b.disabled=!on; }
  if(step.type==='info'){ box.innerHTML=step.render||''; setActions({enabled:true}); return; }
  if(step.type==='text'||step.type==='textarea'){
    const tag=step.type==='textarea'?'textarea':'input'; const el=document.createElement(tag);
    if(tag==='input'){ el.type='text'; if(step.inputmode) el.setAttribute('inputmode',step.inputmode); }
    el.placeholder=step.ph||''; el.value=fans[step.id]||'';
    const w=document.createElement('div'); w.className='field'; w.appendChild(el); box.appendChild(w);
    const valid=()=> step.required ? el.value.trim().length>0 : true;
    el.addEventListener('input',()=>{ fans[step.id]=el.value; enable(valid()); });
    el.addEventListener('keydown',ev=>{ if(ev.key==='Enter'&&tag==='input'&&valid()){ ev.preventDefault(); flowAdvance(); } });
    setActions({enabled:valid(), skip:!step.required}); /* guarded autofocus — never steal focus from typing/autofill (F7) */ setTimeout(()=>{ const ae=document.activeElement; if(ae&&ae!==document.body&&box.contains(ae)) return; el.focus(); el.scrollIntoView({block:'center'}); },60); return;
  }
  if(step.type==='fields'){
    // Several labeled inputs on one screen — collapses multi-question runs (3 asks max per screen).
    const grid=document.createElement('div'); grid.className='field-grid';
    const els=step.fields.map(f=>{
      const w=document.createElement('div'); w.className='field'+(f.half?' half':'');
      const lb=document.createElement('label'); lb.htmlFor='ff-'+f.id; lb.textContent=f.label;
      const el=document.createElement('input'); el.type='text'; el.id='ff-'+f.id;
      if(f.inputmode) el.setAttribute('inputmode',f.inputmode);
      el.placeholder=f.ph||''; el.value=fans[f.id]||'';
      w.appendChild(lb); w.appendChild(el); grid.appendChild(w); return [f,el];
    });
    box.appendChild(grid);
    const valid=()=>els.every(([f,el])=>!f.required||el.value.trim().length>0);
    els.forEach(([f,el])=>{
      el.addEventListener('input',()=>{ fans[f.id]=el.value; enable(valid()); });
      el.addEventListener('keydown',ev=>{ if(ev.key==='Enter'&&valid()){ ev.preventDefault(); flowAdvance(); } });
    });
    setActions({enabled:valid(), skip:step.fields.every(f=>!f.required)});
    /* guarded autofocus (F7) */ setTimeout(()=>{ const ae=document.activeElement; if(ae&&ae!==document.body&&box.contains(ae)) return; els[0][1].focus(); els[0][1].scrollIntoView({block:'center'}); },60); return;
  }
  if(step.type==='choice'){
    // Optional preselect hook — e.g. suggest the local lab nearest the zip already entered.
    if(step.preselect && fans[step.id]===undefined){ const v=step.preselect(fans); if(v!=null) fans[step.id]=v; }
    const list=document.createElement('div'); list.className='choice-list';
    // Optional inline follow-up input (step.followUp) shown for matching picks — keeps
    // related asks on ONE screen (e.g. hearAbout + "Who referred you?") instead of a new step.
    let fuWrap=null;
    const syncFollowUp=(focus)=>{ if(!fuWrap) return; const on=step.followUp.when(fans[step.id]); fuWrap.style.display=on?'flex':'none'; if(!on){ delete fans[step.followUp.id]; } else if(focus){ const i=fuWrap.querySelector('input'); if(i) setTimeout(()=>i.focus(),60); } };
    step.options.forEach(o=>{ const row=document.createElement('div'); row.className='choice'+(fans[step.id]===o.v?' selected':''); row.innerHTML='<div class="c-main"><div class="c-label">'+o.label+'</div>'+(o.sub?'<div class="c-sub">'+o.sub+'</div>':'')+'</div><span class="dot"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>'; row.onclick=()=>{ fans[step.id]=o.v; [...list.children].forEach(c=>c.classList.remove('selected')); row.classList.add('selected'); enable(true); syncFollowUp(true); }; list.appendChild(row); });
    box.appendChild(list);
    if(step.followUp){
      fuWrap=document.createElement('div'); fuWrap.className='field'; fuWrap.style.marginTop='14px';
      const lb=document.createElement('label'); lb.htmlFor='ff-'+step.followUp.id; lb.textContent=step.followUp.label;
      const inp=document.createElement('input'); inp.type='text'; inp.id='ff-'+step.followUp.id; inp.placeholder=step.followUp.ph||''; inp.value=fans[step.followUp.id]||'';
      inp.addEventListener('input',()=>{ fans[step.followUp.id]=inp.value; });
      fuWrap.appendChild(lb); fuWrap.appendChild(inp); box.appendChild(fuWrap);
      syncFollowUp(false);
    }
    setActions({enabled:!!fans[step.id]}); return;
  }
  if(step.type==='checks'){
    if(!Array.isArray(fans[step.id])) fans[step.id]=[]; const list=document.createElement('div'); list.className='choice-list';
    step.options.forEach(o=>{ const on=fans[step.id].includes(o); const row=document.createElement('div'); row.className='choice'+(on?' selected':''); row.innerHTML='<div class="c-main"><div class="c-label">'+o+'</div></div><span class="dot square"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>'; row.onclick=()=>{ const a=fans[step.id]; const i=a.indexOf(o); if(i>=0)a.splice(i,1); else a.push(o); row.classList.toggle('selected'); enable(a.length>0); }; list.appendChild(row); });
    box.appendChild(list); setActions({enabled:fans[step.id].length>0}); return;
  }
  if(step.type==='tags'){
    if(!Array.isArray(fans[step.id])) fans[step.id]=[]; const w=document.createElement('div'); w.className='tag-wrap';
    step.options.forEach(t=>{ const b=document.createElement('button'); b.type='button'; b.className='tag-btn'+(fans[step.id].includes(t)?' active':''); b.textContent=t; b.onclick=()=>{ const a=fans[step.id]; const i=a.indexOf(t); if(i>=0)a.splice(i,1); else a.push(t); b.classList.toggle('active'); enable(a.length>0); }; w.appendChild(b); });
    box.appendChild(w); setActions({enabled:fans[step.id].length>0}); return;
  }
  if(step.type==='consent'){
    // Scroll-gated when the step carries agreement content (step.agreement as
    // {h,p} sections, or step.agreementHTML — a full document from agreements.js):
    // the checkbox stays inert until the reader reaches the end.
    // step.optional = the check is a genuine choice (e.g. the contact opt-in) —
    // Continue is enabled either way; only a gated agreement still blocks it.
    let isRead=()=>true;
    const canGo=()=> (step.optional?true:!!fans[step.id]) && isRead();
    const row=document.createElement('label'); row.className='choice'+(fans[step.id]?' selected':''); row.style.alignItems='flex-start';
    row.innerHTML='<span class="dot square" style="margin-top:2px;"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span><div class="c-main"><div class="c-label" style="font-weight:400;font-size:15px;line-height:22px;color:var(--charcoal);">'+step.text+'</div></div>';
    if(step.agreement||step.agreementHTML){
      const ab=document.createElement('div'); ab.className='agree-scroll'; ab.tabIndex=0; ab.setAttribute('role','region'); ab.setAttribute('aria-label', step.agreementTitle||'Agreement');
      ab.innerHTML=(step.agreementTitle?'<div class="lbl lbl-teal" style="margin-bottom:12px;">'+step.agreementTitle+'</div>':'')
        +(step.agreementHTML||step.agreement.map(a=>'<div style="margin-bottom:12px;"><div class="t-h4" style="font-size:14px;margin-bottom:2px;">'+a.h+'</div><p class="t-small">'+a.p+'</p></div>').join(''));
      const hint=document.createElement('div'); hint.className='agree-hint'; hint.textContent='↓ Scroll to the end to agree';
      box.appendChild(ab); box.appendChild(hint);
      row.classList.add('gated'); row.style.marginTop='14px';
      isRead=attachAgreeGate(ab, hint, ()=>{ row.classList.remove('gated'); enable(canGo()); });
    }
    row.onclick=()=>{ if(!isRead()) return; fans[step.id]=!fans[step.id]; row.classList.toggle('selected',fans[step.id]); enable(canGo()); };
    box.appendChild(row); setActions({enabled:canGo()}); return;
  }
  if(step.type==='signature'){
    // The Open Cycle Agreement — typed full name + date is the signature
    // (production: a cycle_agreements row; docs §2c). Scroll-gated like every
    // agreement: signing requires reading to the end AND a full name.
    const ab=document.createElement('div'); ab.className='agree-scroll'; ab.tabIndex=0; ab.setAttribute('role','region'); ab.setAttribute('aria-label','The Open Cycle Agreement');
    ab.innerHTML='<p class="t-small" style="margin-bottom:10px;color:var(--charcoal);">Between you and The Upskilling Labs, for the Summer 2026 Open Cycle (Civic &amp; Elections). It’s short on purpose — read all of it.</p>'
      +step.terms.map((t,i)=>'<div style="display:flex;gap:12px;padding:10px 0;border-top:1px solid var(--rule);"><span class="idx" style="color:var(--teal-deep);flex-shrink:0;">'+(i+1)+'</span><div><div class="t-h4" style="font-size:15px;margin-bottom:2px;">'+t.title+'</div><p class="t-small">'+t.body+'</p></div></div>').join('')
      +'<p class="t-small" style="padding-top:10px;border-top:1px solid var(--rule);color:var(--meta);">Version open-2026-07-v1 · If circumstances change mid-cycle, talk to your Poderator — leaving well is respected; going quiet is not.</p>';
    box.appendChild(ab);
    const hint=document.createElement('div'); hint.className='agree-hint'; hint.textContent='↓ Scroll to the end to sign';
    box.appendChild(hint);
    const w=document.createElement('div'); w.className='field'; w.style.marginTop='14px';
    const lb=document.createElement('label'); lb.htmlFor='ff-signature'; lb.textContent='Sign with your full name';
    const el=document.createElement('input'); el.type='text'; el.id='ff-signature'; el.placeholder=userState.fullName||'Your full name'; el.value=fans[step.id]||''; el.setAttribute('autocomplete','name');
    w.appendChild(lb); w.appendChild(el); box.appendChild(w);
    const dateLine=document.createElement('p'); dateLine.className='t-small'; dateLine.style.cssText='margin-top:10px;color:var(--meta);';
    dateLine.textContent='Signing on '+new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+' · recorded on your profile';
    box.appendChild(dateLine);
    const isRead=attachAgreeGate(ab, hint, ()=>enable(valid()));
    function valid(){ const v=el.value.trim(); return isRead()&&v.length>=3&&v.includes(' '); } // read to the end + a full name, not initials
    el.addEventListener('input',()=>{ fans[step.id]=el.value; enable(valid()); });
    el.addEventListener('keydown',ev=>{ if(ev.key==='Enter'&&valid()){ ev.preventDefault(); flowAdvance(); } });
    setActions({enabled:valid()}); return;
  }
}

/* Airbnb-isms */
function toggleHeart(e,btn){
  e.stopPropagation(); e.preventDefault(); // cards are real <a> links now — the heart must not navigate
  // Logged-out public visitors can't save yet — bookmarking is account-gated.
  if(!btn.closest('#app-shell') && !userState.signedIn){ openSaveGate(); return; }
  const card=btn.closest('.card');
  const titleEl=card&&(card.querySelector('.card-body .t-h4')||card.querySelector('.t-h4'));
  const title=titleEl?titleEl.textContent.trim():'Saved item';
  const tagEl=card&&card.querySelector('.m-tag'); const kind=tagEl?tagEl.textContent.trim():'Saved';
  const metaEl=card&&card.querySelector('.card-body .t-small'); const meta=metaEl?metaEl.textContent.trim():'';
  const id=slug(title)||('item-'+userState.saved.length);
  const i=userState.saved.findIndex(s=>s.id===id);
  if(i>=0) userState.saved.splice(i,1); else userState.saved.push({id,title,kind,meta});
  saveUserState();
  syncHearts();
  if(document.getElementById('bm-list')) renderBookmarks(); // learning page's saved section refreshes live
  renderDashSaved();
}
// Reflect userState.saved on every heart in the DOM so the same item stays consistent across views.
function syncHearts(){
  const ids=new Set(userState.saved.map(s=>s.id));
  document.querySelectorAll('.card').forEach(card=>{ const h=card.querySelector('.heart'); const t=card.querySelector('.card-body .t-h4')||card.querySelector('.t-h4'); if(h&&t) h.classList.toggle('saved', ids.has(slug(t.textContent.trim()))); });
}
function renderBookmarks(){
  const c=document.getElementById('bm-list'); if(!c) return;
  const items=userState.saved||[]; const empty=document.getElementById('bm-empty');
  if(!items.length){ c.innerHTML=''; if(empty) empty.style.display='block'; return; }
  if(empty) empty.style.display='none';
  c.innerHTML=items.map(s=>'<div class="card tappable"><div class="media m-teal" style="aspect-ratio:16/10;"><button class="heart saved" onclick="toggleHeart(event,this)"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg></button><div class="m-tag">'+s.kind+'</div></div><div class="card-body"><div class="t-h4" style="margin-bottom:4px;">'+s.title+'</div>'+(s.meta?'<p class="t-small">'+s.meta+'</p>':'')+'</div></div>').join('');
}
function goBookmarks(){ goApp('bookmarks'); }
function openSaveGate(){ const m=document.getElementById('save-gate'); if(m) m.classList.add('open'); }
function closeSaveGate(){ const m=document.getElementById('save-gate'); if(m) m.classList.remove('open'); }
function initEventCats(){ const cats=['All','In person','Virtual','This month','Workshops']; const c=document.getElementById('event-cats'); if(!c)return; c.innerHTML=''; cats.forEach((t,i)=>{ const b=document.createElement('button'); b.className='chip'+(i===0?' active':''); b.textContent=t; b.onclick=()=>{ [...c.children].forEach(x=>x.classList.remove('active')); b.classList.add('active'); }; c.appendChild(b); }); }
/* initGallery retired with panel-event — the gallery script is emitted into each generated event page. */
function renderActivity(){
  const g=document.getElementById('act-grid'); if(!g) return; g.innerHTML='';
  // Base texture (sample history) + real intensity: each posted update bumps its week's cell.
  const pat=[1,0,2,3,1,0,0,2,4,3,1,2,0,1,3,4,2,1,0,2,3,1,4,2,0,1,2,3,1,0,2,4,3,2,1,0,1,3,2,4,1,0,2,1,3,2,0,1,4,2,1,3];
  const op=[.08,.22,.4,.6,.85];
  const byWeek={};
  (userState.updates||[]).forEach(u=>{ const w=Math.floor((Date.now()-u.at)/(7*86400000)); const idx=pat.length-1-w; if(idx>=0) byWeek[idx]=(byWeek[idx]||0)+1; });
  pat.forEach((v,i)=>{ const boost=byWeek[i]||0; const lvl=Math.min(4, v+boost); const s=document.createElement('div'); s.className='act-sq'; if(boost) s.title=boost+' update'+(boost>1?'s':'')+' this week'; s.style.background='rgba(0,148,160,'+op[lvl]+')'; g.appendChild(s); });
}

function updateChecklistCount(){ const total=document.querySelectorAll('#checklist-items input[type=checkbox]').length; const done=document.querySelectorAll('#checklist-items input[type=checkbox]:checked').length; const rem=total-done; const c=document.getElementById('checklist-count'); if(c) c.textContent=rem===0?'All done':rem+' left';
  // Complete setup collapses to a strip — the journal becomes the dashboard's lead card.
  const full=document.getElementById('setup-full'), strip=document.getElementById('setup-done-strip');
  if(full&&strip&&rem===0&&full.style.display!=='none'){ full.style.display='none'; strip.style.display='flex'; }
}
function toggleSetupSection(){ const full=document.getElementById('setup-full'), strip=document.getElementById('setup-done-strip'); if(!full||!strip) return; full.style.display='block'; strip.style.display='none'; }
function tickChecklist(el){ const row=el.closest('.check-row'); const l=row.querySelector('.t-h4'); const b=row.querySelector('.btn'); if(el.checked){ if(l){ l.style.textDecoration='line-through'; l.style.color='var(--meta)'; } if(b) b.style.display='none'; } else { if(l){ l.style.textDecoration=''; l.style.color=''; } if(b) b.style.display=''; } userState.checklist=[...document.querySelectorAll('#checklist-items input[type=checkbox]')].map(c=>c.checked); saveUserState(); updateChecklistCount(); }
function renderProfileChecklist(){ const box=document.getElementById('role-items'); if(!box) return; box.innerHTML=''; userState.roles.filter(r=>FLOW_ROLES.includes(r)).forEach(role=>{ const meta=ROLE_ITEMS[role]; if(!meta) return; const done=!!userState.completed[role]; const row=document.createElement('div'); row.className='check-row role-row'; if(!done){ row.style.cursor='pointer'; row.onclick=()=>startRoleFlow(role, ()=>showView('dashboard')); } const strike=done?'color:var(--meta);text-decoration:line-through;':''; row.innerHTML='<input type="checkbox" '+(done?'checked ':'')+'disabled><div style="flex:1;"><div class="t-h4" style="margin-bottom:2px;'+strike+'">'+meta.title+'</div>'+(done?'':'<div class="t-small">'+meta.sub+'</div>')+'</div>'+(done?'':'<button class="btn btn-ghost-teal btn-sm" style="flex-shrink:0;align-self:center;">Start →</button>'); box.appendChild(row); }); updateChecklistCount(); }
function renderTodos(){
  // Prominent-but-skippable: the survey + Triangulator lead the list and are
  // dismissible; everything here is a suggestion, never a gate. Your live
  // project (once you’ve registered onto a team) always pins first.
  const todos=[];
  const myProj=CYCLE_PROJECTS.find(p=>p.members&&p.members.some(m=>m.ref==='you'));
  if(myProj) todos.push({label:'Your project',title:myProj.name+' — '+myProj.title,body:'Scoping · your team is assembled. Keep the momentum going.',cta:'Open the project canvas',action:()=>openProjectCanvas(myProj.id)});
  // The formation card morphs with the cycle phase — submit → vote → results → register.
  if(inCycle()&&!myProj){
    const f={
      submission:(myProposal()?{title:'Your proposal is in',body:'Voting opens next — submitters vote with '+CYCLE_CONFIG.submitterVotes+' votes.',cta:'Review proposals'}:{title:'Submit your solution proposal',body:'Pair a problem statement with a new frame before voting opens.',cta:'Start a proposal',start:true}),
      voting:(userState.ballot?{title:'Ballot cast ✓',body:'The tally lands at the end of the voting window.',cta:'See the proposals'}:{title:'Cast your ballot',body:'You have '+myVoteBudget()+' votes — back the proposals you believe in.',cta:'Open the ballot'}),
      tallied:{title:'Voting closed — results soon',body:'Winning proposals are being named. Registration opens next.',cta:'See the results'},
      registration:{title:'Join a project team',body:'Teams are real at '+CYCLE_CONFIG.projectMin+' members. One project per member.',cta:'Pick your team'},
      closed:{title:'Teams are formed',body:'Registration has closed for this cycle.',cta:'See the teams'}
    }[CYCLE.formationPhase||'submission'];
    if(f) todos.push({label:'Cycle formation',title:f.title,body:f.body,cta:f.cta,action:f.start?()=>startProposalFlow():()=>goApp('cycles')});
  }
  if(!userState.learningLogs.length) todos.push({id:'learninglog',label:'Learning Log',title:'Log your first week',body:'A health check and three quick prompts — five minutes, once a week.',cta:'Open your Learning Log',action:()=>{ goApp('dashboard'); const t=document.getElementById('ll-accomplished'); if(t){ t.focus(); t.scrollIntoView({block:'center'}); } },dismiss:true});
  if(!userState.completed.surveyFill) todos.push({id:'survey',label:'Field survey',title:'Add your observations',body:'Feed the Civic & Elections problem map — a few raw observations from your world.',cta:'Start the survey',action:()=>startFlow('survey',()=>goApp('dashboard')),dismiss:true});
  // Waitlist status — joined shows where you stand; a waitlist-metro member who hasn't joined gets the nudge.
  if(userState.waitlists.length){ const wm=METROS[userState.waitlists[0]];
    if(wm) todos.push({id:'waitlist',label:'Local labs',title:'You’re on the '+wm.name+' waitlist',body:wm.waiting+' '+(wm.waiting===1?'name':'people')+' and counting. We’ll email you the day it ignites — nothing else to do.',cta:'See every city',action:()=>goApp('labs'),dismiss:true});
  } else if(userState.lab&&userState.lab.status==='waitlist'&&METROS[userState.lab.slug]){ const wm=METROS[userState.lab.slug];
    todos.push({id:'waitlist-nudge',label:'Local labs',title:'No lab in '+wm.name+' yet',body:wm.waiting+' '+(wm.waiting===1?'person is':'people are')+' waiting for one. Add your name and we’ll email you when it ignites.',cta:'Join the waitlist',action:()=>{goApp('labs');openWaitlistJoin(wm.slug);},dismiss:true});
  }
  // Deferred role setups — signup never chains into role flows anymore (owner
  // decision: everyone exits through the cycle pitch), so picked-but-unfinished
  // roles surface here instead.
  if((userState.roles||[]).includes('mentor')&&!userState.completed.mentor) todos.push({id:'role-mentor',label:'Mentor',title:'Set up your mentor profile',body:'Four quick questions and the Mentor Agreement — then teams can find you.',cta:'Start now',action:()=>startRoleFlow('mentor',()=>goApp('dashboard')),dismiss:true});
  if((userState.roles||[]).includes('volunteer')&&!userState.completed.volunteer) todos.push({id:'role-volunteer',label:'Volunteer',title:'Finish your volunteer profile',body:'Three questions so the team can match you to events and needs.',cta:'Start now',action:()=>startRoleFlow('volunteer',()=>goApp('dashboard')),dismiss:true});
  if(!inCycle()) todos.push({label:'Cycles',title:'Build Cycle is forming',body:'Pod registration opens Aug 3.',cta:'Learn more',action:()=>goApp('cycles')});
  const c=document.getElementById('todos-container'); if(!c)return; c.innerHTML='';
  todos.filter(t=>!t.id||!dismissedTodos.has(t.id)).forEach(t=>{ const d=document.createElement('div'); d.className='lcard'; d.style.padding='20px 22px'; d.style.position='relative'; d.innerHTML=(t.dismiss?'<button title="Dismiss" style="position:absolute;top:10px;right:12px;background:none;border:none;color:var(--meta);cursor:pointer;font-size:16px;line-height:1;" onclick="dismissTodo(\''+t.id+'\',event)">×</button>':'')+'<div class="lbl lbl-teal" style="margin-bottom:8px;">'+t.label+'</div><div class="t-h4" style="margin-bottom:6px;">'+t.title+'</div><p class="t-small" style="margin-bottom:'+(t.cta?'14px':'0')+';">'+t.body+'</p>'+(t.cta?'<button class="btn btn-ghost-teal btn-sm">'+t.cta+'</button>':''); if(t.action){ const b=d.querySelector('.btn.btn-ghost-teal'); if(b) b.onclick=t.action; } c.appendChild(d); });
}
function buildWeekRail(){ const rail=document.getElementById('week-rail'); if(!rail)return; rail.innerHTML=''; const CUR=4; const wk=[[1,'✦ Kickoff Summit'],[2,'Observe'],[3,'Synthesize'],[4,'Problem Sprint'],[5,'Pods Form'],[6,'✦ Meet the Pods'],[7,'Research'],[8,'Field Work'],[9,'✦ Hackathon'],[10,'✦ Meet the Projects'],[11,'Build'],[12,'Validate'],[13,'✦ Showcase Summit']]; wk.forEach(([w,label])=>{ const past=w<CUR,cur=w===CUR,anchor=label.startsWith('✦'); const n=document.createElement('div'); n.className='week-node'; n.innerHTML='<div class="week-pip '+(past?'past':cur?'current':'')+'">'+w+'</div><div class="week-label">'+(cur?'<b>Wk '+w+'</b><br>'+label:anchor?'Wk '+w+'<br>'+label:'Wk '+w)+'</div>'; rail.appendChild(n); }); }
// Dashboard cycle command-center — shows only once the member is in a cycle. TODO: drive from real cycle data.
function renderDashCycle(){
  const el=document.getElementById('dash-cycle'); if(!el) return;
  if(!(userState.completed&&userState.completed.cycle)){ el.style.display='none'; el.innerHTML=''; return; }
  el.style.display='block';
  const segs=CYCLE.phases.map((p,i)=>'<div class="phase-segment"'+(i<=CYCLE.phaseIndex?' style="background:var(--teal);"':'')+'></div>').join('');
  const labels=CYCLE.phases.map((p,i)=>'<span class="t-small" style="font-weight:600;color:'+(i===CYCLE.phaseIndex?'var(--ink)':'var(--meta)')+';">'+p+'</span>').join('');
  // Dated commitments, not week numbers — derived from the anchor EVENTS (the same
  // rows the .ics carries), so the dates a member signed up to are always findable.
  const mile=EVENTS.filter(e=>e.anchor).map(e=>'<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--rule);"><span class="t-small" style="color:var(--ink);">✦ '+escHTML(e.name)+'</span><span class="t-small" style="flex-shrink:0;">'+fmtEvt(e)+'</span></div>').join('')
    +'<div style="text-align:right;margin-top:10px;"><a class="see" style="font-size:12px;" download="open-cycle-events.ics" href="'+icsHref()+'">Add to your calendar (.ics)</a></div>';
  if(userState.cycleStatus==='stepped_back'){
    el.innerHTML='<div class="lcard" style="padding:24px;">'
      +'<div class="lbl lbl-teal" style="margin-bottom:6px;">'+CYCLE.theme+' · '+CYCLE.name+'</div>'
      +'<div class="t-h4" style="margin-bottom:6px;">You\u2019ve stepped back — the door stays open</div>'
      +'<p class="t-small" style="margin-bottom:14px;">Your Poderator knows, nothing is held against you, and everything you returned to the commons stays credited. Come back whenever you\u2019re ready.</p>'
      +'<button class="btn btn-teal btn-sm" onclick="rejoinCycle()">Rejoin the cycle</button>'
      +'</div>';
    return;
  }
  el.innerHTML='<div class="lcard" style="padding:24px;">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px;"><div><div class="lbl lbl-teal" style="margin-bottom:6px;">'+CYCLE.theme+' · '+CYCLE.name+'</div><div class="t-h4">'+CYCLE.phase+' phase · '+CYCLE.pod+'</div></div><button class="btn btn-ghost-teal btn-sm" onclick="goApp(\'cycles\')">Open cycle</button></div>'
    +'<div class="phase-band">'+segs+'</div>'
    +'<div style="display:flex;justify-content:space-between;margin-bottom:18px;">'+labels+'</div>'
    +'<div class="lbl" style="margin-bottom:4px;">Your commitments</div>'+mile
    +'<div style="text-align:right;margin-top:12px;"><a class="see" style="font-size:12px;color:var(--meta);" onclick="startStepBack()" title="Leaving well is respected — tell your Poderator where you are">Need to step back? →</a></div>'
    +'</div>';
}
// Dashboard saved-items preview — up to 3, linking into Bookmarks. Hidden when nothing is saved.
function renderDashSaved(){
  const el=document.getElementById('dash-saved'); if(!el) return;
  const items=userState.saved||[];
  if(!items.length){ el.style.display='none'; el.innerHTML=''; return; }
  el.style.display='block';
  const rows=items.slice(0,3).map(s=>'<div class="lcard" style="padding:16px 18px;cursor:pointer;" onclick="goBookmarks()"><div class="lbl lbl-teal" style="margin-bottom:4px;">'+s.kind+'</div><div class="t-h4">'+s.title+'</div>'+(s.meta?'<p class="t-small" style="margin-top:2px;">'+s.meta+'</p>':'')+'</div>').join('');
  el.innerHTML='<div class="section-head"><div><div class="lbl lbl-teal" style="margin-bottom:8px;">Saved</div><h2 class="t-h2">Your bookmarks</h2></div><span class="see" onclick="goBookmarks()">See all →</span></div>'
    +'<div style="display:flex;flex-direction:column;gap:12px;">'+rows+'</div>';
}
// Profile editing opens a real one-screen editor (not the onboarding wizard).
function editProfile(){ openProfileEditor(); }
function editMentorProfile(){ openProfileEditor('mentor'); }
function editVolunteerProfile(){ openProfileEditor('volunteer'); }
function peEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function peField(label,id,val,o){ o=o||{};
  if(o.textarea) return '<div class="field"><label for="'+id+'">'+label+'</label><textarea id="'+id+'" placeholder="'+peEsc(o.ph||'')+'">'+peEsc(val)+'</textarea></div>';
  return '<div class="field"><label for="'+id+'">'+label+'</label><input id="'+id+'" type="text" value="'+peEsc(val).replace(/"/g,'&quot;')+'" placeholder="'+peEsc(o.ph||'')+'"></div>'; }
function peSelect(label,id,options,val){ return '<div class="field"><label for="'+id+'">'+label+'</label><select id="'+id+'">'+options.map(o=>'<option'+(o===val?' selected':'')+'>'+o+'</option>').join('')+'</select></div>'; }
function peTags(label,groupId,options,selected){ selected=Array.isArray(selected)?selected:[]; return '<div class="field"><label>'+label+'</label><div class="tag-wrap" id="'+groupId+'">'+options.map(o=>'<button type="button" class="tag-btn'+(selected.includes(o)?' active':'')+'" onclick="this.classList.toggle(\'active\')">'+o+'</button>').join('')+'</div></div>'; }
function renderProfileEditor(){
  const body=document.getElementById('editor-body'); if(!body) return;
  const pa=userState.profileAnswers||{}, m=userState.mentorAnswers||{}, v=userState.volunteerAnswers||{}; let h='';
  h+='<div class="editor-sec" id="editor-sec-identity"><span class="lbl">Identity</span><div class="editor-grid">'
    +peField('Bio','pe-bio',pa.bio,{textarea:true,ph:"A few sentences — what you're working on and what you bring."})
    +peField('Headline','pe-headline',pa.headline,{ph:'e.g. Product-minded generalist · Civic AI'})
    +peField('Location','pe-location',pa.location,{ph:'Washington, DC'})
    +peField('LinkedIn','pe-linkedin',pa.linkedin,{ph:'linkedin.com/in/yourname'})
    +peField('Website or portfolio','pe-website',pa.website,{ph:'yoursite.com'})
    +'</div></div>';
  if(userState.completed&&userState.completed.mentor){
    h+='<div class="editor-sec" id="editor-sec-mentor"><span class="lbl">As a mentor</span><div class="editor-grid">'
      +peTags('What you bring','pe-expertise',EXPERTISE,m.expertise)
      +peTags('How you engage','pe-engage',ENGAGE,m.engage)
      +peField('Who you mentored, and how','pe-pods',m.pods,{textarea:true,ph:'e.g. 3 pods in the Civic AI cycle — weekly office hours.'})
      +peField('What they achieved','pe-outcome',m.outcome,{textarea:true,ph:'e.g. All 3 pods shipped a working demo at the showcase.'})
      +peSelect('Time zone','pe-tz',TZ,m.tz)
      +peField('Booking link','pe-booking',m.booking,{ph:'calendly.com/your-link'})
      +peField('Mentor artifact','pe-artifact',m.artifact,{ph:'labs.org/showcase/...'})
      +peField('Testimonial','pe-testimonial',m.testimonial,{textarea:true,ph:'"A line from someone you mentored." — Pod 2'})
      +'</div></div>';
  }
  if(userState.completed&&userState.completed.volunteer){
    h+='<div class="editor-sec" id="editor-sec-volunteer"><span class="lbl">As a volunteer</span><div class="editor-grid">'
      +peTags('Focus areas','pe-areas',VOL_AREAS,v.areas)
      +peTags('How you pitch in','pe-ways',VOL_WAYS,v.ways)
      +peSelect('Time you can commit','pe-hours',HOURS,v.hours)
      +'</div></div>';
  }
  body.innerHTML=h;
}
function openProfileEditor(section){
  renderProfileEditor();
  const modal=document.getElementById('profile-editor'); if(modal) modal.classList.add('open');
  const body=document.getElementById('editor-body'); if(body) body.scrollTop=0;
  if(section){ const el=document.getElementById('editor-sec-'+section); if(el) setTimeout(()=>el.scrollIntoView({block:'start'}),0); }
}
function saveProfileEditor(){
  const val=id=>{ const e=document.getElementById(id); return e?e.value.trim():''; };
  const tags=id=>{ const g=document.getElementById(id); return g?[...g.querySelectorAll('.tag-btn.active')].map(b=>b.textContent):[]; };
  userState.profileAnswers={...userState.profileAnswers, bio:val('pe-bio'), headline:val('pe-headline'), location:val('pe-location'), linkedin:val('pe-linkedin'), website:val('pe-website')};
  if(userState.completed&&userState.completed.mentor){ userState.mentorAnswers={...userState.mentorAnswers, expertise:tags('pe-expertise'), engage:tags('pe-engage'), pods:val('pe-pods'), outcome:val('pe-outcome'), tz:val('pe-tz'), booking:val('pe-booking'), artifact:val('pe-artifact'), testimonial:val('pe-testimonial')}; }
  if(userState.completed&&userState.completed.volunteer){ userState.volunteerAnswers={...userState.volunteerAnswers, areas:tags('pe-areas'), ways:tags('pe-ways'), hours:val('pe-hours')}; }
  userState.completed.profile=true; saveUserState();
  const cb=document.getElementById('profile-checklist-cb'); if(cb&&!cb.checked){ cb.checked=true; tickChecklist(cb); }
  renderProfileChecklist(); renderProfileView(true); closeProfileEditor();
}
function closeProfileEditor(){ const m=document.getElementById('profile-editor'); if(m) m.classList.remove('open'); }
function onProfileChecklistClick(row){ const cb=document.getElementById('profile-checklist-cb'); if(!cb||cb.checked)return; startFlow('profile', ()=>goApp('dashboard'), userState.profileAnswers, ()=>goApp('dashboard')); /* completion lands back on the checklist */ }
function linkify(u){ u=String(u||'').trim(); if(!u) return '#'; return /^https?:\/\//.test(u)?u:'https://'+u; }
function firstSentence(s){ const m=String(s||'').split(/[.!?]/)[0]; return (m||s||'').trim(); }
// Active roles in fixed order; Upskiller is the baseline identity for any member.
function profRoleList(){
  const out=[{key:'upskiller',label:'Upskiller'}];
  if(userState.roles.includes('mentor')&&userState.completed.mentor) out.push({key:'mentor',label:'Mentor'});
  if(userState.roles.includes('volunteer')&&userState.completed.volunteer) out.push({key:'volunteer',label:'Volunteer'});
  return out;
}
/* Citations anchor the specific claim they substantiate — `after` is the bio fragment
   the chip attaches to. Custom (user-written) bios fall back to appending at the end. */
const CITATIONS=[
  {n:1, src:'GitHub Commit #4a1d9e — Open Labs OS', after:'Civic AI Build Cycle'},
  {n:2, src:'Client acceptance — DC Public Library pilot', after:'benefits navigation for DC residents'}
];
const DEFAULT_BIO='Product-minded generalist learning by shipping. Currently in the Civic AI Build Cycle, focused on benefits navigation for DC residents.';
function citeChip(c){ return '<sup class="cite-chip" tabindex="0">['+c.n+']<span class="cite-pop">Source: '+escHTML(c.src)+'</span></sup>'; }
function bioWithCitations(text){
  let html=escHTML(text); const leftovers=[];
  CITATIONS.forEach(c=>{ const anchor=escHTML(c.after||''); if(anchor&&html.includes(anchor)) html=html.replace(anchor, anchor+citeChip(c)); else leftovers.push(c); });
  return html+leftovers.map(citeChip).join('');
}
/* Trust badges are earned, never default: a fresh member sees locked states with
   how-to-earn tooltips; established (mock) members show the earned treatment. */
function renderBadges(earned){
  const el=document.getElementById('prof-badges'); if(!el) return;
  const lockSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  el.innerHTML=earned
    ? '<span class="status active" title="Work verified by Open Labs QA review">✓ Verified QA by Open Labs</span><span class="status forming" title="Endorsed by a client sponsor">✓ Client Endorsed</span><span class="status active" title="Work returned to the Living Library">✓ Commons contributor</span>'
    : '<span class="badge-locked" tabindex="0" title="Earned when a cycle project you shipped passes Open Labs QA review">'+lockSvg+' Verified QA · not yet earned</span><span class="badge-locked" tabindex="0" title="Earned when a client sponsor signs off on delivered work">'+lockSvg+' Client Endorsed · not yet earned</span><span class="badge-locked" tabindex="0" title="Earned when your project’s case study and playbook return to the Living Library">'+lockSvg+' Commons contributor · not yet earned</span>';
}
function renderProfileView(isOwner=true){
  const pa=userState.profileAnswers||{};
  // Restore identity fields — a directory member's profile may have been viewed since.
  const av=document.getElementById('prof-avatar'); if(av) av.textContent=userState.initials;
  const nm=document.getElementById('prof-name'); if(nm) nm.textContent=userState.fullName||'Alex Rivera';
  // Bio with inline citation chips anchored to the claims they substantiate.
  const bio=document.getElementById('prof-bio');
  if(bio) bio.innerHTML=bioWithCitations(pa.bio||DEFAULT_BIO);
  renderBadges(false); // fresh members haven't earned verification yet
  renderProfUpdates(userState.updates, isOwner);
  const ce=document.getElementById('prof-case-edit'); if(ce) ce.style.display=isOwner?'block':'none';
  const mc=document.getElementById('prof-mentor-cta'); if(mc) mc.style.display=(isOwner&&!(userState.completed&&userState.completed.mentor))?'block':'none';
  const meta=document.getElementById('prof-meta'); if(meta) meta.textContent=(pa.location||userState.lab.name||'Washington, DC')+' · Joined Spring 2026 · '+userState.following.length+' following';
  const head=document.getElementById('prof-headline'); if(head){ const sk=mergedSkills(); head.textContent=pa.headline||(sk.length?sk.slice(0,2).map(s=>s.label).join(' · '):'Practitioner · building in the open'); }
  const rb=document.getElementById('prof-roles'); if(rb) rb.innerHTML=profRoleList().map(r=>'<span class="tag-btn active" style="pointer-events:none;cursor:default;">'+r.label+'</span>').join('');
  const act=document.getElementById('prof-actions');
  if(act){
    if(isOwner){ act.innerHTML='<button class="btn btn-ghost-teal btn-sm" onclick="editProfile()">Edit profile</button><button class="btn btn-ghost-teal btn-sm" onclick="copyProfileLink(this)">Share profile</button><button class="btn-link" style="color:var(--meta);font-size:13px;" onclick="showProfile(false)">Preview as visitor →</button>'; }
    else { const li=pa.linkedin||'', ws=pa.website||''; let h='';
      if(li||ws) h+='<a class="btn btn-teal btn-sm" href="'+linkify(li||ws)+'" target="_blank" rel="noopener">Connect</a>';
      if(li&&ws) h+='<a class="btn-link" style="color:var(--teal-deep);font-size:13px;" href="'+linkify(ws)+'" target="_blank" rel="noopener">Website →</a>';
      if(!li&&!ws) h='<span class="t-small" style="color:var(--meta);">No contact links yet</span>';
      act.innerHTML=h; }
  }
  const pv=document.getElementById('prof-preview-bar');
  if(pv){ if(isOwner){ pv.style.display='none'; pv.innerHTML=''; } else { pv.style.display='block'; pv.innerHTML='<div style="background:var(--ink);color:var(--od1);padding:11px var(--pad);display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;"><span class="t-small" style="color:var(--od2);">Previewing how recruiters and visitors see your profile.</span><button class="btn-link" style="color:#fff;font-weight:600;font-size:13px;" onclick="showProfile(true)">Back to my view</button></div>'; } }
  const so=document.getElementById('prof-signout-wrap'); if(so) so.style.display=isOwner?'block':'none';
  renderCredBand(); renderPortfolio(); renderActLegend(); renderProfBookmarks(); renderSkills(); renderRoleDetail(isOwner);
}
function credCell(label,valueHTML){ return '<div><div class="lbl" style="margin-bottom:8px;">'+label+'</div><div style="display:flex;align-items:center;">'+valueHTML+'</div></div>'; }
function statusPill(kind,label){ return '<span class="status '+kind+'">'+label+'</span>'; }
function labStatusHTML(lab){
  const name='<span class="t-body" style="margin-left:8px;">'+lab.name+'</span>';
  if(lab.status==='active') return statusPill('active','Active member')+name;
  if(lab.status==='waitlist') return (userState.waitlists.includes(lab.slug)?statusPill('forming','On the waitlist'):statusPill('soon','No lab yet'))+name;
  if(lab.status==='pending-application') return statusPill('forming','Application pending')+name;
  return name;
}
function renderCredBand(){
  const el=document.getElementById('prof-cred'); if(!el) return; const cells=[];
  if(userState.completed&&userState.completed.cycle) cells.push(credCell('Build Cycle', (userState.cycleStatus==='stepped_back'?statusPill('forming','Stepped back · door open'):statusPill('active','Active'))+'<span class="t-body" style="margin-left:8px;">'+CYCLE.name+'</span>'+(userState.cycleAgreement?'<span class="t-small" style="margin-left:10px;color:var(--meta);">Open Cycle Agreement · signed '+new Date(userState.cycleAgreement.at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+'</span>':'')));
  else if(userState.roles.includes('cycle')) cells.push(credCell('Build Cycle', statusPill('forming','Registering')+'<span class="t-body" style="margin-left:8px;">'+CYCLE.name+'</span>'));
  const lab=userState.lab||{}; if(lab.name) cells.push(credCell('Local lab', labStatusHTML(lab)));
  if(userState.completed&&userState.completed.mentor){ const pods=(userState.mentorAnswers.pods||'').trim(); cells.push(credCell('Mentoring','<span class="t-body">'+(pods?firstSentence(pods):'Active mentor')+'</span>')); }
  if(userState.completed&&userState.completed.volunteer){ const hrs=(userState.volunteerAnswers.hours||'').trim(); cells.push(credCell('Volunteering','<span class="t-body">'+(hrs||'Active volunteer')+'</span>')); }
  if(!cells.length){ el.style.display='none'; el.innerHTML=''; return; }
  el.style.display='block';
  el.innerHTML='<div class="lcard" style="padding:22px 24px;"><div style="display:flex;flex-wrap:wrap;gap:22px 44px;">'+cells.join('')+'</div></div>';
}
function buildPortfolio(){
  const list=PROJECTS.slice();
  if(userState.completed&&userState.completed.mentor){ const m=userState.mentorAnswers||{}; list.push({ title:'Mentoring — '+((m.expertise&&m.expertise[0])||'pods'), roleType:'mentor', featured:false, tag:'Mentor', role:'Mentor'+(m.tz?' · '+m.tz:''), summary:(m.pods||'Guided pods through scoping and shipping.'), outcome:(m.outcome||''), testimonial:(userState.testimonials&&userState.testimonials[0]?'\u201c'+userState.testimonials[0].quote+'\u201d — '+userState.testimonials[0].from:''), artifact:m.artifact?{label:'View artifact',href:linkify(m.artifact)}:null }); }
  if(userState.completed&&userState.completed.volunteer){ const v=userState.volunteerAnswers||{}; list.push({ title:'Volunteering — '+((v.areas&&v.areas[0])||'community'), roleType:'volunteer', featured:false, tag:'Volunteer', role:'Volunteer', summary:((v.ways&&v.ways.join(', '))||'Pitched in on community operations.'), outcome:(v.hours?('Committing '+v.hours):'') }); }
  return list;
}
function projectCardHTML(p,i){
  const grad=p.roleType==='mentor'?'m-forest':p.roleType==='volunteer'?'m-navy':GRAD[i%GRAD.length];
  return '<div class="card"><div class="media '+grad+'" style="aspect-ratio:3/2;">'+ORB+'<div class="m-tag">'+(p.tag||'Open')+'</div></div>'
    +'<div class="card-body"><div class="lbl lbl-teal" style="margin-bottom:6px;">'+(p.role||'')+'</div><div class="t-h4" style="margin-bottom:4px;">'+p.title+'</div><p class="t-small">'+(p.summary||'')+'</p>'
    +(p.outcome?'<p class="t-small" style="color:var(--teal-deep);margin-top:8px;">'+p.outcome+'</p>':'')+'</div></div>';
}
function caseHTML(p){
  return '<div class="case"><div class="media m-teal" style="aspect-ratio:16/10;">'+ORB+'<div class="m-tag">'+(p.tag||'Featured')+'</div></div>'
    +'<div class="case-kv">'
    +'<div><div class="lbl lbl-teal" style="margin-bottom:6px;">'+(p.role||'')+'</div><h3 class="t-h3" style="margin-bottom:6px;">'+p.title+'</h3><p class="t-body">'+(p.summary||'')+'</p></div>'
    +(p.problem?'<div><div class="k">Problem</div><p class="t-body">'+p.problem+'</p></div>':'')
    +(p.outcome?'<div><div class="k">Outcome</div><p class="t-body">'+p.outcome+'</p></div>':'')
    +(p.testimonial?'<div><div class="k">What people say</div><p class="t-body" style="font-style:italic;">'+p.testimonial+'</p></div>':'')
    +(p.artifact?'<a class="case-artifact" href="'+(p.artifact.href||'#')+'" target="_blank" rel="noopener">'+(p.artifact.label||'View artifact')+' →</a>':'')
    +'</div></div>';
}
function renderPortfolio(){
  const list=buildPortfolio(); const feat=list.find(p=>p.featured)||list[0]; const rest=list.filter(p=>p!==feat);
  const fc=document.getElementById('prof-featured'); if(fc) fc.innerHTML=feat?caseHTML(feat):'';
  const pc=document.getElementById('prof-projects'); if(pc) pc.innerHTML=rest.map((p,i)=>projectCardHTML(p,i)).join('');
}
function renderActLegend(){
  const el=document.getElementById('act-legend'); if(!el) return;
  const items=[['Building',true],['Mentoring',!!(userState.completed&&userState.completed.mentor)],['Volunteering',!!(userState.completed&&userState.completed.volunteer)]].filter(x=>x[1]);
  el.innerHTML=items.map(x=>'<span class="t-small" style="display:inline-flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:3px;background:rgba(0,148,160,.55);display:inline-block;"></span>'+x[0]+'</span>').join('');
}
function renderProfBookmarks(){
  const el=document.getElementById('prof-bookmarks'); if(!el) return; const items=userState.saved||[];
  if(!items.length){ el.style.display='none'; el.innerHTML=''; return; }
  el.style.display='block';
  const names=items.slice(0,3).map(s=>s.title).join(' · ');
  el.innerHTML='<div class="lcard" style="padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;cursor:pointer;" onclick="goBookmarks()"><div><div class="lbl lbl-teal" style="margin-bottom:6px;">Bookmarks</div><div class="t-h4" style="margin-bottom:2px;">'+items.length+' saved</div><p class="t-small">'+names+'</p></div><span class="see">Open →</span></div>';
}
function renderSkills(){
  const el=document.getElementById('prof-skills'); if(!el) return; const sk=mergedSkills();
  if(!sk.length){ el.style.display='none'; el.innerHTML=''; return; }
  el.style.display='block';
  el.innerHTML='<div class="tag-wrap">'+sk.map(s=>'<span class="tag-btn active" title="From '+s.source+'" style="pointer-events:none;cursor:default;">'+s.label+'</span>').join('')+'</div>';
}
/* ── Testimonials — evidence about you, not by you. Mentors REQUEST them from
   people they've mentored; they can hide a received quote or cancel a pending
   request, but can never write or edit one. Production: mentor_testimonials
   (author ≠ mentor enforced). ── */
function testimonialBlockHTML(list, owner){
  let h='<div class="lbl" style="margin:14px 0 6px;">Testimonials</div>';
  const items=(list||[]);
  if(items.length) h+=items.map((t,i)=>'<div style="border-left:3px solid var(--teal);padding:2px 0 2px 12px;margin-bottom:10px;"><p class="t-small" style="font-style:italic;">\u201c'+escHTML(t.quote)+'\u201d</p><div style="display:flex;justify-content:space-between;gap:10px;"><span class="t-small" style="color:var(--meta);">— '+escHTML(t.from)+'</span>'+(owner?'<a class="see" style="font-size:12px;color:var(--meta);" onclick="hideTestimonial('+i+')">Hide</a>':'')+'</div></div>').join('');
  else if(!owner) h+='<p class="t-small" style="color:var(--meta);">No testimonials yet.</p>';
  if(owner){
    h+=(userState.testimonialRequests||[]).map(id=>{ const mm=memberById(id); return mm?'<span class="tag-btn" style="pointer-events:auto;cursor:default;margin:0 6px 6px 0;">Requested from '+escHTML(mm.name)+' · awaiting reply <a style="cursor:pointer;font-weight:700;margin-left:4px;" onclick="cancelTestimonialRequest(\''+id+'\')" title="Cancel request">×</a></span>':''; }).join('');
    h+='<div style="margin-top:8px;"><button class="btn btn-ghost-teal btn-sm" onclick="toggleTestimonialPicker(event)">Request a testimonial</button><div id="testi-picker" style="display:none;margin-top:10px;">'
      +'<p class="t-small" style="margin-bottom:8px;color:var(--meta);">Ask someone you\u2019ve mentored — they write it, you can\u2019t. Evidence about you, not by you.</p>'
      +MEMBERS.filter(mm=>!(userState.testimonialRequests||[]).includes(mm.id)).map(mm=>'<button class="tag-btn" style="margin:0 6px 6px 0;cursor:pointer;" onclick="requestTestimonial(\''+mm.id+'\')">'+escHTML(mm.name)+'</button>').join('')
      +'</div></div>';
  }
  return h;
}
function toggleTestimonialPicker(e){ if(e) e.stopPropagation(); const p=document.getElementById('testi-picker'); if(p) p.style.display=p.style.display==='none'?'block':'none'; }
function requestTestimonial(id){ if(!userState.testimonialRequests.includes(id)) userState.testimonialRequests.push(id); saveUserState(); renderRoleDetail(true); const p=document.getElementById('testi-picker'); if(p) p.style.display='block'; }
function cancelTestimonialRequest(id){ const i=userState.testimonialRequests.indexOf(id); if(i>=0) userState.testimonialRequests.splice(i,1); saveUserState(); renderRoleDetail(true); }
function hideTestimonial(i){ userState.testimonials.splice(i,1); saveUserState(); renderRoleDetail(true); }
function renderRoleDetail(isOwner){
  const el=document.getElementById('prof-roledetail'); if(!el) return; const blocks=[];
  if(userState.completed&&userState.completed.mentor){ const m=userState.mentorAnswers||{}; let h='<div class="lcard" style="padding:24px;"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;"><div class="lbl lbl-teal">As a mentor</div>'+(isOwner?'<button class="btn-link" style="color:var(--teal-deep);font-size:13px;" onclick="editMentorProfile()">Edit</button>':'')+'</div>';
    if(m.engage&&m.engage.length){ h+='<div class="lbl" style="margin-bottom:6px;">How I engage</div><div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">'+m.engage.map(e=>'<span class="t-small">· '+e+'</span>').join('')+'</div>'; }
    const bits=[]; if(m.tz) bits.push('<span class="t-small" style="color:var(--meta);">'+m.tz+'</span>'); if(m.booking) bits.push('<a class="t-small" style="color:var(--teal-deep);" href="'+linkify(m.booking)+'" target="_blank" rel="noopener">'+m.booking+'</a>'); if(bits.length) h+='<div style="display:flex;flex-wrap:wrap;gap:16px;">'+bits.join('')+'</div>';
    if(isOwner) h+='<p class="t-small" style="color:var(--meta);margin-top:12px;">Verification (\u201cVouched by The Labs\u201d) is added by the Labs team for mentors they\u2019ve worked with — nothing to apply for.</p>';
    h+=testimonialBlockHTML(userState.testimonials, isOwner);
    h+='</div>'; blocks.push(h); }
  if(userState.completed&&userState.completed.volunteer){ const v=userState.volunteerAnswers||{}; let h='<div class="lcard" style="padding:24px;"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;"><div class="lbl lbl-teal">As a volunteer</div>'+(isOwner?'<button class="btn-link" style="color:var(--teal-deep);font-size:13px;" onclick="editVolunteerProfile()">Edit</button>':'')+'</div>';
    if(v.ways&&v.ways.length){ h+='<div class="lbl" style="margin-bottom:6px;">How I pitch in</div><div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">'+v.ways.map(w=>'<span class="t-small">· '+w+'</span>').join('')+'</div>'; }
    if(v.hours) h+='<span class="t-small" style="color:var(--meta);">'+v.hours+'</span>';
    h+='</div>'; blocks.push(h); }
  if(!blocks.length){ el.style.display='none'; el.innerHTML=''; return; }
  el.style.display='block';
  el.innerHTML='<div class="cards two">'+blocks.join('')+'</div>';
}
function renderMentorSection(){
  const a=userState.mentorAnswers||{}; const c=document.getElementById('prof-mentor-content'); if(!c)return;
  const expertise=Array.isArray(a.expertise)?a.expertise:[]; const engage=Array.isArray(a.engage)?a.engage:[]; const tz=a.tz||''; const booking=a.booking||'';
  let h='<div class="lcard" style="padding:24px;">';
  if(expertise.length){h+='<div class="lbl" style="margin-bottom:8px;">Expertise</div><div class="tag-wrap" style="margin-bottom:16px;">';expertise.forEach(t=>{h+='<span class="tag-btn active" style="cursor:default;pointer-events:none;">'+t+'</span>';});h+='</div>';}
  if(engage.length){h+='<div class="lbl" style="margin-bottom:8px;">How I engage</div><div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">';engage.forEach(e=>{h+='<span class="t-small">· '+e+'</span>';});h+='</div>';}
  if(tz||booking){h+='<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;">';if(tz)h+='<span class="t-small" style="color:var(--meta);">'+tz+'</span>';if(booking)h+='<span class="t-small" style="color:var(--teal-deep);">'+booking+'</span>';h+='</div>';}
  h+='</div>'; c.innerHTML=h;
}
function renderVolunteerSection(){
  const a=userState.volunteerAnswers||{}; const c=document.getElementById('prof-volunteer-content'); if(!c)return;
  const areas=Array.isArray(a.areas)?a.areas:[]; const ways=Array.isArray(a.ways)?a.ways:[]; const hours=a.hours||'';
  let h='<div class="lcard" style="padding:24px;">';
  if(areas.length){h+='<div class="lbl" style="margin-bottom:8px;">Focus areas</div><div class="tag-wrap" style="margin-bottom:16px;">';areas.forEach(t=>{h+='<span class="tag-btn active" style="cursor:default;pointer-events:none;">'+t+'</span>';});h+='</div>';}
  if(ways.length){h+='<div class="lbl" style="margin-bottom:8px;">How I pitch in</div><div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">';ways.forEach(w=>{h+='<span class="t-small">· '+w+'</span>';});h+='</div>';}
  if(hours)h+='<span class="t-small" style="color:var(--meta);">'+hours+'</span>';
  h+='</div>'; c.innerHTML=h;
}
function logout(){ userState.signedIn=false; clearSession(); clearUserState(); showView('landing'); }
// Landing chrome reflects auth state: signed-in shows an avatar + Dashboard, hides Log in / Join.
/* Public accountability strip (UX_FINDINGS F3): the problems this cycle is
   investigating, with "Brought by" attribution visible to partners BEFORE any
   account exists. Titles + attribution only — the working material stays
   members-only. */
function renderLandingSituations(){
  const el=document.getElementById('landing-sits'); if(!el) return;
  el.innerHTML='<div class="lcard" style="padding:20px 24px;">'
    +'<div class="lbl lbl-teal" style="margin-bottom:10px;">What this cycle is investigating</div>'
    +SITUATIONS.map(x=>'<div style="display:flex;justify-content:space-between;gap:14px;padding:8px 0;border-bottom:1px solid var(--rule);flex-wrap:wrap;"><span class="t-small" style="color:var(--ink);font-weight:600;">'+escHTML(x.title)+'</span><span class="t-small">Brought by '+escHTML(x.owner)+'</span></div>').join('')
    +'<p class="t-small" style="margin-top:10px;color:var(--meta);">Mapped from community observations — what gets built returns to the commons at the Showcase.</p>'
    +'</div>';
}
function renderLanding(){
  renderLandingSituations(); renderLandingLabs(); // labs teasers carry joined-state pills — refresh per visit
  const on=!!userState.signedIn;
  LabsChrome.sessionChrome(); // flips the injected nav's auth state + avatar initials
  document.querySelectorAll('#view-landing .hero-cta-out').forEach(e=>e.style.display=on?'none':'');
  document.querySelectorAll('#view-landing .hero-cta-in').forEach(e=>e.style.display=on?'':'none');
  // Reset any stale hero fade/parallax + nav-hide from a prior scroll session when landing is re-shown.
  const hi=document.querySelector('#view-landing .hero-inner'); if(hi){ hi.style.opacity=''; hi.style.transform=''; }
  const nav=document.querySelector('#view-landing .sitenav'); if(nav) nav.classList.remove('nav-hidden');
}
function initHeroScroll(){
  const nav=document.querySelector('#view-landing .sitenav');
  const hero=document.querySelector('#view-landing .hero-band');
  const inner=document.querySelector('#view-landing .hero-inner');
  if(!nav||!hero||!inner) return;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking=false;
  function update(){
    ticking=false;
    const y=window.scrollY||document.documentElement.scrollTop, h=hero.offsetHeight;
    nav.classList.toggle('nav-hidden', y > h-80);
    if(!reduce){
      const p=Math.min(1, y/(h*0.62));
      inner.style.opacity=String(1-p);
      inner.style.transform='translateY('+(p*48)+'px)';
    }
  }
  window.addEventListener('scroll',()=>{ if(!ticking){ ticking=true; requestAnimationFrame(update); } }, {passive:true});
  update();
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeSaveGate(); });
/* ── Feedback — every screen carries the launcher; entries log to FEEDBACK_LOG
   (production: a feedback table + ops notification). ── */
const FEEDBACK_LOG=[];
let fbCategory='Idea';
function fbScreen(){ const v=document.querySelector('#screens > .view.active'); const p=document.querySelector('.panel.active'); return (v?v.id:'?')+(p?'/'+p.id:''); }
function renderFbCats(){ document.getElementById('fb-cats').innerHTML=['Bug','Idea','Confusing','Love it'].map(c=>'<button class="chip'+(fbCategory===c?' active':'')+'" onclick="fbCategory=\''+c+'\';renderFbCats()">'+c+'</button>').join(''); }
function openFeedback(){ fbCategory='Idea'; renderFbCats(); document.getElementById('fb-body').value=''; document.getElementById('fb-form').style.display='block'; document.getElementById('fb-done').style.display='none'; document.getElementById('fb-modal').classList.add('open'); document.getElementById('fb-body').focus(); }
function closeFeedback(){ document.getElementById('fb-modal').classList.remove('open'); }
function submitFeedback(){ const body=document.getElementById('fb-body').value.trim(); if(!body){ document.getElementById('fb-body').focus(); return; } FEEDBACK_LOG.push({category:fbCategory, body:body, at:Date.now(), screen:fbScreen()}); document.getElementById('fb-form').style.display='none'; document.getElementById('fb-done').style.display='block'; }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeFeedback(); });
/* ── Demo session flag (olos.session.v1) — the prototype's stand-in for the auth
   cookie. Written on signup / returning sign-in / waitlist changes, cleared on
   sign-out; read here at boot and by every generated events/ library/ labs/ page
   so real page navigations keep the signed-in demo coherent. NEVER real auth —
   display-only payload; index.html stays the source of truth and rewrites it on
   every state-changing action. */
const SESSION_KEY='olos.session.v1';
function writeSession(){ try{ localStorage.setItem(SESSION_KEY, JSON.stringify({v:1, signedIn:userState.signedIn, name:userState.name, initials:userState.initials, fullName:userState.fullName, lab:{slug:userState.lab.slug||'', name:userState.lab.name||'', status:userState.lab.status||''}, waitlists:userState.waitlists.slice(), at:Date.now()})); }catch(e){} }
function clearSession(){ try{ localStorage.removeItem(SESSION_KEY); }catch(e){} }
/* ── The rest of the demo state (olos.userState.v1) — everything the session flag
   doesn't carry: cycle membership + agreement, learning logs (the gate reads these),
   hearts, follows, updates, ballots, answers. Written by saveUserState() at every
   state-changing action — each call site maps 1:1 to a production POST/PATCH (see
   docs/HANDOFF.md §6). Display-only demo state, never real auth; cleared with the
   session on sign-out. */
const USTATE_KEY='olos.userState.v1';
function saveUserState(){ if(!userState.signedIn) return; try{ localStorage.setItem(USTATE_KEY, JSON.stringify({v:1,
  completed:userState.completed, roles:userState.roles, isMentor:userState.isMentor,
  learningLogs:userState.learningLogs, saved:userState.saved, following:userState.following, updates:userState.updates,
  cycleAgreement:userState.cycleAgreement||null, cycleStatus:userState.cycleStatus||null, stepBackNote:userState.stepBackNote||'',
  ballot:userState.ballot, projectId:userState.projectId, pod:userState.pod||null,
  nominations:userState.nominations, mentorRequests:userState.mentorRequests,
  testimonials:userState.testimonials, testimonialRequests:userState.testimonialRequests,
  profileAnswers:userState.profileAnswers, mentorAnswers:userState.mentorAnswers, volunteerAnswers:userState.volunteerAnswers,
  profileVisibility:userState.profileVisibility||'', referral:userState.referral||null,
  answers:userState.answers||{}, agreements:userState.agreements||[], contactOptIn:!!userState.contactOptIn, emails:userState.emails||[],
  checklist:userState.checklist||[], dismissedTodos:[...dismissedTodos], at:Date.now()})); }catch(e){} }
function clearUserState(){ try{ localStorage.removeItem(USTATE_KEY); }catch(e){} }
function readUserState(){
  let u=null; try{ u=JSON.parse(localStorage.getItem(USTATE_KEY)||'null'); }catch(e){}
  if(!u||u.v!==1||!userState.signedIn) return;
  ['completed','roles','isMentor','learningLogs','saved','following','updates','cycleAgreement','cycleStatus','stepBackNote','ballot','projectId','pod','nominations','mentorRequests','testimonials','testimonialRequests','profileAnswers','mentorAnswers','volunteerAnswers','profileVisibility','referral','checklist','answers','agreements','contactOptIn','emails'].forEach(k=>{ if(u[k]!==undefined&&u[k]!==null) userState[k]=u[k]; });
  (u.dismissedTodos||[]).forEach(id=>dismissedTodos.add(id));
  if(userState.pod) CYCLE.pod=userState.pod;
}
function restoreChecklist(){ const rows=[...document.querySelectorAll('#checklist-items input[type=checkbox]')]; rows.forEach((cb,i)=>{ if(Array.isArray(userState.checklist)&&userState.checklist[i]&&!cb.checked){ cb.checked=true; tickChecklist(cb); } }); }
function restoreSession(){
  let s=null; try{ s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); }catch(e){}
  if(!s||!s.signedIn) return;
  userState.signedIn=true; userState.name=s.name||userState.name; userState.initials=s.initials||userState.initials; userState.fullName=s.fullName||userState.fullName;
  if(s.lab&&s.lab.name) userState.lab={...(METROS[s.lab.slug]||{}), ...s.lab};
  userState.waitlists=(s.waitlists||[]).filter(w=>METROS[w]);
  readUserState();
  const ha=document.getElementById('header-avatar'); if(ha) ha.textContent=userState.initials;
  const da=document.getElementById('dash-avatar'); if(da) da.textContent=userState.initials;
  const pa=document.getElementById('prof-avatar'); if(pa) pa.textContent=userState.initials;
  const pn=document.getElementById('prof-name'); if(pn&&userState.fullName) pn.textContent=userState.fullName;
  const dg=document.getElementById('dash-greeting'); if(dg) dg.textContent='Welcome back, '+userState.name+'.';
  renderTodos(); renderDashSaved(); renderDashCycle(); renderProfileChecklist(); restoreChecklist();
}


/* ── The ceremony layer — every flow/ceremony view and shared modal, injected at
   boot on index.html AND every app page (the search.js overlay pattern): one
   markup source, so any page can host any flow it launches with zero drift.
   Production: these are client components imported by any route. */
const CEREMONY_VIEWS_HTML = `
  <div id="view-flow" class="view light onboard s-paper">
    <div class="sheet">
      <div class="topbar"><button class="icon-btn" id="flow-back"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button><div class="seg" id="flow-seg"></div><span class="lbl" id="flow-counter" style="flex-shrink:0;"></span></div>
      <div class="vscroll pad" id="flow-scroll"><div class="lbl lbl-teal flow-eyebrow" id="flow-eyebrow"></div><h2 class="t-h1 flow-q" id="flow-q"></h2><p class="t-body flow-help" id="flow-help"></p><div id="flow-input"></div></div>
      <div class="actionbar light-bar" id="flow-actions"></div>
    </div>
  </div>

  <!-- ════════ MENTOR EXPLAINER ════════ -->
  <div id="view-mentor-explainer" class="view light onboard s-paper">
    <div class="sheet">
      <div class="topbar"><button class="icon-btn" aria-label="Back" onclick="mentorBack()"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button></div>
      <div class="vscroll pad">
        <div id="ms1">
          <div class="lbl lbl-teal" style="margin-bottom:16px;">For mentors</div>
          <h2 class="t-h1" style="margin-bottom:24px;">Two ways to mentor</h2>
          <div style="display:flex;flex-direction:column;gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:var(--r);overflow:hidden;margin-bottom:20px;">
            <div style="padding:22px 20px;background:var(--white);"><div class="lbl lbl-teal" style="margin-bottom:10px;">Cycle workshops</div><div class="t-h4" style="margin-bottom:8px;">Lead structured sessions</div><p class="t-small">Run workshops and skill sprints that support the current Build Cycle theme.</p></div>
            <div style="padding:22px 20px;background:var(--white);"><div class="lbl lbl-teal" style="margin-bottom:10px;">Pod support</div><div class="t-h4" style="margin-bottom:8px;">Step in on-demand</div><p class="t-small">Advice and unblocking when pods raise their hand — as much or as little as you like.</p></div>
          </div>
          <div class="lbl" style="margin-bottom:8px;">Room for all kinds of expertise</div><p class="t-small">Subject matter · Technical · Soft skills · Strategy · Operations</p>
        </div>
        <div id="ms2" style="display:none;">
          <div class="lbl lbl-teal" style="margin-bottom:16px;">What upskilling means here</div>
          <h2 class="t-h1" style="margin-bottom:20px;">Not a curriculum. Real work.</h2>
          <p class="t-lede" style="margin-bottom:20px;">We're not a course platform. Upskilling here means learning through real, collaborative work — building things, making decisions, iterating with peers.</p>
          <p class="t-body" style="margin-bottom:20px;">As a mentor, you support that process — not teach a subject. You bring your judgment; participants bring their problems.</p>
          <div class="lcard" style="padding:16px 20px;background:var(--tint);"><div class="lbl lbl-teal" style="margin-bottom:6px;">Where your answers go</div><p class="t-small">The next few questions <b>publish your mentor profile</b> — upskillers find you in the community directory, and project teams reach you through evidence-backed requests you choose to pick up. The Labs team sees new mentor profiles too and can make introductions. Live immediately — no application, no review queue.</p></div>
        </div>
      </div>
      <div class="actionbar light-bar"><button class="btn btn-teal btn-block" id="me-next" onclick="mentorSlideNext()">Next</button></div>
    </div>
  </div>

  <!-- ════════ STUB ════════ -->
  <div id="view-stub" class="view light onboard s-paper">
    <div class="sheet">
      <div class="vscroll pad" style="display:flex;flex-direction:column;justify-content:center;text-align:center;align-items:center;min-height:420px;">
        <div style="width:64px;height:64px;border-radius:50%;background:rgba(0,148,160,.12);display:flex;align-items:center;justify-content:center;margin-bottom:24px;"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--teal-deep)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <h2 class="t-h2" style="margin-bottom:12px;">You're all set</h2>
        <p class="t-body" style="max-width:280px;">This is a click-through prototype — in the real product, this action would be handled here.</p>
      </div>
      <div class="actionbar light-bar"><button class="btn btn-ghost btn-block" onclick="goApp('dashboard')">Back to dashboard</button></div>
    </div>
  </div>

  <!-- ════════ PROFILE ════════ -->
  <!-- ════════ SURVEY SHARE ════════ -->
  <div id="view-survey-share" class="view light s-paper">
    <div class="vscroll">
      <div class="container" style="max-width:560px;padding-top:64px;padding-bottom:48px;text-align:center;">
        <div class="lbl lbl-teal" style="margin-bottom:14px;">Field survey · Civic &amp; Elections</div>
        <h1 class="t-h1" style="margin-bottom:12px;">Thanks — your observations are in the pool.</h1>
        <p class="t-lede" style="margin-bottom:32px;">Now grow it. Share this survey with your network — every observation makes the community's problem map sharper.</p>
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          <input id="survey-share-url" readonly class="field-input" style="flex:1;border:1px solid var(--rule);border-radius:var(--r);padding:14px;font:inherit;font-size:16px;background:var(--white);color:var(--slate);" value="">
          <button class="btn btn-teal" onclick="copySurveyLink(this)">Copy link</button>
        </div>
        <p class="t-small" style="margin-bottom:36px;">Anyone with the link can add observations — no account needed.</p>
        <button class="btn btn-red btn-lg btn-block" style="margin-bottom:14px;" onclick="openTriangulator()">Open the Triangulator →</button>
        <button class="btn-link" style="color:var(--meta);" id="survey-exit" onclick="exitSurveyShare()">Back to dashboard</button>
        <p class="t-small" style="margin-top:24px;color:var(--meta);">Your observations join the cycle's shared map in the Triangulator. Nothing gets published under your name.</p>
      </div>
    </div>
  </div>

  <!-- ════════ TRIANGULATOR (embedded tool) ════════ -->
  <div id="view-triangulator" class="view light s-paper" style="height:100svh;">
    <header class="topnav" style="flex-shrink:0;">
      <div class="topnav-inner">
        <div style="display:flex;align-items:center;gap:10px;"><img src="assets/logo-lockup-light.png" alt="The Upskilling Labs" style="height:44px;width:auto;display:block;"><span class="lbl" style="color:var(--od2);">The Triangulator</span></div>
        <button class="btn btn-ghost btn-sm" id="tri-exit" style="margin-left:auto;color:#fff;border-color:rgba(255,255,255,.45);" onclick="exitTriangulator()">← Back to Dashboard</button>
      </div>
    </header>
    <!-- Same-origin iframe: the tool reads the shared survey pool from localStorage
         ('olos.surveyPool.v1'). Never reset src mid-session — the tool guards
         unsaved work with its own beforeunload handler. -->
    <iframe id="triangulator-frame" title="The Triangulator" style="flex:1;width:100%;border:0;display:block;"></iframe>
  </div>

  <!-- ════════ TEAM IGNITION (interstitial) ════════ -->
  <div id="view-team-ignition" class="view s-cover grain on-dark">
    <div class="vscroll" style="display:flex;align-items:center;justify-content:center;min-height:100dvh;">
      <div class="container" style="max-width:520px;text-align:center;padding:48px 24px;">
        <div class="lbl lbl-teal" style="margin-bottom:18px;">Team initialized</div>
        <h1 class="t-display" style="margin-bottom:16px;">You're in. The team is real.</h1>
        <p class="t-lede" id="ignition-copy" style="margin-bottom:36px;">Enough builders registered — this proposal just became a project.</p>
        <button class="btn btn-red btn-lg btn-block" onclick="openProjectCanvas()">Open the project canvas →</button>
        <button class="btn-link" style="color:var(--od2);margin-top:16px;" onclick="goApp('cycles')">Later — back to your cycle</button>
      </div>
    </div>
  </div>

  <!-- ════════ CYCLE THRESHOLD (the seam: account → cycle registration) ════════
       Value before terms, terms before effort (facilitator feedback): beat 1 says
       what a cycle IS and what you get; beat 2 states the three commitments plainly;
       the Open Cycle Agreement signature (last flow step) completes registration.
       Dark cover = the house register for state changes (see view-team-ignition).
       All registration entry points route through startCycleRegistration(). -->
  <div id="view-cycle-threshold" class="view s-cover grain on-dark">
    <div class="vscroll">
      <div class="container" style="max-width:560px;padding:48px 24px 56px;">
        <div class="lbl lbl-teal" style="margin-bottom:18px;" id="th-eyebrow">Summer 2026 · Civic &amp; Elections · An Open Cycle</div>

        <!-- Beat 0 · The cycle pitch (signup ending only) — what THIS season is,
             before the value beat. Hidden for every other registration entry. -->
        <div id="ts0" style="display:none;">
          <h1 class="t-display" style="margin-bottom:14px;">This season: Civics &amp; Elections.</h1>
          <p class="t-lede" style="color:var(--od2);margin-bottom:28px;">Elections run on trust, information, and systems most of us never see. This cycle, you’ll dig into how they actually work — and where new tools, including AI, can help communities strengthen civic life and protect democratic engagement.</p>
          <button class="btn btn-red btn-lg btn-block" style="margin-top:8px;" onclick="thresholdNext()">Tell me more →</button>
        </div>

        <!-- Beat 1 · Benefits first, rooted in the member's hero's journey (voice rule):
             open with where THEY end up, then the path, then what it takes. -->
        <div id="ts1">
          <h1 class="t-display" style="margin-bottom:14px;">Thirteen weeks from now, you’ll have built something real.</h1>
          <p class="t-lede" style="color:var(--od2);margin-bottom:28px;">You’ll pick a problem that matters to you, team up, and see it through — with mentors and a whole community behind you.</p>
          <div class="th-card">
            <div class="lbl lbl-teal" style="margin-bottom:8px;">What you walk away with</div>
            <p class="t-small" style="color:var(--od2);">Something real you helped build, proof of it on your profile, and people who’ve seen what you can do.</p>
          </div>
          <div class="th-card">
            <div class="lbl lbl-teal" style="margin-bottom:8px;">How you get there</div>
            <p class="t-small" style="color:var(--od2);">Month one: dig into a real problem with your pod. Month two: decide what to build at the Hackathon. Month three: build it, test it, and show it.</p>
          </div>
          <div class="th-card">
            <div class="lbl lbl-teal" style="margin-bottom:8px;">What it takes</div>
            <p class="t-small" style="color:var(--od2);">Six in-person events, a five-minute check-in each week, and the rest on your own time with your team.</p>
          </div>
          <button class="btn btn-red btn-lg btn-block" style="margin-top:8px;" onclick="thresholdNext()">See the commitment →</button>
        </div>

        <!-- Beat 2 · The deal (three commitments, plain speech) -->
        <div id="ts2" style="display:none;">
          <h1 class="t-display" style="margin-bottom:14px;">Here’s the deal.</h1>
          <p class="t-lede" style="color:var(--od2);margin-bottom:28px;">Three things. They’re what makes a cycle work, and you’ll put your name to them.</p>
          <div class="th-card">
            <div class="lbl lbl-teal" style="margin-bottom:8px;">1 · Show up</div>
            <div class="t-h4" style="margin-bottom:6px;">Be at the five core events</div>
            <p class="t-small" style="color:var(--od2);margin-bottom:8px;">Kickoff (Jul 14) gets it started. These five are where the whole cycle happens in person — your pod plans around you being there.</p>
            <div id="th-events"></div>
          </div>
          <div class="th-card">
            <div class="lbl lbl-teal" style="margin-bottom:8px;">2 · Check in</div>
            <div class="t-h4" style="margin-bottom:6px;">Once a week, five minutes</div>
            <p class="t-small" style="color:var(--od2);">One short log each week so your pod knows where you’re at. If you skip it, the app pauses until you catch up. And if life gets busy, just tell your Poderator — that’s always okay.</p>
          </div>
          <div class="th-card">
            <div class="lbl lbl-teal" style="margin-bottom:8px;">3 · Open source</div>
            <div class="t-h4" style="margin-bottom:6px;">The projects belong to everyone</div>
            <p class="t-small" style="color:var(--od2);">Everything a team builds here is an open-source community project. When the cycle’s over, you’re free to do whatever you want with it — and so is everyone else. MIT for code, CC BY 4.0 for the rest, with everyone who worked on it credited.</p>
          </div>
          <button class="btn btn-red btn-lg btn-block" style="margin-top:8px;" onclick="beginCycleRegistration()">Begin registration →</button>
        </div>

        <button class="btn-link" style="color:var(--od2);margin-top:16px;display:block;margin-left:auto;margin-right:auto;" onclick="declineCycleThreshold()">Not now — stay a member, browse the free events</button>
      </div>
    </div>
  </div>

  <!-- ════════ CYCLE SIGNED (registration confirmation) ════════ -->
  <div id="view-cycle-signed" class="view light s-paper">
    <div class="vscroll" style="display:flex;align-items:center;justify-content:center;min-height:100dvh;">
      <div class="container" style="max-width:520px;text-align:center;padding:48px 24px;">
        <div class="lbl lbl-teal" style="margin-bottom:18px;">Registration complete</div>
        <h1 class="t-h1" style="margin-bottom:12px;">You&rsquo;re registered ✓</h1>
        <p class="t-lede" style="margin-bottom:8px;">See you at Kickoff — July 14, DC Public Library.</p>
        <p class="t-small" style="margin-bottom:28px;" id="cs-agreement">Open Cycle Agreement · signed — it lives on your profile.</p>
        <a class="btn btn-ghost-teal btn-block" style="margin-bottom:12px;" id="cs-ics" download="open-cycle-events.ics">Add the cycle&rsquo;s events to your calendar</a>
        <p class="t-small" style="color:var(--meta);margin-bottom:12px;">Your committed dates live on your cycle page and dashboard — find them there anytime.</p>
        <div id="cs-actions"></div>
      </div>
    </div>
  </div>

  <!-- ════════ WELCOME BACK (returning member hits Join again) ════════ -->
  <div id="view-welcome-back" class="view light s-paper">
    <div class="vscroll" style="display:flex;align-items:center;justify-content:center;min-height:100dvh;">
      <div class="container" style="max-width:520px;text-align:center;padding:48px 24px;">
        <div class="lbl lbl-teal" style="margin-bottom:18px;">You already have an account ✓</div>
        <h1 class="t-h1" style="margin-bottom:12px;" id="wb-greeting">Welcome back.</h1>
        <p class="t-lede" style="margin-bottom:24px;">Here’s what we have on file. Update anything — or take on a new role.</p>
        <div id="wb-rows" style="margin-bottom:24px;"></div>
        <button class="btn btn-red btn-lg btn-block" style="margin-bottom:12px;" onclick="showRoleUpdate()">Change how you take part →</button>
        <button class="btn btn-ghost-teal btn-block" style="margin-bottom:12px;" onclick="editSignupDetails()">Update your details</button>
        <button class="btn-link" style="color:var(--meta);" onclick="closeOnboarding()">Done — back to The Labs</button>
      </div>
    </div>
  </div>

  <!-- ════════ THANK YOU (the close of onboarding — either path) ════════ -->
  <div id="view-thankyou" class="view light s-paper">
    <div class="vscroll" style="display:flex;align-items:center;justify-content:center;min-height:100dvh;">
      <div class="container" style="max-width:520px;text-align:center;padding:48px 24px;">
        <div class="lbl lbl-teal" style="margin-bottom:18px;">You’re a member ✓</div>
        <h1 class="t-h1" style="margin-bottom:12px;">Thank you — welcome to The Labs.</h1>
        <p class="t-lede" style="margin-bottom:24px;">Here’s everything you signed up for, in one place.</p>
        <div id="ty-rows" style="margin-bottom:20px;"></div>
        <p class="t-small" style="color:var(--meta);margin-bottom:28px;">We’ve emailed this summary to alex.rivera@gmail.com, with your documents and dates. <span style="color:var(--meta-soft);">(Simulated in this prototype.)</span></p>
        <button class="btn btn-teal btn-lg btn-block" onclick="closeOnboarding()">Done</button>
      </div>
    </div>
  </div>

  <!-- ════════ PROJECT INSTANCE CANVAS (static mockup) ════════ -->
  <div id="view-project-canvas" class="view light s-paper">
    <div class="prof-bar">
      <button class="icon-btn" aria-label="Back" onclick="goApp('cycles')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>
      <span class="lbl" style="margin-left:4px;">Project instance</span>
    </div>
    <div class="vscroll">
      <div class="container" style="max-width:920px;padding-top:32px;padding-bottom:48px;">
        <div class="lbl lbl-teal" style="margin-bottom:8px;">Scoping · from &ldquo;<span id="pc-situation">the problem situation</span>&rdquo;</div>
        <h1 class="t-h1" id="pc-title" style="margin-bottom:8px;">New project</h1>
        <div style="margin-bottom:10px;"><span class="status active" id="pc-teamname"></span></div>
        <p class="t-lede" id="pc-frame" style="max-width:60ch;margin-bottom:24px;"></p>
        <div style="margin-bottom:36px;">
          <div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--rule);"><span class="lbl" style="width:110px;flex-shrink:0;padding-top:2px;">Intervention</span><span class="t-body" style="flex:1;" id="pc-intervention"></span></div>
          <div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--rule);"><span class="lbl" style="width:110px;flex-shrink:0;padding-top:2px;">Metrics</span><span class="t-body" style="flex:1;" id="pc-metrics"></span></div>
          <div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--rule);"><span class="lbl" style="width:110px;flex-shrink:0;padding-top:2px;">Evidence</span><span class="t-body" style="flex:1;" id="pc-evidence"></span></div>
          <div style="display:flex;gap:16px;padding:12px 0;"><span class="lbl" style="width:110px;flex-shrink:0;padding-top:2px;">Owner</span><span class="t-body" style="flex:1;" id="pc-owner"></span></div>
        </div>

        <div class="section-head" style="padding-bottom:12px;"><div><div class="lbl lbl-teal" style="margin-bottom:6px;">Team roster</div><h2 class="t-h3">3–5 builders · self-serve registration</h2></div></div>
        <div id="pc-roster" style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:44px;"></div>

        <div class="section-head" style="padding-bottom:12px;"><div><div class="lbl lbl-teal" style="margin-bottom:6px;">Case study</div><h2 class="t-h3">The public record of this project</h2></div></div>
        <div class="lcard" style="padding:24px;">
          <p class="t-body" style="margin-bottom:16px;">The case study is drafted by the team and published on every member's profile. Edits to a published case study need peer sign-off before going live.</p>
          <div id="pc-pending-banner" style="display:none;background:var(--tint);border:1px solid var(--rule);border-radius:var(--r);padding:12px 16px;margin-bottom:16px;"><span class="t-small" style="color:var(--teal-deep);font-weight:600;">Changes pending. Requires +2 peer approvals to publish live.</span></div>
          <button class="btn btn-ghost-teal btn-sm" onclick="document.getElementById('pc-pending-banner').style.display='block'">Edit case study</button>
          <p class="t-small" style="margin-top:14px;color:var(--meta);">On approval, the case study and its playbook return to the commons — the Living Library.</p>
        </div>

        <div class="section-head" style="padding-bottom:12px;margin-top:36px;"><div><div class="lbl lbl-teal" style="margin-bottom:6px;">Just-in-time support</div><h2 class="t-h3">Stuck? Bring evidence, get leverage</h2></div></div>
        <div class="lcard" style="padding:24px;">
          <p class="t-body" style="margin-bottom:16px;">Mentors respond to evidence-backed requests — journal entries, interview summaries, failed experiments. The mentor arrives when leverage is highest.</p>
          <button class="btn btn-teal btn-sm" onclick="startFlow('mentorRequest', ()=>showView('project-canvas'))">Request a mentor</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ════════ APP SHELL ════════ -->
`;
const CEREMONY_MODALS_HTML = `
<!-- Step back from the cycle — leaving well is respected (UX_FINDINGS F4) -->
  <div class="gate-modal" id="stepback-modal" onclick="if(event.target===this)closeStepBack()">
    <div class="gate-sheet">
      <button class="gate-close" onclick="closeStepBack()" aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5L17 17M17 5L5 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <h3 class="t-h3" style="margin-bottom:6px;padding-right:32px;">Step back from the cycle</h3>
      <p class="t-small" style="margin-bottom:14px;">Leaving well is respected — going quiet is the only thing that isn&rsquo;t. Your Poderator gets this note, your pod stops planning around you, and everything you returned to the commons stays credited. The door stays open.</p>
      <label class="t-small" for="sb-note" style="display:block;margin-bottom:6px;font-weight:600;color:var(--ink);">A note for your Poderator (optional)</label>
      <textarea id="sb-note" rows="3" placeholder="e.g. Work got heavy — I need to pause. I&rsquo;d like to come back for the next cycle." style="width:100%;border:1px solid var(--rule);border-radius:var(--r);padding:12px 14px;font:inherit;font-size:16px;resize:vertical;background:var(--white);margin-bottom:14px;"></textarea>
      <button class="btn btn-teal btn-block" onclick="confirmStepBack()">Step back — and leave well</button>
      <button class="btn-link" style="display:block;margin:10px auto 0;color:var(--meta);" onclick="closeStepBack()">Never mind — I&rsquo;m staying</button>
    </div>
  </div>

  <div class="gate-modal" id="rsvp-modal" onclick="if(event.target===this)closeRsvp()">
  <div class="gate-sheet s-paper">
    <button class="gate-close" onclick="closeRsvp()" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5L17 17M17 5L5 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <div id="rsvp-body">
      <h3 class="t-h3" style="margin-bottom:6px;">Save a spot</h3>
      <p class="t-body" id="rsvp-ctx" style="margin-bottom:16px;"></p>
      <input id="rsvp-email" type="email" placeholder="you@email.com" style="width:100%;border:1px solid var(--rule);border-radius:var(--r);padding:14px;font:inherit;font-size:16px;background:var(--white);margin-bottom:12px;">
      <button class="btn btn-teal btn-block" onclick="submitRsvp()">Save my spot</button>
      <p class="t-small" style="margin-top:12px;color:var(--meta);">Free and first come, first served — no account needed. We'll send the details.</p>
    </div>
    <div id="rsvp-done" style="display:none;text-align:center;padding:12px 0;">
      <h3 class="t-h3" style="margin-bottom:8px;">Spot saved ✓</h3>
      <p class="t-body" style="margin-bottom:16px;">Details are on their way to your inbox. See you there.</p>
      <button class="btn btn-ghost-teal btn-sm" onclick="closeRsvp()">Done</button>
    </div>
  </div>
</div>

<!-- Waitlist join — the "we're not there yet" moment. City first, account second (owner
     decision): anonymous visitors see this modal too; their join tap commits the city
     (pendingWaitlist) and routes into account creation, which finishes the join. -->
<div class="gate-modal" id="waitlist-modal" onclick="if(event.target===this)closeWaitlist()">
  <div class="gate-sheet s-paper">
    <button class="gate-close" onclick="closeWaitlist()" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5L17 17M17 5L5 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <div id="wl-body">
      <div class="lbl lbl-teal" id="wl-eyebrow" style="margin-bottom:6px;"></div>
      <h3 class="t-h3" id="wl-title" style="margin-bottom:6px;padding-right:32px;"></h3>
      <p class="t-body" id="wl-ctx" style="margin-bottom:16px;"></p>
      <button class="btn btn-red btn-block" id="wl-join-btn">Join the waitlist</button>
      <p class="t-small" id="wl-fine" style="margin-top:12px;color:var(--meta);">One tap. One email when it happens. That's it.</p>
    </div>
    <div id="wl-done" style="display:none;text-align:center;padding:12px 0;">
      <h3 class="t-h3" id="wl-done-title" style="margin-bottom:8px;">You're on the list ✓</h3>
      <p class="t-body" id="wl-done-body" style="margin-bottom:16px;"></p>
      <button class="btn btn-ghost-teal btn-sm" onclick="closeWaitlist()">Done</button>
    </div>
  </div>
</div>

<!-- Ballot confirm — casting locks the ballot; say so before the click. -->
<div class="gate-modal" id="ballot-confirm" onclick="if(event.target===this)closeBallotConfirm()">
  <div class="gate-sheet s-paper">
    <button class="gate-close" onclick="closeBallotConfirm()" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5L17 17M17 5L5 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <h3 class="t-h3" style="margin-bottom:10px;padding-right:32px;">Cast your ballot</h3>
    <div id="ballot-summary" style="margin-bottom:14px;"></div>
    <p class="t-small" style="color:var(--meta);margin-bottom:20px;">Ballots lock once cast — allocations can’t be changed after.</p>
    <button class="btn btn-teal btn-block" style="margin-bottom:10px;" onclick="confirmBallot()">Cast my ballot</button>
    <button class="btn-link" style="color:var(--meta);width:100%;" onclick="closeBallotConfirm()">Not yet</button>
  </div>
</div>

<!-- Pod chooser — "Join a pod" shows actual pods (it used to misroute into registration) -->
<div class="gate-modal" id="pod-chooser" onclick="if(event.target===this)closePodChooser()">
  <div class="gate-sheet s-paper">
    <button class="gate-close" onclick="closePodChooser()" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5L17 17M17 5L5 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <div class="lbl lbl-teal" style="margin-bottom:6px;">Civic &amp; Elections · Summer 2026</div>
    <h3 class="t-h3" style="margin-bottom:6px;padding-right:32px;">Join a pod</h3>
    <p class="t-small" style="margin-bottom:16px;">Pods are 12–30 people investigating one problem together. Pick where you’ll dig in — if you’re not registered for the cycle yet, that takes a few minutes and a signature first.</p>
    <div id="pod-list"></div>
  </div>
</div>

<!-- Phase info — a compact per-phase explainer (ⓘ, deliberately not an expandable) -->
<div class="gate-modal" id="phase-info-modal" onclick="if(event.target===this)closePhaseInfo()">
  <div class="gate-sheet s-paper">
    <button class="gate-close" onclick="closePhaseInfo()" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5L17 17M17 5L5 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <div class="lbl lbl-teal" id="phase-info-when" style="margin-bottom:6px;"></div>
    <h3 class="t-h3" id="phase-info-title" style="margin-bottom:10px;padding-right:32px;"></h3>
    <p class="t-body" id="phase-info-body"></p>
  </div>
</div>

<!-- Feedback — triggered from the avatar's "Send feedback" menu item (signed-in only). Logs to FEEDBACK_LOG. -->
<div class="gate-modal" id="fb-modal" onclick="if(event.target===this)closeFeedback()">
  <div class="gate-sheet s-paper">
    <button class="gate-close" onclick="closeFeedback()" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5L17 17M17 5L5 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <div id="fb-form">
      <h3 class="t-h3" style="margin-bottom:6px;padding-right:32px;">Send feedback</h3>
      <p class="t-small" style="margin-bottom:16px;">Goes straight to the Labs team. We read everything.</p>
      <div id="fb-cats" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;"></div>
      <textarea id="fb-body" rows="4" placeholder="What happened? What would make it better?" style="width:100%;border:1px solid var(--rule);border-radius:var(--r);padding:12px 14px;font:inherit;font-size:16px;resize:vertical;background:var(--white);margin-bottom:16px;"></textarea>
      <button class="btn btn-teal btn-block" onclick="submitFeedback()">Send feedback</button>
    </div>
    <div id="fb-done" style="display:none;text-align:center;padding:8px 0;">
      <h3 class="t-h3" style="margin-bottom:8px;">Thank you ✓</h3>
      <p class="t-small" style="margin-bottom:18px;">Got it — along with the screen you were on. Thanks for making this better.</p>
      <button class="btn btn-ghost-teal btn-block" onclick="closeFeedback()">Done</button>
    </div>
  </div>
</div>

<!-- Save gate — shown when a public visitor tries to bookmark a workshop/cycle/lab -->
<div class="gate-modal" id="save-gate" onclick="if(event.target===this)closeSaveGate()">
  <div class="gate-sheet s-paper">
    <button class="gate-close" onclick="closeSaveGate()" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5L17 17M17 5L5 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <div class="gate-heart">
      <svg viewBox="0 0 24 24" fill="var(--red)" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>
    </div>
    <h3 class="t-h3" style="margin-bottom:8px;">Save this for later</h3>
    <p class="t-body" style="color:var(--slate);margin-bottom:24px;">Create a free account to bookmark workshops, cycles, and labs — and pick up right where you left off.</p>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <button class="btn btn-red btn-lg btn-block" onclick="closeSaveGate();startCreateAccount()">Join The Labs</button>
      <button class="btn btn-ghost-teal btn-lg btn-block" onclick="closeSaveGate();signinReturning()">Log in</button>
    </div>
  </div>
</div>

<!-- Real profile editor — all fields on one screen, pre-filled (not the onboarding wizard) -->
<div class="gate-modal editor-modal" id="profile-editor" onclick="if(event.target===this)closeProfileEditor()">
  <div class="editor-sheet s-paper">
    <div class="editor-head">
      <h3 class="t-h3">Edit profile</h3>
      <button class="gate-close" onclick="closeProfileEditor()" aria-label="Close" style="position:static;">
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5L17 17M17 5L5 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="editor-body" id="editor-body"></div>
    <div class="editor-foot">
      <button class="btn btn-ghost btn-sm" onclick="closeProfileEditor()">Cancel</button>
      <button class="btn btn-teal btn-sm" onclick="saveProfileEditor()">Save profile</button>
    </div>
  </div>
</div>
`;
function injectCeremonies(){
  const screens=document.getElementById('screens');
  if(screens && !document.getElementById('view-flow')) screens.insertAdjacentHTML('beforeend', CEREMONY_VIEWS_HTML);
  if(!document.getElementById('fb-modal')) document.body.insertAdjacentHTML('beforeend', CEREMONY_MODALS_HTML);
}

/* ── App page boot — each real app page calls App.boot('<page>') after the data
   files + chrome.js load. Production twin: the authed route's layout + loader
   (auth guard = middleware; the log gate = the same middleware reading
   learning_logs). index.html does NOT call this — it has its own boot. */
const PAGE_RENDER={
  home(){ const dg=document.getElementById('dash-greeting'); if(dg) dg.textContent='Welcome back, '+userState.name+'.';
    renderTodos(); renderDashSaved(); renderDashCycle(); renderProfileChecklist(); restoreChecklist(); renderLearningLog(); applyLogGate(); },
  cycle(){ buildWeekRail(); renderCycleSituations(); renderCycleCommitments(); renderCycleFormation(); },
  learning(){ initEventCats(); renderPanelEvents(); renderPanelResources(); renderBookmarks(); },
  directory(){ renderDiscPeople(); renderDiscUpdates(); renderMetroResults(); },
  me(){ const pp=document.getElementById('panel-profile'); if(pp) pp.classList.add('active');
    renderActivity(); renderProfileView(true); }
};
window.App={
  boot(page){
    window.APP_PAGE=page;
    document.addEventListener('DOMContentLoaded', ()=>{
      restoreSession();
      if(!userState.signedIn){ location.replace(appRel()+'index.html'); return; }   // auth guard
      injectCeremonies();
      LabsChrome.mountAppNav({rel:appRel(), active:page, role:getViewAsRole()});
      const ha=document.getElementById('header-avatar'); if(ha) ha.textContent=userState.initials;
      const ps=document.getElementById('profile-slot'); if(ps) ps.outerHTML=PROFILE_PANEL_HTML;
      const fs=document.getElementById('foot-slot'); if(fs) fs.outerHTML=LabsChrome.footerHTML(appRel());
      applyCycleState();                        // phase + the weekly gate (redirects off-home when armed)
      if(logGateActive() && page!=='home'){ location.replace(appRel()+'dashboard/index.html'); return; }
      (PAGE_RENDER[page]||function(){})();
      enhanceTappables();
      // Page params (the production route's own searchParams):
      const qs=new URLSearchParams(location.search);
      if(page==='cycle' && qs.get('register')==='1'){ history.replaceState(null,'',location.pathname); startCycleRegistration(()=>showView('cycles')); }
      if(page==='directory' && qs.get('u')){ showMemberProfile(qs.get('u')); }
    });
  }
};

/* ── The profile panel — one markup source, mounted into #profile-slot by me/
   (owner mode) and directory/ (visitor mode via ?u=). Production: the /me route
   component, reused by /u/[handle] in read-only mode. */
const PROFILE_PANEL_HTML = `
      <div id="panel-profile" class="panel">
      <div id="prof-preview-bar" style="display:none;"></div>
      <div class="container" style="padding-top:32px;padding-bottom:48px;max-width:920px;">
        <div class="prof-head" style="margin-bottom:18px;align-items:flex-start;">
          <div class="avatar-lg" id="prof-avatar">AR</div>
          <div style="flex:1;min-width:0;">
            <h1 class="t-h1" id="prof-name" style="margin-bottom:4px;">Alex Rivera</h1>
            <p class="t-body" id="prof-headline" style="color:var(--teal-deep);font-weight:600;margin-bottom:6px;"></p>
            <p class="t-body" id="prof-meta" style="margin-bottom:12px;">Washington, DC · Joined Spring 2026</p>
            <p id="prof-public-link" style="margin-bottom:12px;"><a class="see" href="people/alex-rivera/">Your public page ↗</a> <span class="t-small" style="color:var(--meta);">— public portfolios are opt-in; you control what shows</span></p>
            <!-- Immutable trust badges — set by the org / clients, never self-attested.
                 Rendered by renderBadges(): locked until earned, so verification means something. -->
            <div id="prof-badges" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;"></div>
            <div id="prof-roles" class="tag-wrap"></div>
          </div>
          <div id="prof-actions" style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;flex-shrink:0;"></div>
        </div>
        <p class="t-lede" id="prof-bio" style="max-width:60ch;margin-bottom:36px;">Product-minded generalist learning by shipping. Currently in the Civic AI Build Cycle, focused on benefits navigation for DC residents.</p>

        <div id="prof-cred" style="margin-bottom:44px;"></div>

        <div class="section-head" style="padding-bottom:12px;"><div><div class="lbl lbl-teal" style="margin-bottom:6px;">Portfolio</div><h2 class="t-h3">Evidence, shipped in the open</h2></div></div>
        <div id="prof-featured" style="margin-bottom:24px;"></div>
        <!-- Published case-study edits require peer sign-off before going live. -->
        <div id="prof-case-edit" style="margin-bottom:24px;">
          <div id="prof-pending-banner" style="display:none;background:var(--tint);border:1px solid var(--rule);border-radius:var(--r);padding:12px 16px;margin-bottom:12px;"><span class="t-small" style="color:var(--teal-deep);font-weight:600;">Changes pending. Requires +2 peer approvals to publish live.</span></div>
          <button class="btn btn-ghost-teal btn-sm" onclick="document.getElementById('prof-pending-banner').style.display='block'">Edit case study</button>
        </div>
        <div class="cards" id="prof-projects" style="margin-bottom:48px;"></div>

        <div class="section-head" style="padding-bottom:12px;"><div><div class="lbl lbl-teal" style="margin-bottom:6px;">Activity</div><h2 class="t-h3">Showing up, week over week</h2></div></div>
        <div id="prof-updates" style="margin-bottom:20px;"></div>
        <div class="lcard" style="padding:24px;margin-bottom:44px;">
          <div class="act-grid" id="act-grid" style="margin-bottom:16px;"></div>
          <div id="act-legend" style="display:flex;flex-wrap:wrap;gap:8px 18px;margin-bottom:12px;"></div>
          <p class="t-small">Contributions across every active role — building, mentoring, and volunteering — over the last few months.</p>
        </div>

        <div id="prof-bookmarks" style="margin-bottom:44px;"></div>

        <div class="section-head" style="padding-bottom:12px;"><div><div class="lbl lbl-teal" style="margin-bottom:6px;">Skills & detail</div><h2 class="t-h3">What I bring</h2></div></div>
        <div id="prof-skills" style="margin-bottom:24px;"></div>
        <div id="prof-roledetail" style="margin-bottom:36px;"></div>

        <!-- Leadership grows from within: any member can raise their hand from here. -->
        <div id="prof-mentor-cta" class="lcard" style="padding:20px 24px;margin-bottom:36px;">
          <div class="lbl lbl-teal" style="margin-bottom:6px;">Grow into leadership</div>
          <div class="t-h4" style="margin-bottom:4px;">Have experience to offer?</div>
          <p class="t-small" style="margin-bottom:14px;">Mentors, facilitators, and workshop instructors grow from within the community. Set up a mentor profile whenever you're ready.</p>
          <button class="btn btn-ghost-teal btn-sm" onclick="startRoleFlow('mentor', ()=>showProfile())">I have experience to offer</button>
        </div>
        <div id="prof-signout-wrap"><button class="btn-link" style="color:var(--meta);padding:0;" onclick="logout()">Sign out</button></div>
      </div>
      </div>
`;
