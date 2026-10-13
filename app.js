/* App shell, router and event handling */
const ROUTES = { space: spaceView, dewasub: dewaSubView, dashboard, library, search: searchView, compare: compareView, subjects: subjectsView, saved: savedView, projects: projectsView, tools: toolsView, settings: settingsView, admin: adminView, ai: aiView, comments: commentsView, versions: versionsView };
let zoom = 1;

function parseHash() {
  const h = location.hash.replace(/^#\/?/, ''), [r, qs = ''] = h.split('?'), p = {};
  new URLSearchParams(qs).forEach((v, k) => p[k] = v);
  return { r: r.split('/')[0], p };
}
const go = h => { location.hash = h; };
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}
function openModal(html, cls = '') { $('#modal').innerHTML = `<div class="overlay" data-a="close-bg"><div class="modal ${cls}" role="dialog" aria-modal="true"><button class="icon-btn close" data-a="close" aria-label="Close">${ic('x')}</button>${html}</div></div>`; document.body.classList.add('noscroll'); zoom = 1; }
function closeModal() { $('#modal').innerHTML = ''; document.body.classList.remove('noscroll'); }

function shell(route, body) {
  return `<div class="demo-bar">Indexed from the supplied documents: DEWA 2017 · SEWA 2020 · ADDC Distribution Code · UAE Fire Code ch. 5–7. Clauses were transcribed from the PDFs – verify against the original before use.</div>
  <header class="top"><a class="logo" href="#/dashboard">${logoMark()}<span class="lg-t">ElectroCode Hub<small>Technical First</small></span></a>
  <nav class="nav" id="nav">${NAV.map(([k, l, i]) => `<a href="#/${k}" class="${route === k ? 'on' : ''}">${l}</a>`).join('')}</nav>
  <div class="top-r"><a class="icon-btn" href="#/search" aria-label="Search">${ic('search')}</a><a class="btn sm ai-btn hide-sm" href="#/ai">${ic('bot', 14)} ElectroCode AI</a><button class="icon-btn" data-a="pop" data-v="bell" aria-label="Notifications">${ic('bell')}<i class="ping"></i></button><button class="avatar" data-a="pop" data-v="user" aria-label="User menu">${esc((S.user?.name || 'U')[0])}</button><button class="icon-btn burger" data-a="burger" aria-label="Menu">${ic('menu')}</button></div><div id="pop"></div></header>
  <main class="main" id="view">${body}</main>
  <footer class="foot"><p>${DISCLAIMER}</p><p class="credit"><b>ElectroCode Hub</b> · Technical First · Created by <b>Y.SH</b></p></footer>`;
}

function render() {
  const { r, p } = parseHash(), app = $('#app');
  if (!r) { app.innerHTML = landing(); return; }
  if (!S.user) { app.innerHTML = landing(); openLogin(r); return; }
  if (r === 'projects') { go('#/saved'); return; }
  const route = ROUTES[r] ? r : 'dashboard';
  if (route === 'search' && p.q && S.recents[0] !== p.q) { S.recents = [p.q, ...S.recents.filter(x => x !== p.q)].slice(0, 8); persist(); }
  app.innerHTML = shell(route, ROUTES[route](p));
  window.scrollTo(0, 0);
  if (route === 'tools') { const box = $('#toolBox'); toolRun(TOOLS.find(t => t.id === box.dataset.tool), box); }
  if (route === 'ai') { if (p.q) { history.replaceState(null, '', '#/ai'); aiSubmit(p.q); } const l = $('#chatLog'); if (l) l.lastElementChild?.scrollIntoView({ block: 'end' }); }
}

function openLogin(target) {
  openModal(`<div class="pad login"><div class="center">${logoMark()}</div><h3 class="center">Sign in to ElectroCode Hub</h3><p class="muted sm center">Prototype sign-in – no password is collected. Production uses SSO / OAuth and JWT sessions (see ARCHITECTURE.md).</p>
  <form data-form="login" data-target="${esc(target || 'dashboard')}"><label>Name<input name="n" value="Youssef Shaban" required></label><label>Email<input name="e" type="email" value="youssefshaban2882@gmail.com" required></label><label>Role<select name="r"><option>Admin</option><option>Engineer</option></select></label><button class="btn primary w" type="submit">Continue</button></form></div>`, 'sm');
}

function showPop(kind) {
  const el = $('#pop'); if (!el) return;
  if (el.dataset.k === kind && el.innerHTML) { el.innerHTML = ''; el.dataset.k = ''; return; }
  el.dataset.k = kind;
  el.innerHTML = kind === 'bell'
    ? `<div class="popbox"><h4>Notifications</h4><a href="#/library"><b>Library updated</b><span>UAE Fire Code ch. 5–7, DEWA 2017, SEWA 2020 and ADDC indexed</span></a><a href="#/admin?t=review"><b>${S.review.filter(r => r.st === 'pending').length} items in review queue</b><span>OCR and clause checks pending</span></a><a href="#/comments"><b>Authority Comment Analyzer</b><span>Paste a consultant comment to find the applicable clause</span></a></div>`
    : `<div class="popbox"><h4>${esc(S.user.name)}</h4><span class="muted sm">${esc(S.user.email)} · ${S.role}</span><a href="#/settings">Settings</a>${S.role === 'Admin' ? '<a href="#/admin">Admin panel</a>' : ''}<button class="link" data-a="logout">Sign out</button></div>`;
}

/* ---- delegated clicks ---- */
document.addEventListener('click', e => {
  const pop = $('#pop'); if (pop && pop.innerHTML && !e.target.closest('#pop') && !e.target.closest('[data-a="pop"]')) { pop.innerHTML = ''; pop.dataset.k = ''; }
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a, id = el.dataset.id, v = el.dataset.v, c = id && clauseById(id);
  switch (a) {
    case 'close': closeModal(); break;
    case 'close-bg': if (e.target === el) closeModal(); break;
    case 'pop': showPop(v); break;
    case 'burger': $('#nav').classList.toggle('open'); break;
    case 'q': go('#/search?q=' + encodeURIComponent(v)); break;
    case 'flt': { const g = S.filters[el.dataset.g], i = g.indexOf(v); i > -1 ? g.splice(i, 1) : g.push(v); persist(); render(); break; }
    case 'flt-clear': S.filters = { auth: [], disc: [], subj: [] }; persist(); render(); break;
    case 'toggle-filters': $('#filtWrap').classList.toggle('open'); break;
    case 'src': openModal(sourceModal(id), 'wide'); break;
    case 'open-page': openModal(pageModal(c), 'wide'); break;
    case 'copy': navigator.clipboard?.writeText(`${c.x}\n— ${trace(c).join(' → ')}`).then(() => toast('Requirement copied with source citation'), () => toast('Copy blocked by browser')); break;
    case 'share': navigator.clipboard?.writeText(location.href.split('#')[0] + '#/search?q=' + encodeURIComponent(c.t)).then(() => toast('Link copied'), () => toast('Copy blocked by browser')); break;
    case 'save': openModal(saveModal(id, el.dataset.mode), 'sm'); break;
    case 'save-do': {
      const ent = { cid: id, project: $('#svP').value, section: $('#svS').value, folder: $('#svF').value, t: Date.now() };
      S.saved = [ent, ...S.saved.filter(s => s.cid !== id)]; persist(); closeModal(); toast('Saved to ' + S.projects.find(p => p.id === ent.project).name + ' › ' + ent.section); render(); break;
    }
    case 'unsave': S.saved = S.saved.filter(s => s.cid !== id); persist(); render(); break;
    case 'cmp': go('#/compare?subject=' + compareFor(c)); closeModal(); break;
    case 'dl-img': { const dl = u => { const l = document.createElement('a'); l.href = u; l.download = c.id + '-page.jpg'; document.body.appendChild(l); l.click(); l.remove(); }; fetch(c.img).then(r => r.blob()).then(b => { const u = URL.createObjectURL(b); dl(u); setTimeout(() => URL.revokeObjectURL(u), 4000); toast('Download started – if nothing happens, right-click the image and choose Save image as…'); }).catch(() => { dl(c.img); toast('Right-click the image and choose Save image as…'); }); break; }
    case 'copy-img': { fetch(c.img).then(r => r.blob()).then(b => navigator.clipboard.write([new ClipboardItem({ [b.type || 'image/jpeg']: b })])).then(() => toast('Page image copied – paste it into Word, Outlook or Teams'), () => toast('Copy blocked – right-click the image and choose Copy image')); break; }
    case 'zoom2': { const im = $('#pgimg'); if (im) { zoom = Math.min(3, Math.max(.5, zoom + parseFloat(el.dataset.d))); im.style.width = (zoom * 100) + '%'; $('#z2').textContent = Math.round(zoom * 100) + '%'; } break; }
    case 'zoom': zoom = Math.min(3, Math.max(.6, zoom + parseFloat(el.dataset.d))); $('#vpage').style.setProperty('--z', zoom); $('#zlabel').textContent = Math.round(zoom * 100) + '%'; break;
    case 'fs': $('.viewer-w')?.requestFullscreen?.(); break;
    case 'dl-page': case 'dl-img2': { const l = document.createElement('a'); l.href = c.img; l.download = c.id + '-page.jpg'; l.click(); break; }
    case 'doc': openModal(docModal(id), 'sm'); break;
    case 'login': if (S.user) { go('#/' + (v || 'dashboard')); break; } if (v) S.pendingGo = v; openLogin(v); break;
    case 'logout': S.user = null; persist(); go('#/'); render(); break;
    case 'cmp-subject': S.cmp.subject = v; persist(); render(); break;
    case 'cmp-col': { const cc = S.cmp.cols, i = cc.indexOf(v); if (i > -1) { if (cc.length > 2) cc.splice(i, 1); } else cc.push(v); S.cmp.cols = D.authorities.map(x => x.id).filter(x => cc.includes(x)); persist(); render(); break; }
    case 'newfolder': { const n = prompt('Folder name'); if (n && !S.folders.includes(n)) { S.folders.push(n); persist(); render(); } break; }
    case 'newproj': openModal(`<div class="pad"><h3>New project</h3><form data-form="newproj"><label>Name<input name="n" required></label><label>Authority<select name="a">${['DEWA', 'SEWA', 'ADDC'].map(x => `<option>${x}</option>`).join('')}</select></label><label>Building type<select name="t">${['Commercial', 'Residential', 'Industrial', 'Hospitality', 'Healthcare'].map(x => `<option>${x}</option>`).join('')}</select></label><button class="btn primary w" type="submit">Create project</button></form></div>`, 'sm'); break;
    case 'ai-ask': go('#/ai?q=' + encodeURIComponent(v)); break;
    case 'flag': S.review.unshift({ id: 'r' + Date.now(), kind: 'AI answer', msg: 'User flagged answer for: "' + v + '"', st: 'pending' }); persist(); toast('Flagged – added to the admin review queue'); break;
    case 'rv': S.review.find(r => r.id === id).st = v; persist(); render(); break;
    case 'deldoc': if (confirm('Delete this document from the index? (Seed documents are archived instead in the demo.)')) { const x = S.extraDocs.findIndex(d => d.id === id); x > -1 ? S.extraDocs.splice(x, 1) : S.docStatus[id] = 'Archived'; persist(); render(); } break;
    case 'toast': toast(v); break;
    case 'reset': if (confirm('Reset all demo data?')) { localStorage.removeItem(KEY); location.hash = '#/'; location.reload(); } break;
    case 'vdx-add': VDX.push({ n: 'New circuit', I: 32, L: 30, s: 6 }); render(); break;
    case 'vdx-del': VDX.splice(+id, 1); render(); break;
    case 'vdx-dl': { const b = new Blob(['﻿' + vdxCSV()], { type: 'text/csv' }), u = URL.createObjectURL(b), l = document.createElement('a'); l.href = u; l.download = 'voltage-drop-schedule.csv'; l.click(); URL.revokeObjectURL(u); toast('Schedule downloaded (opens in Excel)'); break; }
  }
});

/* ---- forms ---- */
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
  const k = f.dataset.form, fd = Object.fromEntries(new FormData(f));
  if (k === 'search') go('#/search?q=' + encodeURIComponent(fd.q || ''));
  if (k === 'compare-search') go('#/compare' + (fd.cq && fd.cq.trim() ? '?q=' + encodeURIComponent(fd.cq.trim()) : ''));
  if (k === 'comment') { const r = analyzeComment($('#cmtText').value, $('#cmtProj').value); $('#cmtOut').innerHTML = commentResult(r); }
  if (k === 'login') { S.user = { name: fd.n, email: fd.e }; S.role = fd.r; persist(); closeModal(); const t = f.dataset.target; go('#/' + (['search', 'library'].includes(S.pendingGo) ? S.pendingGo : (t && ROUTES[t] ? t : 'dashboard'))); S.pendingGo = null; render(); }
  if (k === 'newproj') { const id = 'p' + Date.now(); S.projects.push({ id, name: fd.n, auth: fd.a, type: fd.t, stage: 'Concept', sections: ['LV System', 'Lighting', 'Small Power', 'Emergency Lighting'], progress: 5 }); persist(); closeModal(); go('#/projects?id=' + id); }
});

/* ---- change / input ---- */
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.vdx !== undefined) { const [i, k] = el.dataset.vdx.split('.'); VDX[+i][k] = k === 'n' ? el.value : parseFloat(el.value) || 0; $('.vdx table').outerHTML = vdxTable(); }
  if (el.id === 'svP') { const p = S.projects.find(x => x.id === el.value); $('#svS').innerHTML = p.sections.map(x => `<option>${x}</option>`).join(''); }
  if (el.dataset.aChange === 'role') { S.role = el.value; persist(); render(); }
  if (el.dataset.aChange === 'dstatus') { S.docStatus[el.dataset.id] = el.value; persist(); toast('Status updated: ' + el.value); }
  if (el.dataset.aChange === 'urole') { S.users[+el.dataset.id].r = el.value; persist(); render(); }
  if (el.id === 'cmtFile' && el.files[0]) { const fr = new FileReader(); fr.onload = () => { $('#cmtText').value = String(fr.result).slice(0, 2000); }; fr.readAsText(el.files[0]); }
  if (el.id === 'upFile' && el.files[0]) simulateUpload(el.files[0]);
});
document.addEventListener('input', e => {
  const el = e.target, tb = el.closest('#toolBox');
  if (el.dataset.vdx !== undefined) { const [i, k] = el.dataset.vdx.split('.'); VDX[+i][k] = k === 'n' ? el.value : parseFloat(el.value) || 0; return; }
  if (tb && el.dataset.toolIn) toolRun(TOOLS.find(t => t.id === tb.dataset.tool), tb);
  if (el.id === 'q') {
    const s = $('#suggest'), v = el.value.toLowerCase().trim(), pool = [...new Set([...S.recents, ...D.examples])];
    const m = (v ? pool.filter(x => x.toLowerCase().includes(v)) : pool).slice(0, 6);
    s.hidden = !m.length || !el.matches(':focus'); s.innerHTML = m.map(x => `<button type="button" data-a="q" data-v="${esc(x)}">${ic('search', 14)} ${esc(x)}</button>`).join('');
  }
});
document.addEventListener('focusin', e => { if (e.target.id === 'q') e.target.dispatchEvent(new Event('input', { bubbles: true })); });
document.addEventListener('mousedown', e => { if (!e.target.closest('.sbox')) $$('.suggest').forEach(s => s.hidden = true); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && S.user) { e.preventDefault(); const q = $('#q'); q ? q.focus() : go('#/search'); }
});
['dragover', 'drop'].forEach(ev => document.addEventListener(ev, e => { const d = e.target.closest('#drop'); if (!d) return; e.preventDefault(); if (ev === 'drop' && e.dataTransfer.files[0]) simulateUpload(e.dataTransfer.files[0]); }));

function simulateUpload(file) {
  const li = $$('#pipe li'); li.forEach(x => x.classList.remove('done'));
  li.forEach((el, i) => setTimeout(() => el.classList.add('done'), 350 * (i + 1)));
  setTimeout(() => {
    const au = $('#upAuth').value, ver = $('#upVer').value;
    S.extraDocs.unshift({ id: 'up' + Date.now(), auth: au, title: file.name.replace(/\.[^.]+$/, ''), short: file.name.slice(0, 14), version: ver, rev: '00', pub: new Date().toISOString().slice(0, 10), rdate: new Date().toISOString().slice(0, 10), eff: '—', status: 'Draft', pages: 0, ds: 'Indexed' });
    persist(); toast('Simulated: "' + file.name + '" indexed – awaiting admin verification'); setTimeout(() => go('#/admin?t=docs'), 600);
  }, 350 * 11);
}

window.addEventListener('hashchange', () => { const h = location.hash; if (h && !h.startsWith('#/')) { $(h)?.scrollIntoView({ behavior: 'smooth' }); return; } closeModal(); render(); });
render();

/* full-size viewer for the original page image (works inside the page – no new tab / pop-up needed) */
function pageModal(c) {
  return `<div class="pg-full"><div class="pg-bar"><div><b>${esc(c.doc.short)}</b> · cl. ${esc(c.cl)} · ${esc(pgText(c))}<br><span class="muted sm">Source file: ${esc(c.doc.src || c.doc.title)}</span></div><div class="row gap"><button class="btn sm" data-a="zoom2" data-d="-0.25">${ic('zout', 14)}</button><span id="z2">100%</span><button class="btn sm" data-a="zoom2" data-d="0.25">${ic('zin', 14)}</button>${c.img ? `<button class="btn sm primary" data-a="dl-img" data-id="${c.id}">${ic('download', 14)} Download page</button><a class="btn sm" href="${c.img}" target="_blank" rel="noopener">Open image in new tab</a><button class="btn sm" data-a="copy-img" data-id="${c.id}">${ic('copy', 14)} Copy image</button>` : ''}<button class="btn sm" data-a="close">Close</button></div></div><div class="pg-scroll">${c.img ? `<img id="pgimg" src="${c.img}" alt="Original page – ${esc(c.doc.short)} ${esc(pgText(c))}" style="width:100%">` : pageSVG(c)}</div><p class="muted sm">This is the page image taken from the supplied document. If Download does nothing in your browser, right-click the page image and choose <b>Save image as…</b>. The original PDF file itself is not hosted on this site – open ${esc(c.doc.src || c.doc.title)} from your own library to read it in full.</p></div>`;
}
