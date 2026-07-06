/* ── chrome.js — the single source for The Labs' two nav bars, the footer, and the
   auth-aware session chrome. Consumed BOTH ways so the markup can never drift:
   - build time: tools/generate.js require()s it and bakes publicNavHTML/footerHTML
     into every generated page (production: the nav is a server component — this
     module is its prototype twin);
   - runtime: hand-written pages (index.html, stories.html, the app pages,
     moderator.html, admin.html) load it and call LabsChrome.mountPublicNav() /
     LabsChrome.mountAppNav() — the same strings, injected (the search.js pattern).
   Zero dependencies; markup only — every style lives in system.css.

   The two bars (owner decisions, session log):
   - PUBLIC (.sitenav): logo · search field · The Work ▾ (Projects·Pods·People) ·
     Events · Library · Cities · quiet Log in · red Join. Identical on the landing,
     every generated page, and stories.html. About/Donate live in the footer.
   - APP (.appnav): logo · search field · Home · My Cycle · Learning · Directory ·
     the avatar ("Me" is the avatar, not a link — its menu opens with a Profile
     button). Personas (moderator/admin) swap the destinations for the persona
     pill + "Exit to member view". */
(function(root, factory){
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.LabsChrome = factory();
})(typeof self !== 'undefined' ? self : this, function(){
'use strict';

var SEARCH_SVG='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>';
var HAM_SVG='<svg class="ham-icon" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="5" width="18" height="2" rx="1" fill="currentColor"/><rect x="2" y="10" width="18" height="2" rx="1" fill="currentColor"/><rect x="2" y="15" width="18" height="2" rx="1" fill="currentColor"/></svg><svg class="close-icon" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5L17 17M17 5L5 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
var TAB_SVGS={
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
  cycle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>',
  learning:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  directory:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
};

/* The app destinations — labels + slugs are owner decisions (one place to change). */
var APP_DESTS=[
  {key:'home',      label:'Home',      href:'dashboard/index.html'},
  {key:'cycle',     label:'My Cycle',  href:'my-cycle/index.html'},
  {key:'learning',  label:'Learning',  href:'learning/index.html'},
  {key:'directory', label:'Directory', href:'directory/index.html'}
];

function actCls(active,k){ return active===k?' active':''; }
function brand(rel, href){
  return '<a class="sitenav-brand" href="'+(href||rel+'index.html')+'"><img src="'+rel+'assets/logo-lockup-light.png" alt="The Upskilling Labs"></a>';
}
function searchField(){
  return '<button class="nav-search" type="button" onclick="openSearch(event)" title="Search ( / )" aria-label="Search The Labs">'+SEARCH_SVG+'<span>Search The Labs</span></button>'
    +'<button class="icon-btn search-btn nav-search-icon" aria-label="Search" title="Search ( / )" onclick="openSearch(event)">'+SEARCH_SVG+'</button>';
}

function publicNavHTML(rel, active){
  return '<header class="sitenav" id="site-nav"><div class="sitenav-inner">'
    +brand(rel)
    +searchField()
    +'<nav class="nav-links sitenav-links">'
      +'<span class="workmenu"><button class="nav-link workmenu-btn'+actCls(active,'work')+'" id="workmenu-btn" type="button" aria-haspopup="true" aria-expanded="false">The Work <span class="wm-caret" aria-hidden="true">▾</span></button>'
      +'<span class="workmenu-list" id="workmenu-list" role="menu" aria-label="The Work">'
        +'<a role="menuitem" href="'+rel+'projects/index.html">Projects</a>'
        +'<a role="menuitem" href="'+rel+'pods/index.html">Pods</a>'
        +'<a role="menuitem" href="'+rel+'people/index.html">People</a>'
      +'</span></span>'
      +'<a class="nav-link'+actCls(active,'events')+'" href="'+rel+'events/index.html">Events</a>'
      +'<a class="nav-link'+actCls(active,'library')+'" href="'+rel+'library/index.html">Library</a>'
      +'<a class="nav-link'+actCls(active,'labs')+'" href="'+rel+'labs/index.html">Cities</a>'
    +'</nav>'
    +'<span class="sitenav-auth" id="pn-out"><a class="nav-link pn-login" href="'+rel+'index.html?login=1">Log in</a><a class="sitenav-cta pn-join" href="'+rel+'index.html?signup=1">Join</a></span>'
    +'<span class="sitenav-auth" id="pn-in"><a class="nav-link pn-home" href="'+rel+'dashboard/index.html">Home</a><a class="pg-avatar pn-avatar" id="pn-avatar" href="'+rel+'me/index.html" aria-label="Your profile">U</a></span>'
    +'<button class="ham-btn" id="ham-btn" type="button" aria-label="Open menu" aria-expanded="false">'+HAM_SVG+'</button>'
    +'</div>'
    +'<nav class="ham-menu" id="ham-menu">'
      +'<a class="nav-link hm-in pn-home" href="'+rel+'dashboard/index.html">Home</a>'
      +'<a class="nav-link hm-in" href="'+rel+'me/index.html">Your profile</a>'
      +'<a class="nav-link" href="'+rel+'projects/index.html">Projects</a>'
      +'<a class="nav-link" href="'+rel+'pods/index.html">Pods</a>'
      +'<a class="nav-link" href="'+rel+'people/index.html">People</a>'
      +'<a class="nav-link" href="'+rel+'events/index.html">Events</a>'
      +'<a class="nav-link" href="'+rel+'library/index.html">Library</a>'
      +'<a class="nav-link" href="'+rel+'labs/index.html">Cities</a>'
      +'<a class="nav-link" href="'+rel+'about/index.html">About</a>'
      +'<a class="nav-link hm-out pn-login" href="'+rel+'index.html?login=1">Log in</a>'
      +'<a class="nav-link hm-out" href="https://www.every.org/theupskillinglabs" target="_blank" rel="noopener">Donate</a>'
    +'</nav>'
    +'</header>';
}

function avatarMenuHTML(rel, role){
  role=role||'upskiller';
  var radio=function(r,label){
    return '<button class="menu-item" role="menuitemradio" aria-checked="'+(role===r)+'" onclick="viewAs(\''+r+'\')"><span class="dot'+(role===r?' on':'')+'"></span>'+label+'</button>';
  };
  return '<div id="avatar-menu" role="menu" aria-label="Account menu" style="display:none;">'
    +'<a class="menu-item menu-profile-btn" role="menuitem" href="'+rel+'me/index.html">Profile</a>'
    +'<div class="menu-rule"></div>'
    +'<div class="lbl" style="padding:8px 12px 4px;">View as</div>'
    +radio('upskiller','Upskiller')
    +radio('poderator','Poderator')
    +radio('admin','Admin')
    +'<div class="menu-rule"></div>'
    +'<button class="menu-item" role="menuitem" onclick="closeAvatarMenu();openFeedback()">Send feedback</button>'
    +'<button class="menu-item" role="menuitem" onclick="closeAvatarMenu();setViewAsRole(\'upskiller\');LabsChrome.signOut()">Sign out</button>'
    +'</div>';
}

function appNavHTML(rel, active, opts){
  opts=opts||{};
  var persona=opts.persona||null; // 'poderator' | 'admin'
  var mid;
  if(persona){
    mid='<span class="persona-lbl">'+(persona==='admin'?'Admin':'Poderator')+'</span>'
      +'<a class="nav-link exit-member" id="exit-member" href="'+rel+'index.html">Exit to member view</a>';
  } else {
    mid='<nav class="nav-links appnav-links">'
      +APP_DESTS.map(function(d){ return '<a class="nav-link'+actCls(active,d.key)+'" id="nav-'+d.key+'" href="'+rel+d.href+'">'+d.label+'</a>'; }).join('')
      +'</nav>';
  }
  return '<header class="sitenav appnav" id="site-nav"><div class="sitenav-inner">'
    +brand(rel, persona?rel+'index.html':rel+'dashboard/index.html')
    +(persona?'':searchField())
    +mid
    +'<span class="avatar-wrap">'
      +'<div class="avatar appbar-avatar" id="header-avatar" onclick="toggleAvatarMenu(event)" title="Account menu" role="button" tabindex="0" aria-haspopup="menu" aria-expanded="false" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();toggleAvatarMenu(event)}">U</div>'
      +avatarMenuHTML(rel, opts.role||persona||'upskiller')
    +'</span>'
    +'</div></header>';
}

function appTabbarHTML(rel, active){
  return '<nav class="tabbar">'
    +APP_DESTS.map(function(d){
      var label=d.key==='cycle'?'Cycle':d.label; // tab labels stay one word
      return '<a class="tab'+actCls(active,d.key)+'" id="tab-'+d.key+'" href="'+rel+d.href+'">'+TAB_SVGS[d.key]+'<span>'+label+'</span></a>';
    }).join('')
    +'<a class="tab'+actCls(active,'me')+'" id="tab-me" href="'+rel+'me/index.html"><span class="tab-avatar pn-avatar">U</span><span>Me</span></a>'
    +'</nav>';
}

function footerHTML(rel){
  return '<footer class="pgfoot grain"><div class="pgfoot-inner"><span>The Upskilling Labs · run in the open — MIT code · CC BY 4.0 content</span>'
    +'<span><a href="'+rel+'about/index.html">About</a> · <a href="'+rel+'cycles/index.html">Build Cycles</a> · <a href="'+rel+'events/index.html">Events</a> · <a href="'+rel+'library/index.html">Library</a> · <a href="'+rel+'labs/index.html">Cities</a> · <a href="'+rel+'projects/index.html">Projects</a> · <a href="'+rel+'pods/index.html">Pods</a> · <a href="'+rel+'people/index.html">People</a> · <a href="'+rel+'stories.html">Stories</a> · <a href="https://www.every.org/theupskillinglabs" target="_blank" rel="noopener">Donate</a></span></div></footer>';
}

/* ── Browser-only below (each guards on document) ─────────────────────────── */

/* Reads olos.session.v1 (the demo session flag, written by index.html/app.js —
   never real auth) and flips the auth-aware chrome: body.labs-in drives the
   #pn-out/#pn-in and .hm-out/.hm-in swaps in system.css; avatars get initials;
   the signed-out upsell band hides. */
function sessionChrome(){
  if(typeof document==='undefined') return null;
  var s=null; try{ s=JSON.parse(localStorage.getItem('olos.session.v1')||'null'); }catch(e){}
  var on=!!(s&&s.signedIn);
  document.body.classList.toggle('labs-in', on);
  if(on){ var init=s.initials||'U'; document.querySelectorAll('.pn-avatar').forEach(function(a){ a.textContent=init; }); }
  var u=document.getElementById('pg-upsell');
  if(u){ u.style.display=on?'none':'flex'; document.body.classList.toggle('has-upsell', !on); }
  window.LABS_SESSION=s;
  return s;
}

/* Sign out from any chrome: prefer the page's real logout() (index/app pages —
   clears both keys and re-renders); fall back to clearing the keys directly
   (persona pages) and returning to the landing. */
function signOut(){
  if(typeof window!=='undefined' && typeof window.logout==='function'){ window.logout(); return; }
  try{ localStorage.removeItem('olos.session.v1'); localStorage.removeItem('olos.userState.v1'); }catch(e){}
  location.href=(window.LABS_REL||'')+'index.html';
}

/* Wires the injected/baked chrome: hamburger, The Work ▾ (click-open, Esc closes
   and refocuses the trigger, ArrowUp/Down cycle, outside-click closes — the same
   contract as shared.js's avatar menu). Idempotent per page. */
function wireNav(){
  if(typeof document==='undefined') return;
  var hb=document.getElementById('ham-btn'), hm=document.getElementById('ham-menu');
  if(hb&&hm&&!hb.dataset.wired){ hb.dataset.wired='1';
    hb.addEventListener('click',function(){ var open=hm.classList.toggle('open'); hb.classList.toggle('open',open); hb.setAttribute('aria-expanded',open); });
    hm.addEventListener('click',function(e){ if(e.target.closest('a')){ hm.classList.remove('open'); hb.classList.remove('open'); hb.setAttribute('aria-expanded','false'); } });
  }
  var wb=document.getElementById('workmenu-btn'), wl=document.getElementById('workmenu-list');
  if(wb&&wl&&!wb.dataset.wired){ wb.dataset.wired='1';
    var close=function(){ wl.classList.remove('open'); wb.setAttribute('aria-expanded','false'); };
    wb.addEventListener('click',function(e){ e.stopPropagation(); var open=wl.classList.toggle('open'); wb.setAttribute('aria-expanded',open); if(open){ var f=wl.querySelector('a'); if(f) f.focus(); } });
    document.addEventListener('click',function(e){ if(!e.target.closest('.workmenu')) close(); });
    document.addEventListener('keydown',function(e){
      if(!wl.classList.contains('open')) return;
      if(e.key==='Escape'){ close(); wb.focus(); }
      else if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault();
        var items=Array.prototype.slice.call(wl.querySelectorAll('a'));
        var i=items.indexOf(document.activeElement);
        items[(e.key==='ArrowDown'?(i+1):(i-1+items.length))%items.length].focus();
      }
    });
  }
}

/* Overridable auth entries: index.html mounts with onLogin/onJoin so the nav's
   Log in / Join call its funnel functions directly instead of reloading with
   ?login=1 / ?signup=1 (which is what every OTHER page's nav does). */
function overrideAuth(opts){
  if(opts.onLogin) document.querySelectorAll('.pn-login').forEach(function(a){ a.addEventListener('click',function(ev){ ev.preventDefault(); opts.onLogin(); }); });
  if(opts.onJoin) document.querySelectorAll('.pn-join').forEach(function(a){ a.addEventListener('click',function(ev){ ev.preventDefault(); opts.onJoin(); }); });
  if(opts.onHome) document.querySelectorAll('.pn-home').forEach(function(a){ a.addEventListener('click',function(ev){ ev.preventDefault(); opts.onHome(); }); });
}

/* opts: {rel, active, into, overHero, onLogin, onJoin, onHome} */
function mountPublicNav(opts){
  opts=opts||{}; var rel=opts.rel||'';
  window.LABS_REL=rel;
  var html=publicNavHTML(rel, opts.active||null);
  if(opts.into){ var host=document.querySelector(opts.into); host.innerHTML=html; }
  else document.body.insertAdjacentHTML('afterbegin', html);
  var nav=document.getElementById('site-nav');
  if(opts.overHero) nav.classList.add('overhero');
  overrideAuth(opts);
  wireNav(); sessionChrome();
  return nav;
}

/* opts: {rel, active, persona, role, into, tabbar:true|false} */
function mountAppNav(opts){
  opts=opts||{}; var rel=opts.rel||'';
  window.LABS_REL=rel;
  var html=appNavHTML(rel, opts.active||null, opts);
  if(opts.into){ document.querySelector(opts.into).outerHTML=html; } // replace the slot — a wrapper would break position:sticky
  else document.body.insertAdjacentHTML('afterbegin', html);
  if(opts.tabbar!==false && !opts.persona) document.body.insertAdjacentHTML('beforeend', appTabbarHTML(rel, opts.active||null));
  wireNav();
  var s=sessionChrome();
  var ha=document.getElementById('header-avatar'); if(ha&&s&&s.initials) ha.textContent=s.initials;
  return document.getElementById('site-nav');
}

return { publicNavHTML:publicNavHTML, appNavHTML:appNavHTML, appTabbarHTML:appTabbarHTML,
  avatarMenuHTML:avatarMenuHTML, footerHTML:footerHTML, sessionChrome:sessionChrome,
  wireNav:wireNav, signOut:signOut, mountPublicNav:mountPublicNav, mountAppNav:mountAppNav,
  APP_DESTS:APP_DESTS };
});
