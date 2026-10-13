/* Views – each returns an HTML string */
const DISCLAIMER = 'This platform is an engineering information and reference tool. Always verify the latest official authority document before final design, submission, or construction.';
const NAV = [['dashboard', 'Dashboard', 'grid'], ['library', 'Code Library', 'book'], ['search', 'Search', 'search'], ['compare', 'Compare Codes', 'compare'], ['subjects', 'Subjects', 'tag'], ['saved', 'Saved References', 'bookmark'],['tools', 'Tools', 'tool'], ['space', 'SEWA space program', 'layers'], ['dewasub', 'DEWA substation', 'layers'], ['settings', 'Settings', 'settings']];
const badge = t => ({ official: '<span class="badge official">' + ic('shield', 13) + ' Official Requirement</span>', ai: '<span class="badge ai">' + ic('bot', 13) + ' AI Interpretation</span>', rec: '<span class="badge rec">' + ic('bulb', 13) + ' Engineering Recommendation</span>' }[t]);
const chips = (arr, g, active) => arr.map(x => { const v = x.id || x, l = x.name || x; return `<button class="chip ${active.includes(v) ? 'on' : ''}" data-a="flt" data-g="${g}" data-v="${esc(v)}">${esc(l)}</button>`; }).join('');
const traceHTML = c => { const t = trace(c); return `<ol class="trace">${t.map((x, i) => `<li${i === 0 ? ` style="--ac:${authById(c.auth).color}"` : ''}>${esc(x)}</li>`).join('')}</ol>`; };
const savedCount = () => S.saved.length;

function searchBox(q = '', big = false) {
  return `<form class="sbox ${big ? 'big' : ''}" data-form="search" autocomplete="off">${ic('search', big ? 22 : 18)}<input id="q" name="q" value="${esc(q)}" placeholder="Search electrical codes, requirements, and design criteria..." aria-label="Search codes"><kbd class="hide-sm">/</kbd><button class="btn primary" type="submit">Search</button><div class="suggest" id="suggest" hidden></div></form>`;
}
function filterPanel(open = true) {
  const f = S.filters, n = f.auth.length + f.disc.length + f.subj.length;
  return `<div class="filters"><div class="fgroup"><h4>Authority</h4><div class="chips">${chips(D.authorities, 'auth', f.auth)}</div></div>
  <details ${open ? 'open' : ''}><summary>Discipline</summary><div class="chips">${chips(D.filterOpts.disc, 'disc', f.disc)}</div></details>
  <details ${open ? 'open' : ''}><summary>Subject</summary><div class="chips">${chips(D.filterOpts.subj, 'subj', f.subj)}</div></details>
  ${n ? `<button class="link" data-a="flt-clear">Clear ${n} filter${n > 1 ? 's' : ''}</button>` : ''}</div>`;
}
function relevance(p) { return `<div class="rel" title="Relevance score"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--line)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="var(--accent)" stroke-width="4" stroke-dasharray="${p * .942} 100" stroke-linecap="round" transform="rotate(-90 18 18)"/></svg><b>${p}%</b><span>Relevant</span></div>`; }

function resultCard(r, q = '') {
  const c = r.c, saved = S.saved.some(s => s.cid === c.id);
  const p = r.parts, why = [['Keyword', p.keyword, .28], ['Subject', p.subject, .22], ['Semantic', p.semantic, .18], ['Authority', p.authority, .12], ['Version', p.version, .08], ['Official source', p.official, .05], ['Exact clause', p.exact, .07]];
  return `<article class="rc" style="--ac:${authById(c.auth).color}">
  <header class="rc-top">${authPill(c.auth)}<span class="rc-doc">${esc(c.doc.title)} <em>${esc(c.doc.version)}</em></span><span class="chip g sm">${esc(c.doc.status)}</span>${r.pct != null ? relevance(r.pct) : ''}</header>
  <div class="rc-body"><div class="rc-main">${badge('official')}<p class="req">${q ? hilite(c.x, q) : esc(c.x)}</p>${traceHTML(c)}
  <div class="meta"><span>${ic('tag', 13)} ${esc(c.s[0])}</span><span>${ic('file', 13)} ${pgText(c)}</span><span>Section ${esc(c.sec)}</span><span>Clause ${esc(c.cl)}</span></div></div>
  <button class="thumb" data-a="src" data-id="${c.id}" aria-label="Open source page">${pageView(c)}<span>${ic('zin', 13)} View page</span></button></div>
  <footer class="rc-act"><button class="btn sm primary" data-a="src" data-id="${c.id}">${ic('eye', 14)} View Source</button><button class="btn sm" data-a="open-page" data-id="${c.id}">${ic('file', 14)} Open Page</button><button class="btn sm" data-a="copy" data-id="${c.id}">${ic('copy', 14)} Copy</button><button class="btn sm ${saved ? 'on' : ''}" data-a="save" data-id="${c.id}">${ic('bookmark', 14)} ${saved ? 'Saved' : 'Save'}</button><button class="btn sm" data-a="save" data-id="${c.id}" data-mode="project">${ic('plus', 14)} Add to Project</button>${compareFor(c) ? `<button class="btn sm" data-a="cmp" data-id="${c.id}">${ic('compare', 14)} Compare</button>` : ''}<button class="btn sm" data-a="share" data-id="${c.id}">${ic('share', 14)} Share</button></footer>
  ${r.parts ? `<details class="why"><summary>Why this result? <b>${r.pct}%</b></summary><div class="whygrid">${why.map(([n, v, m]) => `<div><span>${n}</span><i><u style="width:${Math.round(v / m * 100)}%"></u></i></div>`).join('')}</div><p class="muted sm">Ranking: exact clause → subject → authority → document version → semantic similarity → official verified source.</p></details>` : ''}</article>`;
}

/* ---------------- dashboard ---------------- */
function dashboard() {
  const st = [['Documents indexed', D.docs.length + S.extraDocs.length, 'book'], ['Clauses extracted', D.clauses.length, 'layers'], ['Source pages linked', new Set(D.clauses.filter(c => c.img).map(c => c.img)).size, 'file'], ['Saved references', savedCount(), 'bookmark']];
  const pop = ['Emergency Lighting', 'Voltage Drop', 'Earthing', 'DB', 'Generator', 'Transformer', 'Socket Outlets', 'Fire Alarm'];
  return `<section class="hero-s grid-bg"><div class="hero-in"><p class="eyebrow">Good morning, ${esc((S.user?.name || 'Engineer').split(' ')[0])}</p><h1>Find the exact code requirement.</h1><p class="sub">Search once → find the requirement → see the source → compare → use it in your design.</p>
  ${searchBox('', true)}<div class="chips try"><span class="muted">Try:</span>${D.examples.slice(0, 6).map(e => `<button class="chip" data-a="q" data-v="${esc(e)}">${esc(e)}</button>`).join('')}</div>
  <div class="hero-filters"><span class="muted sm">Authority</span>${chips(D.authorities, 'auth', S.filters.auth)}<a class="link" href="#/search">More filters</a></div></div></section>
  <section class="stats">${st.map(([l, v, i]) => `<div class="stat">${ic(i, 20)}<div><b>${v}</b><span>${l}</span></div></div>`).join('')}</section>
  <div class="cols3">
   <div class="card span2"><div class="card-h"><h3>Popular subjects</h3><a class="link" href="#/subjects">All subjects</a></div><div class="tiles">${pop.map(p => `<a class="tile" href="#/search?q=${encodeURIComponent(p)}">${ic(D.subjectCats.find(c => c.items.includes(p))?.ic || 'tag', 18)}<span>${p}</span></a>`).join('')}</div></div>
   <div class="card ai-card"><div class="card-h"><h3>${ic('bot', 18)} ElectroCode AI</h3></div><p>Ask engineering questions. Every answer is grounded in indexed clauses with page citations.</p><p class="muted sm">"According to DEWA, what is the requirement for emergency lighting?"</p><a class="btn primary" href="#/ai?q=${encodeURIComponent('According to DEWA, what is the requirement for emergency lighting?')}">Ask ElectroCode AI</a></div>
   <div class="card"><div class="card-h"><h3>Recent searches</h3></div><ul class="list">${S.recents.slice(0, 6).map(r => `<li><a href="#/search?q=${encodeURIComponent(r)}">${ic('history', 14)} ${esc(r)}</a></li>`).join('')}</ul></div>
   <div class="card"><div class="card-h"><h3>Saved references</h3><a class="link" href="#/saved">All</a></div>${S.saved.length ? S.saved.slice(0, 4).map(s => { const c = clauseById(s.cid); return `<button class="ref" data-a="src" data-id="${c.id}">${authPill(c.auth)}<span>${esc(c.t)}</span><em>${esc(c.cl)}</em></button>`; }).join('') : '<p class="muted sm">Nothing saved yet.</p>'}</div>
   <div class="card"><div class="card-h"><h3>Code updates</h3></div><ul class="feed"><li><i class="dot g"></i><div><b>UAE Fire Code – chapters 5, 6, 7</b><span>Exit signs, emergency lighting and voice evacuation – indexed</span></div></li><li><i class="dot g"></i><div><b>DEWA Regulations (2017) · SEWA Booklet (2020)</b><span>Selected sections indexed with page images</span></div></li><li><i class="dot y"></i><div><b>Remaining sections</b><span>Upload more documents in Admin to extend coverage</span></div></li></ul></div>
   <div class="card span3 quick"><a href="#/comments" class="qa">${ic('file', 20)}<div><b>Authority Comment Analyzer</b><span>Turn a consultant comment into a code-backed design action</span></div></a><a href="#/versions" class="qa">${ic('history', 20)}<div><b>Version comparison</b><span>Added, removed and modified clauses between editions</span></div></a><a href="#/compare" class="qa">${ic('compare', 20)}<div><b>Compare codes</b><span>DEWA · SEWA · ADDC · UAE FLS · IEC · NFPA</span></div></a><a href="#/tools" class="qa">${ic('tool', 20)}<div><b>Engineering tools</b><span>12 calculators with applicable standards</span></div></a></div>
  </div>`;
}

/* ---------------- search ---------------- */
function searchView(p) {
  const q = p.q || '', t0 = performance.now(), res = q ? search(q) : [], ms = Math.max(8, Math.round(performance.now() - t0 + 14));
  const qa = detectAuth(q), lim = Math.max(12, parseInt(p.n) || 12);
  return `<div class="page-h"><h2>Search</h2></div>${searchBox(q)}
  <div class="split"><aside class="side"><button class="btn sm hide-lg" data-a="toggle-filters">${ic('filter', 14)} Filters</button><div class="filt-wrap" id="filtWrap">${filterPanel(false)}</div></aside>
  <div class="results">${!q ? `<div class="empty"><h3>Search the code library</h3><p class="muted">Use natural language – "DB space" also finds panel working space, switchboard clearance and distribution board access.</p><div class="chips">${D.examples.map(e => `<button class="chip" data-a="q" data-v="${esc(e)}">${esc(e)}</button>`).join('')}</div></div>`
    : `<div class="res-h"><span><b>${res.length}</b> result${res.length === 1 ? '' : 's'} for “${esc(q)}” <span class="muted">· ${ms} ms · hybrid keyword + semantic</span></span><a class="btn sm" href="#/ai?q=${encodeURIComponent(q)}">${ic('bot', 14)} Ask ElectroCode AI</a></div>
    ${qa.length ? `<div class="note">${ic('filter', 14)} Authority detected: ${qa.map(authPill).join(' ')} – results prioritised.</div>` : ''}
    ${res.length ? res.slice(0, lim).map(r => resultCard(r, q)).join('') + (res.length > lim ? `<div class="center"><a class="btn" href="#/search?q=${encodeURIComponent(q)}&n=${lim + 12}">Show 12 more of ${res.length - lim}</a></div>` : '') : `<div class="notfound">${ic('alert', 22)}<div><h3>No verified requirement was found in the indexed sources.</h3><p class="muted">Try broader terms, remove filters, or ask an administrator to index the relevant document.</p></div></div>`}`}</div></div>`;
}

/* ---------------- source modal ---------------- */
function sourceModal(id) {
  const c = clauseById(id), d = c.doc;
  return `<div class="srcm"><div class="viewer-w"><div class="vtools"><button class="icon-btn" data-a="zoom" data-d="-0.2" aria-label="Zoom out">${ic('zout')}</button><span id="zlabel">100%</span><button class="icon-btn" data-a="zoom" data-d="0.2" aria-label="Zoom in">${ic('zin')}</button><button class="icon-btn" data-a="fs" aria-label="Full screen">${ic('expand')}</button><button class="icon-btn" data-a="dl-page" data-id="${c.id}" aria-label="Download page">${ic('download')}</button></div><div class="viewer" id="viewer"><div id="vpage" style="--z:1">${pageView(c)}</div></div><p class="muted sm center">Page image rendered from the supplied PDF.</p></div>
  <div class="srcinfo"><div class="row gap">${authPill(c.auth)}${badge('official')}</div><h3>${esc(c.t)}</h3>${traceHTML(c)}<blockquote>${esc(c.x)}</blockquote>
  <dl class="dl"><dt>Document</dt><dd>${esc(d.title)}</dd><dt>Version</dt><dd>${esc(d.version)}${d.rev && d.rev !== '—' ? ' · ' + esc(d.rev) : ''}</dd><dt>Indexed scope</dt><dd>${esc(d.scope || '')}</dd><dt>Status</dt><dd><span class="chip g sm">${esc(d.status)}</span></dd><dt>Published</dt><dd>${fmtDate(d.pub)}</dd><dt>Effective</dt><dd>${fmtDate(d.eff)}</dd><dt>Source file</dt><dd class="mono sm">${esc(d.src)} · ${esc(pgText(c))}</dd></dl>
  <div class="rc-act"><button class="btn sm primary" data-a="open-page" data-id="${c.id}">${ic('link', 14)} Open original page</button><button class="btn sm" data-a="copy" data-id="${c.id}">${ic('copy', 14)} Copy</button><button class="btn sm" data-a="save" data-id="${c.id}">${ic('bookmark', 14)} Save</button>${compareFor(c) ? `<button class="btn sm" data-a="cmp" data-id="${c.id}">${ic('compare', 14)} Compare</button>` : ''}</div>
  <p class="warn sm">${ic('alert', 14)} ${DISCLAIMER}</p></div></div>`;
}

/* ---------------- compare ---------------- */
function compareView(p) {
  if (p.subject && D.compare[p.subject]) S.cmp.subject = p.subject;
  const sid = S.cmp.subject, cols = S.cmp.cols, tbl = compareTable(sid, cols);
  const cnt = k => tbl.filter(r => r.status === k).length;
  if (p.q) return freeCompare(p.q, cols);
  return `<div class="page-h"><h2>Compare Codes</h2><p class="muted">Search any topic to compare it across authorities, or pick a ready-made subject below – every result links to its source.</p></div>${compareSearchBox('')}
  <div class="tabs">${Object.entries(D.compare).map(([k, v]) => `<button class="tab ${k === sid ? 'on' : ''}" data-a="cmp-subject" data-v="${k}">${v.name}</button>`).join('')}</div>
  <div class="card cmp-ctl"><div class="chips"><span class="muted sm">Columns</span>${D.authorities.filter(a => a.indexed).map(a => `<button class="chip ${cols.includes(a.id) ? 'on' : ''}" data-a="cmp-col" data-v="${a.id}">${a.name}</button>`).join('')}<span class="muted sm">IEC, NFPA and CIBSE appear once their documents are indexed</span></div>
  <div class="legend"><span>🟢 Same <b>${cnt('same')}</b></span><span>🟡 Different <b>${cnt('different')}</b></span><span>🔴 Conflict <b>${cnt('conflict')}</b></span><span>⚪ Not specified <b>${cnt('na') + cnt('single')}</b></span></div></div>
  <div class="cmp-wrap"><table class="cmp"><thead><tr><th>Requirement</th>${cols.map(c => `<th style="--ac:${authById(c).color}">${authPill(c)}</th>`).join('')}</tr></thead><tbody>
  ${tbl.map(row => `<tr class="st-${row.status}"><th><b>${row.attr.l}</b><span class="stp ${row.status}">${STATUS[row.status][0]} ${STATUS[row.status][1]}</span></th>${row.cells.map(cell => cell ? `<td class="cell"><b class="val">${esc(cell.val)}</b><p class="sm">${esc(cell.c.t)}</p><span class="src sm">${esc(cell.c.doc.short)} · cl. ${esc(cell.c.cl)} · ${cell.c.pg ? 'p.' + cell.c.pg : 'ref.'}</span><button class="mini" data-a="src" data-id="${cell.c.id}" aria-label="View source">${pageView(cell.c, { hl: true })}</button><button class="link sm" data-a="src" data-id="${cell.c.id}">View source</button></td>` : `<td class="cell na"><span>⚪ Not specified in indexed clauses</span></td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <p class="warn sm">${ic('alert', 14)} Comparison values come from indexed clauses (transcribed from the supplied documents). Always confirm against the official document. ${DISCLAIMER}</p>`;
}

/* ---------------- library / versions ---------------- */
function library(p) {
  const fa = p.a || '';
  const docs = [...D.docs, ...S.extraDocs].filter(d => !fa || d.auth === fa);
  return `<div class="page-h"><h2>Code Library</h2><p class="muted">Authorities, documents and versions with full status tracking.</p></div>
  <div class="authgrid">${D.authorities.map(a => `<a class="auth ${fa === a.id ? 'on' : ''}" href="#/library?a=${fa === a.id ? '' : a.id}" style="--ac:${a.color}"><b>${a.name}</b><span>${esc(a.full)}</span><em>${a.region} · ${[...D.docs, ...S.extraDocs].filter(d => d.auth === a.id).length ? [...D.docs, ...S.extraDocs].filter(d => d.auth === a.id).length + ' doc' : 'not indexed yet'}</em></a>`).join('')}</div>
  <div class="card tablecard"><table class="tbl"><thead><tr><th>Document</th><th>Authority</th><th>Version</th><th>Revision</th><th>Published</th><th>Effective</th><th>Status</th><th>Workflow</th><th></th></tr></thead><tbody>
  ${docs.map(d => `<tr><td><b>${esc(d.title)}</b></td><td>${authPill(d.auth)}</td><td>${esc(d.version)}</td><td>${esc(d.rev)}</td><td>${fmtDate(d.pub)}</td><td>${fmtDate(d.eff)}</td><td><span class="chip ${d.status === 'Current' ? 'g' : d.status === 'Draft' ? 'y' : ''} sm">${d.status}</span></td><td><span class="chip ${({ Published: 'g', Verified: 'b', Indexed: 'y', Processing: 'y', Archived: '' })[docStatus(d)]} sm">${docStatus(d)}</span></td><td><button class="btn sm" data-a="doc" data-id="${d.id}">Open</button></td></tr>`).join('')}</tbody></table></div>
  <div class="card row between"><div><b>Compare versions</b><p class="muted sm">See added, removed and modified requirements between revisions.</p></div><a class="btn primary" href="#/versions">Version comparison</a></div>`;
}
function docModal(id) {
  const d = docById(id), cl = D.clauses.filter(c => c.d === id);
  return `<div class="pad"><div class="row gap">${authPill(d.auth)}<span class="chip g sm">${d.status}</span></div><h3>${esc(d.title)}</h3><dl class="dl"><dt>Version</dt><dd>${d.version}${d.rev && d.rev !== '—' ? ' · ' + d.rev : ''}</dd><dt>Source file</dt><dd class="mono sm">${esc(d.src || '')}</dd><dt>Indexed scope</dt><dd>${esc(d.scope || '')}</dd><dt>Publication</dt><dd>${fmtDate(d.pub)}</dd><dt>Revision date</dt><dd>${fmtDate(d.rdate)}</dd><dt>Effective</dt><dd>${fmtDate(d.eff)}</dd><dt>Pages</dt><dd>${d.pages || 'n/a (reference standard)'}</dd></dl>
  <h4>Indexed clauses (${cl.length})</h4><ul class="list">${cl.map(c => `<li><button class="link" data-a="src" data-id="${c.id}">${esc(c.cl)} – ${esc(c.t)} <em>${c.pg ? 'p.' + c.pg : ''}</em></button></li>`).join('') || '<li class="muted">No clauses indexed yet.</li>'}</ul></div>`;
}
function versionsView(p) {
  if (!D.diff.length) return `<div class="page-h"><h2>Version Comparison</h2><p class="muted">Compare two editions of the same document – added, removed and modified clauses.</p></div>
  <div class="empty"><h3>Only one edition of each document is indexed</h3><p class="muted">Indexed now: ${D.docs.map(d => esc(d.short)).join(' · ')}.<br>To compare editions (for example DEWA 2017 with a newer edition), upload the second PDF in <a class="link" href="#/admin?t=upload">Admin → Upload &amp; Index</a>; the backend diff job (see ARCHITECTURE.md) aligns clauses and lists what changed.</p></div>
  <p class="warn sm">${ic('alert', 14)} ${DISCLAIMER}</p>`;
  const f = p.f || 'all', rows = D.diff.filter(x => f === 'all' || x.type === f), n = k => D.diff.filter(x => x.type === k).length;
  return `<div class="page-h"><h2>Version Comparison</h2><p class="muted">${authPill('DEWA')} Electrical Installation Guidelines – <b>2022 Rev 01</b> → <b>2025 Rev 03</b></p></div>
  <div class="stats s3"><div class="stat add"><b>${n('added')}</b><span>Added</span></div><div class="stat mod"><b>${n('modified')}</b><span>Modified</span></div><div class="stat rem"><b>${n('removed')}</b><span>Removed</span></div></div>
  <div class="tabs">${['all', 'added', 'modified', 'removed'].map(k => `<a class="tab ${f === k ? 'on' : ''}" href="#/versions?f=${k}">${k[0].toUpperCase() + k.slice(1)}</a>`).join('')}</div>
  ${rows.map(x => `<div class="diff ${x.type}"><div class="diff-h"><span class="chip ${({ added: 'g', modified: 'y', removed: 'r' })[x.type]} sm">${x.type}</span><b>Clause ${x.cl} – ${esc(x.t)}</b></div><div class="diff-b">${x.before ? `<div class="old"><span>2022</span>${esc(x.before)}</div>` : ''}${x.after ? `<div class="new"><span>2025</span>${esc(x.after)}</div>` : ''}</div></div>`).join('')}
  <p class="warn sm">${ic('alert', 14)} ${DISCLAIMER}</p>`;
}

/* ---------------- subjects ---------------- */
function subjectsView() {
  const none = { auth: [], disc: [], subj: [] };
  return `<div class="page-h"><h2>Subject Library</h2><p class="muted">Browse by engineering subject.</p></div><div class="catgrid">${D.subjectCats.map(c => `<div class="card"><div class="card-h"><h3>${ic(c.ic, 18)} ${c.cat}</h3></div><div class="subj">${c.items.map(i => { const n = search(i, none).filter(r => r.pct >= 60).length; return `<a href="#/search?q=${encodeURIComponent(i)}" class="sj">${i}${n ? `<b>${n}</b>` : ''}</a>`; }).join('')}</div></div>`).join('')}</div>`;
}

/* ---------------- saved ---------------- */
function savedView(p) {
  const fo = p.f || 'All', items = S.saved.filter(s => fo === 'All' || s.folder === fo);
  return `<div class="page-h row between"><div><h2>Saved References</h2><p class="muted">${S.saved.length} saved across ${S.projects.length} projects.</p></div><button class="btn" data-a="newfolder">${ic('plus', 14)} New folder</button></div>
  <div class="tabs">${['All', ...S.folders].map(f => `<a class="tab ${fo === f ? 'on' : ''}" href="#/saved?f=${encodeURIComponent(f)}">${ic(f === 'All' ? 'bookmark' : 'folder', 14)} ${esc(f)} <b>${f === 'All' ? S.saved.length : S.saved.filter(s => s.folder === f).length}</b></a>`).join('')}</div>
  ${items.length ? items.map(s => { const c = clauseById(s.cid), pr = S.projects.find(x => x.id === s.project); return `<div class="srow" style="--ac:${authById(c.auth).color}"><div class="srow-m">${authPill(c.auth)}<b>${esc(c.t)}</b><p class="sm">${esc(c.x)}</p><div class="meta"><span>${ic('folder', 13)} ${esc(s.folder)}</span>${pr ? `<span>Project: ${esc(pr.name)}${s.section ? ' › ' + esc(s.section) : ''}</span>` : ''}<span>${ago(s.t)}</span><span>${esc(c.doc.short)} · cl. ${esc(c.cl)} · ${c.pg ? 'p.' + c.pg : 'ref.'}</span></div></div><div class="srow-a"><button class="btn sm" data-a="src" data-id="${c.id}">View source</button><button class="icon-btn" data-a="unsave" data-id="${c.id}" aria-label="Remove">${ic('trash', 15)}</button></div></div>`; }).join('') : '<div class="empty"><h3>Nothing saved here yet</h3><p class="muted">Use Save on any search result.</p></div>'}`;
}
function saveModal(id, mode) {
  const c = clauseById(id), ex = S.saved.find(s => s.cid === id), pid = ex?.project || S.projects[0].id;
  return `<div class="pad"><h3>${mode === 'project' ? 'Add to Project' : 'Save Reference'}</h3><p class="muted sm">${authLabel(c.auth)} — ${esc(c.t)} (cl. ${esc(c.cl)}, p.${c.pg || '—'})</p>
  <label>Project<select id="svP">${S.projects.map(p => `<option value="${p.id}" ${p.id === pid ? 'selected' : ''}>${esc(p.name)} (${authLabel(p.auth)})</option>`).join('')}</select></label>
  <label>Section<select id="svS">${S.projects.find(p => p.id === pid).sections.map(x => `<option ${ex?.section === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
  <label>Folder<select id="svF">${S.folders.map(f => `<option ${(ex?.folder || 'Current Project') === f ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></label>
  <div class="row gap end"><button class="btn" data-a="close">Cancel</button><button class="btn primary" data-a="save-do" data-id="${id}">${ic('check', 14)} Save</button></div></div>`;
}

/* ---------------- projects ---------------- */
function projectsView(p) {
  const pr = S.projects.find(x => x.id === p.id) || S.projects[0];
  const refs = S.saved.filter(s => s.project === pr.id);
  return `<div class="page-h row between"><div><h2>Projects</h2><p class="muted">Organise code references by project and discipline.</p></div><button class="btn primary" data-a="newproj">${ic('plus', 14)} New project</button></div>
  <div class="split p"><aside class="side">${S.projects.map(x => `<a class="pcard ${x.id === pr.id ? 'on' : ''}" href="#/projects?id=${x.id}"><b>${esc(x.name)}</b><span>${authPill(x.auth)} ${esc(x.type)}</span><div class="bar"><u style="width:${x.progress}%"></u></div></a>`).join('')}</aside>
  <div><div class="card"><div class="row between wrap"><div><h3>${esc(pr.name)}</h3><div class="row gap wrap"><span>Authority: ${authPill(pr.auth)}</span><span class="chip sm">${esc(pr.type)}</span><span class="chip y sm">${esc(pr.stage)}</span></div></div><div class="rel big"><b>${pr.progress}%</b><span>Compliance review</span></div></div></div>
  <div class="secgrid">${pr.sections.map(s => { const r = refs.filter(x => x.section === s); return `<div class="card sec"><div class="card-h"><h4>${s}</h4><span class="chip sm">${r.length}</span></div>${r.length ? r.map(x => { const c = clauseById(x.cid); return `<button class="ref" data-a="src" data-id="${c.id}">${authPill(c.auth)}<span>${esc(c.t)}</span><em>cl. ${esc(c.cl)}</em></button>`; }).join('') : '<p class="muted sm">No references yet.</p>'}<a class="link sm" href="#/search?q=${encodeURIComponent(s)}">${ic('search', 13)} Find ${s} requirements</a></div>`; }).join('')}</div></div></div>`;
}

/* ---------------- tools ---------------- */
function toolsView(p) {
  const t = TOOLS.find(x => x.id === p.id) || TOOLS[0];
  return `<div class="page-h"><h2>Engineering Tools</h2><p class="muted">Indicative calculators – each shows its applicable standard.</p></div><div class="split p"><aside class="side toollist">${TOOLS.map(x => `<a class="tl ${x.id === t.id ? 'on' : ''}" href="#/tools?id=${x.id}">${ic(x.ic === 'bolt' ? 'zap' : x.ic, 16)} ${x.name}</a>`).join('')}</aside>
  <div class="card" id="toolBox" data-tool="${t.id}"><h3>${t.name}</h3><div class="stdbar">${ic('book', 14)} <b>Applicable Standard / Code:</b> ${t.std}${t.cmp ? ` · <a class="link" href="#/compare?subject=${t.cmp}">Authority limits</a>` : ''}</div>${toolForm(t)}<div id="toolOut"></div>
  <p class="warn sm">${ic('alert', 14)} Indicative results using simplified data tables. Verify against manufacturer data and the latest authority requirements.</p></div></div>`;
}

/* ---------------- comment analyzer ---------------- */
function analyzeComment(text, projAuth) {
  const qa = detectAuth(text), auth = qa[0] || projAuth;
  const res = search(text, { auth: [auth], disc: [], subj: [] }), top = res[0];
  if (!top || top.raw < .35) return { ok: false, text, auth };
  const l = text.toLowerCase();
  const act = /calculat/.test(l) ? 'Update the calculation and demonstrate compliance with the stated requirement; attach it to the resubmission.' : /drawing|layout|show|indicate/.test(l) ? 'Revise the drawings/layouts to show compliance and add the clause reference in the notes.' : /clarif|confirm|justif/.test(l) ? 'Issue a written clarification confirming how the design meets the clause, with supporting data.' : 'Review the design against the clause, update documents where required and respond with a compliance statement.';
  const ask = /additional|more/.test(l) ? 'The reviewer needs further evidence that the design meets this requirement – the current submission is not sufficient to show compliance.' : 'The reviewer expects the design to demonstrate compliance with this requirement.';
  return { ok: true, text, auth, c: top.c, pct: top.pct, act, ask };
}
function commentsView(p) {
  const sample = 'Provide additional emergency lighting calculations as per DEWA requirements.';
  return `<div class="page-h"><h2>Authority Comment Analyzer</h2><p class="muted">Paste or upload a consultant / authority comment – get the applicable requirement, interpretation and design action.</p></div>
  <div class="split p"><div class="card"><form data-form="comment"><label>Comment<textarea id="cmtText" rows="6" placeholder="Paste comment…">${esc(p.t || sample)}</textarea></label>
  <label>Project (default authority)<select id="cmtProj">${S.projects.map(x => `<option value="${x.auth}">${esc(x.name)} (${authLabel(x.auth)})</option>`).join('')}</select></label>
  <div class="row gap wrap"><button class="btn primary" type="submit">${ic('zap', 14)} Analyze</button><label class="btn">${ic('upload', 14)} Upload .txt<input type="file" id="cmtFile" accept=".txt,.md" hidden></label></div></form></div>
  <div id="cmtOut">${p.t === undefined ? '' : ''}</div></div>`;
}
function commentResult(r) {
  if (!r.ok) return `<div class="notfound">${ic('alert', 22)}<div><h3>No verified requirement was found in the indexed sources.</h3><p class="muted">The comment could not be matched to an indexed ${authLabel(r.auth)} clause. Refine the comment or check the source document manually.</p></div></div>`;
  const c = r.c;
  return `<div class="card result"><h4>Comment</h4><p>${esc(r.text)}</p><h4>Applicable Authority</h4><p>${authPill(r.auth)} ${esc(c.doc.title)} (${esc(c.doc.version)})</p><h4>Requirement ${badge('official')}</h4><blockquote>${esc(c.x)}</blockquote><h4>What the reviewer wants ${badge('ai')}</h4><p>${r.ask}</p><h4>Design Action ${badge('rec')}</h4><p>${r.act}</p><h4>Source</h4>${traceHTML(c)}<div class="row gap wrap"><button class="btn sm primary" data-a="src" data-id="${c.id}">${ic('eye', 14)} View Source</button><button class="btn sm" data-a="save" data-id="${c.id}" data-mode="project">${ic('plus', 14)} Add to Project</button></div><p class="warn sm">${DISCLAIMER}</p></div>`;
}

/* ---------------- settings & admin ---------------- */
function settingsView(p) {
  const t = p.t || 'profile';
  const road = [['Revit plugin & Dynamo integration', 'BIM model compliance checking against indexed clauses'], ['AutoCAD integration', 'Pull clause references into drawing notes'], ['AI design checker', 'Automatic authority compliance report (PDF / Excel)'], ['Project QA/QC & consultant comment tracking', 'Engineering approval workflow'], ['Team collaboration', 'Shared folders, comments, approvals'], ['Public API & company knowledge base', 'REST + webhooks; private company standards index']];
  return `<div class="page-h"><h2>Settings</h2></div><div class="tabs">${[['profile', 'Profile'], ['prefs', 'Preferences'], ['integrations', 'Integrations & roadmap'], ['api', 'API & security']].map(([k, l]) => `<a class="tab ${t === k ? 'on' : ''}" href="#/settings?t=${k}">${l}</a>`).join('')}</div>
  ${t === 'profile' ? `<div class="card form-grid"><label>Name<input value="${esc(S.user?.name)}" disabled></label><label>Email<input value="${esc(S.user?.email)}" disabled></label><label>Role (demo switch)<select data-a-change="role">${['Admin', 'Editor', 'Engineer', 'Viewer'].map(r => `<option ${S.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>${S.role === 'Admin' ? `<a class="btn" href="#/admin">${ic('shield', 14)} Open admin panel</a>` : ''}<button class="btn" data-a="reset">Reset demo data</button></div>` : ''}
  ${t === 'prefs' ? `<div class="card form-grid"><label>Default authority<select><option>DEWA</option><option>SEWA</option><option>ADDC</option></select></label><label>Units<select><option>Metric (mm, m, kW)</option><option>Imperial</option></select></label><label>Language<select><option>English</option><option>العربية (planned)</option></select></label></div>` : ''}
  ${t === 'integrations' ? `<div class="road">${road.map(([a, b]) => `<div class="card"><span class="chip y sm">Roadmap</span><h4>${a}</h4><p class="muted sm">${b}</p></div>`).join('')}</div>` : ''}
  ${t === 'api' ? `<div class="card"><h4>REST API</h4><p class="muted sm">See <span class="mono">backend/api.md</span> – JWT auth, role-based access, rate limiting. Endpoints: <span class="mono">/v1/search</span>, <span class="mono">/v1/ask</span>, <span class="mono">/v1/compare</span>, <span class="mono">/v1/clauses/{id}</span>.</p><button class="btn" data-a="toast" data-v="API keys are issued by the backend in production.">Generate API key</button></div><div class="card"><h4>ElectroCode AI – LLM proxy</h4><p class="muted sm">Optional. Paste the HTTPS URL of your deployed proxy (see <span class="mono">backend/worker/ai-proxy.js</span>). The model API key stays on that server – never in this site. Leave empty to use extractive answers.</p><form data-form="ai-endpoint" class="row gap"><input name="u" value="${esc(S.aiEndpoint || '')}" placeholder="https://your-proxy.workers.dev/chat" style="flex:1;min-width:220px"><button class="btn primary" type="submit">Save</button></form></div>` : ''}`;
}
function adminView(p) {
  if (S.role !== 'Admin') return `<div class="empty"><h3>Administrator access required</h3><p class="muted">Switch role in Settings (demo).</p></div>`;
  const t = p.t || 'docs', docs = [...D.docs, ...S.extraDocs];
  return `<div class="page-h"><h2>Admin Panel</h2></div><div class="tabs">${[['docs', 'Documents'], ['upload', 'Upload & Index'], ['review', 'Review queue'], ['users', 'Users & permissions']].map(([k, l]) => `<a class="tab ${t === k ? 'on' : ''}" href="#/admin?t=${k}">${l}${k === 'review' ? ` <b>${S.review.filter(r => r.st === 'pending').length}</b>` : ''}</a>`).join('')}</div>
  ${t === 'docs' ? `<div class="card tablecard"><table class="tbl"><thead><tr><th>Document</th><th>Authority</th><th>Version</th><th>Status</th><th>Actions</th></tr></thead><tbody>${docs.map(d => `<tr><td><b>${esc(d.title)}</b></td><td>${authPill(d.auth)}</td><td>${d.version} · Rev ${d.rev}</td><td><select data-a-change="dstatus" data-id="${d.id}">${['Processing', 'Indexed', 'Verified', 'Published', 'Archived'].map(s => `<option ${docStatus(d) === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td><td><button class="btn sm" data-a="toast" data-v="Revision upload: attach new PDF and link as Rev ${esc(d.rev)}+1 (demo).">Add revision</button> <button class="btn sm" data-a="deldoc" data-id="${d.id}">${ic('trash', 13)} Delete</button></td></tr>`).join('')}</tbody></table></div>` : ''}
  ${t === 'upload' ? `<div class="card"><label class="drop" id="drop">${ic('upload', 28)}<b>Drop PDF, DOCX or scanned images here</b><span class="muted sm">or click to browse – processing is simulated in this prototype</span><input type="file" id="upFile" accept=".pdf,.docx,.png,.jpg,.jpeg,.tiff" hidden></label>
  <div class="form-grid"><label>Authority<select id="upAuth">${D.authorities.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}</select></label><label>Version<input id="upVer" value="2026"></label><label>Category<select><option>Electrical</option><option>Fire & Life Safety</option><option>Lighting</option></select></label></div>
  <ol class="pipe live" id="pipe">${['Extract text', 'OCR scanned pages', 'Detect headings', 'Detect tables', 'Detect figures', 'Detect clauses', 'Detect page numbers', 'Generate embeddings', 'Index document', 'Link images to clauses'].map(s => `<li>${s}</li>`).join('')}</ol></div>` : ''}
  ${t === 'review' ? S.review.map(r => `<div class="srow"><div class="srow-m"><span class="chip sm ${r.st === 'pending' ? 'y' : r.st === 'approved' ? 'g' : 'r'}">${r.kind}</span> ${esc(r.msg)}</div><div class="srow-a">${r.st === 'pending' ? `<button class="btn sm" data-a="rv" data-id="${r.id}" data-v="approved">Approve</button><button class="btn sm" data-a="rv" data-id="${r.id}" data-v="rejected">Reject</button>` : `<span class="muted sm">${r.st}</span>`}</div></div>`).join('') : ''}
  ${t === 'users' ? `<div class="card tablecard"><table class="tbl"><thead><tr><th>User</th><th>Role</th><th>Last active</th><th>Upload</th><th>Verify</th><th>Manage users</th></tr></thead><tbody>${S.users.map((u, i) => `<tr><td><b>${esc(u.n)}</b><br><span class="muted sm">${esc(u.e)}</span></td><td><select data-a-change="urole" data-id="${i}">${['Admin', 'Editor', 'Engineer', 'Viewer'].map(r => `<option ${u.r === r ? 'selected' : ''}>${r}</option>`).join('')}</select></td><td>${u.last}</td><td>${['Admin', 'Editor'].includes(u.r) ? '✓' : '–'}</td><td>${['Admin', 'Editor'].includes(u.r) ? '✓' : '–'}</td><td>${u.r === 'Admin' ? '✓' : '–'}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
}

/* ---------------- landing ---------------- */
function landing() {
  const demo = search('Emergency lighting lux requirement')[0];
  const feats = [['search', 'Hybrid search', 'Keyword + semantic search with authority, discipline and subject filters.'], ['shield', 'Source traceability', 'Authority → Document → Section → Clause → Page on every answer.'], ['file', 'Original page images', 'See the exact page or figure with the requirement highlighted.'], ['compare', 'Compare codes', 'Same, different, conflict – side-by-side across authorities.'], ['bot', 'Grounded AI', 'Answers only from indexed sources – or an honest “not found”.'], ['folder', 'Project workspace', 'Save requirements to projects, folders and design sections.']];
  return `<div class="land"><header class="lnav"><a class="logo" href="#/">${logoMark()} <span class="lg-t">ElectroCode Hub<small>Technical First</small></span></a><nav class="hide-sm"><a href="#features">Features</a><a href="#compare-l">Compare</a><a href="#trust">Trust</a><a href="#roadmap">Roadmap</a></nav><div class="row gap"><button class="btn ghost" data-a="login">Sign in</button><button class="btn primary" data-a="login" data-v="search">Search Codes</button></div></header>
  <section class="lhero grid-bg"><div class="lh-in"><span class="pill-top">TECHNICAL FIRST · SEWA · DEWA · ADDC · UAE FLS · IEC · NFPA · CIBSE</span><h1>Find the Electrical Code Requirement You Need — In Seconds.</h1><p>Search, compare, verify, and understand electrical requirements from SEWA, DEWA, ADDC, IEC, NFPA, CIBSE and other engineering standards from one intelligent platform.</p>
  <div class="row gap center wrap"><button class="btn primary lg" data-a="login" data-v="search">Search Codes</button><button class="btn lg ghost-l" data-a="login" data-v="library">Explore Standards</button></div></div>
  <div class="preview"><div class="pv-bar"><i></i><i></i><i></i><span>electrocode.hub / search</span></div><div class="pv-body"><div class="sbox pv"> ${ic('search', 18)}<span>Emergency lighting lux requirement</span></div><div class="pv-grid"><div class="pv-res">${resultCard(demo, 'emergency lighting lux')}</div><div class="pv-side"><div class="card"><h4>Compare · Emergency Lighting</h4>${compareTable('emergency-lighting', ['DEWA', 'SEWA', 'FLS']).slice(0, 2).map(r => `<div class="pvrow"><b>${r.attr.l}</b><span class="stp ${r.status}">${STATUS[r.status][0]} ${STATUS[r.status][1]}</span></div>`).join('')}</div><div class="card ai-card"><h4>${ic('bot', 16)} ElectroCode AI</h4><p class="sm">Official requirement, source, page image and related clauses – or “No verified requirement was found.”</p></div></div></div></div></div></section>
  <section class="lsec" id="features"><h2>Search → Verify → Compare → Design</h2><div class="fgrid">${feats.map(([i, t, d]) => `<div class="fc">${ic(i, 24)}<h4>${t}</h4><p>${d}</p></div>`).join('')}</div></section>
  <section class="lsec alt" id="compare-l"><h2>Every claim carries its source</h2><div class="three"><div>${badge('official')}<p>Exact clause text from an indexed official document, with page image.</p></div><div>${badge('ai')}<p>Plain-language explanation – always labelled, never presented as code.</p></div><div>${badge('rec')}<p>Design guidance for engineers – clearly separated from the code.</p></div></div></section>
  <section class="lsec" id="trust"><h2>Strictly source-grounded AI</h2><p class="lead">If a requirement can’t be verified in the indexed sources, ElectroCode AI says so: <b>“No verified requirement was found in the indexed sources.”</b></p></section>
  <section class="lsec alt" id="roadmap"><h2>Built to grow</h2><div class="chips c">${['Revit plugin', 'Dynamo', 'AutoCAD', 'BIM compliance checking', 'AI design checker', 'PDF compliance report', 'Excel export', 'Consultant comment tracking', 'Team collaboration', 'Approval workflow', 'API', 'Company knowledge base'].map(x => `<span class="chip">${x}</span>`).join('')}</div></section>
  <footer class="lfoot"><p class="credit"><b>ElectroCode Hub</b> · Technical First · Created by <b>Y.SH</b></p><p>${DISCLAIMER}</p><p class="muted sm">Clauses were transcribed from the documents supplied by the owner of this site. Check the original before use.</p></footer></div>`;
}
const logoMark = () => `<svg width="26" height="26" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#2f6bff"/><path d="M18 5 8 18h7l-1 9 10-13h-7z" fill="#fff"/></svg>`;
