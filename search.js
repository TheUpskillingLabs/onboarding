/* ── The Labs global search — a self-contained widget shared by index.html and
   every generated events/ library/ labs/ page.
   Searches whatever content globals the host page loaded: EVENTS, RESOURCES,
   METROS (all pages), plus MEMBERS when the page is index.html AND the demo
   user is signed in (member directory is members-only — owner decision).
   Results are real links into the generated pages; set window.SEARCH_REL to the
   page's relative root ('' at root, '../../' on entity pages) BEFORE this script.
   Deliberately quiet for now (an icon, not a centered pill — owner decision):
   the catalog is small; search graduates to the bar's centerpiece when content
   volume creates a real findability problem. */
(function(){
'use strict';
const REL = (typeof window.SEARCH_REL==='string') ? window.SEARCH_REL : '';
const eschtml = s => String(s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* Overlay markup + styles injected once — single source, no per-page drift. */
document.body.insertAdjacentHTML('beforeend',
  '<style>'
  +'.search-overlay{display:none;position:fixed;inset:0;z-index:240;background:rgba(0,20,27,.58);backdrop-filter:blur(4px);padding:min(12vh,96px) var(--pad,20px) 24px;justify-content:center;align-items:flex-start;}'
  +'.search-overlay.open{display:flex;}'
  +'.search-panel{width:100%;max-width:560px;background:var(--paper);border-radius:var(--r);box-shadow:var(--shadow-lg);overflow:hidden;display:flex;flex-direction:column;max-height:min(70vh,640px);}'
  +'.search-panel .sp-bar{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid var(--rule);}'
  +'.search-panel .sp-bar svg{width:18px;height:18px;stroke:var(--meta);flex-shrink:0;}'
  +'.search-panel input{flex:1;border:none;background:none;font:inherit;font-size:16px;color:var(--ink);outline:none;}'
  +'.search-results{overflow-y:auto;padding:8px;}'
  +'.search-group{padding:10px 12px 4px;font-weight:500;font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:var(--teal-deep);}'
  +'.search-hit{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:var(--r);color:inherit;text-decoration:none;cursor:pointer;}'
  +'.search-hit:hover,.search-hit:focus-visible{background:rgba(0,148,160,.10);outline:none;}'
  +'.search-hit .sh-main{flex:1;min-width:0;}'
  +'.search-hit .sh-title{font-weight:600;font-size:15px;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
  +'.search-hit .sh-meta{font-size:12px;line-height:16px;color:var(--meta);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
  +'.search-empty{padding:28px 16px;text-align:center;color:var(--meta);font-size:14px;line-height:22px;}'
  +'.search-empty a{color:var(--teal-deep);font-weight:600;text-decoration:none;}'
  +'</style>'
  +'<div class="search-overlay" id="search-overlay" role="dialog" aria-label="Search The Labs" onclick="if(event.target===this)closeSearch()">'
  +'<div class="search-panel">'
  +'<div class="sp-bar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>'
  +'<input id="search-input" type="search" placeholder="Search events, library, cities…" aria-label="Search" autocomplete="off">'
  +'</div><div class="search-results" id="search-results"></div>'
  +'</div></div>');

function catalog(){
  const items=[];
  if(typeof EVENTS!=='undefined') EVENTS.forEach(e=>items.push({type:'Events', title:e.name, meta:(e.kind||(e.location_type==='virtual'?'Virtual':'In person'))+' · '+fmtDate(e.start_at)+' · '+e.location_name, href:REL+'events/'+e.slug+'/', text:(e.name+' '+(e.desc||'')+' '+(e.kind||'')+' '+e.location_name).toLowerCase()}));
  if(typeof RESOURCES!=='undefined') RESOURCES.filter(r=>r.status==='published').forEach(r=>items.push({type:'Library', title:r.title, meta:(r.meta||'')+(r.from?' · From the commons':''), href:REL+'library/'+r.slug+'/', text:(r.title+' '+(r.summary||'')+' '+(r.tags||[]).join(' ')+' '+(r.content_type||'')).toLowerCase()}));
  if(typeof METROS!=='undefined') Object.values(METROS).forEach(m=>items.push({type:'Cities', title:m.name+(m.st&&m.slug!=='dc'?', '+m.st:''), meta:m.status==='active'?'Active lab · '+m.members+' members':'Waitlist open · '+m.waiting+' waiting', href:m.founded?null:REL+'labs/'+m.slug+'/', slug:m.slug, founded:!!m.founded, text:(m.name+' '+(m.st||'')+' '+(m.partner||'')).toLowerCase()}));
  // The Work layer — public pages, searchable everywhere.
  if(typeof PROJECTS_PUBLIC!=='undefined') PROJECTS_PUBLIC.filter(pr=>pr.approved).forEach(pr=>items.push({type:'Projects', title:pr.title, meta:pr.cycle+' · shipped', href:REL+'projects/'+pr.slug+'/', text:(pr.title+' '+(pr.summary||'')+' '+(pr.frame||'')).toLowerCase()}));
  if(typeof PODS!=='undefined') PODS.forEach(pd=>items.push({type:'Pods', title:pd.name, meta:pd.cycle+' · '+(pd.status==='shipped'?'shipped':pd.status), href:REL+'pods/'+pd.slug+'/', text:(pd.name+' '+pd.focus).toLowerCase()}));
  const publicHandles=new Set(typeof PEOPLE!=='undefined'?PEOPLE.map(m=>m.handle):[]);
  if(typeof PEOPLE!=='undefined') PEOPLE.forEach(m=>items.push({type:'People', title:m.name, meta:m.headline+' · '+m.city+' · public page', href:REL+'people/'+m.handle+'/', text:(m.name+' '+m.headline+' '+(m.expertise||[]).join(' ')+' '+m.city).toLowerCase()}));
  // Members-only directory entries (no public page): only inside index.html for the signed-in demo user.
  if(typeof MEMBERS!=='undefined' && typeof userState!=='undefined' && userState.signedIn)
    MEMBERS.filter(m=>!m.handle||!publicHandles.has(m.handle)).forEach(m=>items.push({type:'People', title:m.name, meta:m.headline+' · '+m.metro+' · members-only', member:m.id, text:(m.name+' '+m.headline+' '+(m.expertise||[]).join(' ')+' '+m.metro).toLowerCase()}));
  return items;
}
function fmtDate(iso){ const d=new Date(iso); const MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; let h=d.getHours(); const ap=h>=12?'PM':'AM'; h=h%12||12; return MO[d.getMonth()]+' '+d.getDate()+' · '+h+' '+ap; }
function score(item,q){
  const t=item.title.toLowerCase();
  if(t.startsWith(q)) return 0;
  if(t.includes(q)) return 1;
  if(item.text.includes(q)) return 2;
  return -1;
}
function searchAll(q){
  q=q.trim().toLowerCase(); if(q.length<2) return [];
  return catalog().map(it=>({it, s:score(it,q)})).filter(x=>x.s>=0)
    .sort((a,b)=>a.s-b.s).slice(0,10).map(x=>x.it);
}
function hitHTML(it){
  const inner='<span class="sh-main"><span class="sh-title">'+eschtml(it.title)+'</span><span class="sh-meta" style="display:block;">'+eschtml(it.meta)+'</span></span>';
  if(it.member) return '<div class="search-hit" tabindex="0" role="link" data-member="'+it.member+'">'+inner+'</div>';
  if(it.founded||!it.href) return '<div class="search-hit" tabindex="0" role="link" data-metro="'+it.slug+'">'+inner+'</div>'; // runtime metro: no page yet — open the join modal
  return '<a class="search-hit" href="'+it.href+'">'+inner+'</a>';
}
function renderSearch(){
  const box=document.getElementById('search-results');
  const q=document.getElementById('search-input').value;
  if(q.trim().length<2){ box.innerHTML='<div class="search-empty">Type to search events, the library, and cities'+(typeof MEMBERS!=='undefined'&&typeof userState!=='undefined'&&userState.signedIn?' — and people':'')+'.</div>'; return; }
  const hits=searchAll(q);
  if(!hits.length){ box.innerHTML='<div class="search-empty">Nothing for “'+eschtml(q.trim())+'” yet.<br>Browse <a href="'+REL+'events/index.html">events</a>, the <a href="'+REL+'library/index.html">library</a>, or <a href="'+REL+'labs/index.html">cities</a>.</div>'; return; }
  let html='', last='';
  hits.forEach(it=>{ if(it.type!==last){ html+='<div class="search-group">'+it.type+'</div>'; last=it.type; } html+=hitHTML(it); });
  box.innerHTML=html;
}
window.openSearch=function(e){ if(e&&e.stopPropagation) e.stopPropagation();
  const o=document.getElementById('search-overlay'); o.classList.add('open');
  const inp=document.getElementById('search-input'); renderSearch(); inp.focus(); inp.select();
};
window.closeSearch=function(){ document.getElementById('search-overlay').classList.remove('open'); };
document.getElementById('search-input').addEventListener('input', renderSearch);
document.getElementById('search-input').addEventListener('keydown', e=>{
  if(e.key==='Enter'){ const first=document.querySelector('#search-results .search-hit'); if(first) first.click(); }
});
document.getElementById('search-results').addEventListener('click', e=>{
  const hit=e.target.closest('.search-hit'); if(!hit) return;
  if(hit.dataset.member && typeof showMemberProfile==='function'){ closeSearch(); showMemberProfile(hit.dataset.member); }
  else if(hit.dataset.metro && typeof openWaitlistJoin==='function'){ closeSearch(); openWaitlistJoin(hit.dataset.metro); }
});
document.getElementById('search-results').addEventListener('keydown', e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('search-hit')&&e.target.tagName!=='A'){ e.preventDefault(); e.target.click(); }
});
document.addEventListener('keydown', e=>{
  if(e.key==='Escape') closeSearch();
  if(e.key==='/' && !e.target.closest('input,textarea,[contenteditable]')){ e.preventDefault(); openSearch(); } // GitHub-style shortcut
});
})();
