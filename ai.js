/* ElectroCode AI – conversational retrieval-grounded assistant.
   Retrieval reuses search() over the indexed clauses (core.js). Two answer modes:
   - extractive (default, offline): the answer is assembled only from quoted clause text and stored metadata;
   - LLM: retrieved evidence is POSTed to a server-side proxy (S.aiEndpoint, see backend/worker/ai-proxy.js).
     The model text is accepted only when every [n] citation points at retrieved evidence. No API key lives in this file. */
const AI = { busy: false, histOpen: false, draft: '' };
const AI_NOT_FOUND = 'No verified requirement was found in the indexed sources.';
const AI_NA = 'Not found in the indexed documents';
const AI_VERIFY = 'Verification required';
const AI_PROMPTS = [
  ['Search an Electrical Requirement', 'search', 'What is the working space in front of a distribution board?'],
  ['Compare DEWA vs SEWA', 'compare', 'Compare earthing requirements between DEWA and SEWA'],
  ['Emergency Lighting Requirements', 'bulb', 'Emergency lighting requirements'],
  ['Cable Sizing and Protection', 'zap', 'Cable voltage drop and protection'],
  ['Earthing and Bonding', 'shield', 'Earthing and bonding requirements'],
  ['Electrical Room Requirements', 'layers', 'Transformer room requirements']
];
const AI_CMP = /compar|versus|\bvs\.?\b|differ/i;
const AI_FOLLOW = new Set('compare comparison compared vs versus with it this that those them same show me clause clauses source sources page pages reference references extract extracts also and what about how which give list table difference differences between please then too'.split(' '));
const aiPass = r => (r.kw >= .99 && r.raw >= .3) || (r.raw >= .42 && r.kwS >= .25 && r.kw >= .6);
const aiEdition = d => [d.version, d.rev && /^\d/.test(d.rev) ? 'rev. ' + d.rev : '', d.pub && d.pub !== '—' ? '(' + fmtDate(d.pub) + ')' : ''].filter(Boolean).join(' ');
const aiConv = () => S.convs.find(c => c.id === S.curConv);

(function aiInit() {
  if (!Array.isArray(S.convs)) S.convs = [];
  if (!S.aiScope) S.aiScope = { auth: 'All', subj: '' };
  if (S.aiEndpoint == null) S.aiEndpoint = '';
  if (!S.convs.length && Array.isArray(S.chat) && S.chat.length) {   // migrate the old single-shot history
    S.convs.push({ id: 'c0', title: 'Earlier questions', ts: Date.now(), msgs: S.chat.flatMap(m => [{ role: 'user', text: m.q }]) });
    S.chat = [];
  }
})();

/* ---------- context resolution: follow-ups keep the topic, authority words narrow or widen the scope ---------- */
function aiResolve(conv, text, scope) {
  scope = scope || S.aiScope;
  const msgs = (conv && conv.msgs) || [], explicit = detectAuth(text), cmpWord = AI_CMP.test(text);
  const prev = [...msgs].reverse().find(m => m.role === 'ai' && m.rq && m.rq.topic);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const content = words.filter(w => !STOP.has(w) && !AUTH_WORDS[w] && !AI_FOLLOW.has(w));
  const follow = !!prev && content.length === 0;
  let auth;
  if (explicit.length) auth = cmpWord && follow ? [...new Set([...prev.rq.auth, ...explicit])] : explicit;
  else if (follow) auth = prev.rq.auth.slice();
  else if (scope.auth && scope.auth !== 'All') auth = [scope.auth];
  else auth = [];
  if (cmpWord && auth.length < 2) auth = [...new Set([...auth, ...D.cmpDefaultCols])];
  const clean = text.replace(/\b(dewa|sewa|addc|fls|iec|nfpa|cibse)\b/gi, ' ').replace(/according to|compare|comparison|versus|\bvs\.?\b|between|differences?\b/gi, ' ').replace(/[?,]/g, ' ').replace(/\s+/g, ' ').trim().replace(/(\s+(and|or|with|from|in|for|of|to|by|the))+$/i, '').replace(/^((and|or|with|from|in|for|of|to|the)\s+)+/i, '');
  const topic = follow ? prev.rq.topic : (clean || text.trim());
  return { topic, auth, cmp: cmpWord || auth.length >= 2, follow, detail: follow && /\b(clauses?|sources?|pages?|references?|extracts?)\b/i.test(text), subj: scope.subj || '' };
}

/* ---------- retrieval with metadata ---------- */
function aiRetrieve(rq) {
  const subj = rq.subj ? [rq.subj] : [], run = a => search(rq.topic, { auth: a ? [a] : [], disc: [], subj }).filter(aiPass);
  if (rq.cmp) {
    const by = {}; rq.auth.forEach(a => { by[a] = run(a).slice(0, 3).map(r => r.c.id); });
    return { by, ev: [...new Set(Object.values(by).flat())] };
  }
  const hits = run(rq.auth.length === 1 ? rq.auth[0] : null).slice(0, 4);
  return { hits, ev: hits.map(r => r.c.id) };
}
function aiBuild(msgs, text, scope) {
  const rq = aiResolve({ msgs }, text, scope), r = aiRetrieve(rq);
  const m = { role: 'ai', rq, ev: r.ev, by: r.by || null, ids: r.hits ? r.ev : null, ok: r.ev.length > 0, mode: 'extractive' };
  if (r.hits && r.hits[0]) m.top = { raw: r.hits[0].raw, kw: r.hits[0].kw, pct: r.hits[0].pct };
  const cs = m.ev.map(clauseById), c0 = cs[0];
  m.cid = c0 ? (cs.map(compareFor).find(Boolean) || null) : null;
  m.level = aiLevel(m);
  return m;
}
function aiLevel(m) {
  if (!m.ev.length) return { l: 'None', c: 'r', why: 'No indexed clause matched the question.' };
  if (m.rq.cmp) {
    const have = m.rq.auth.filter(a => (m.by[a] || []).length), miss = m.rq.auth.filter(a => !have.includes(a)), t = m.rq.auth.length;
    return have.length === t ? { l: 'High', c: 'g', why: `A matching clause was found for all ${t} authorities.` }
      : { l: have.length >= 2 ? 'Medium' : 'Low', c: have.length >= 2 ? 'y' : 'r', why: `Evidence for ${have.length} of ${t} authorities; nothing found for ${miss.map(authLabel).join(', ')}.` };
  }
  const c = clauseById(m.ev[0]), full = !!(c.cl && c.pg);
  const l = m.top && m.top.kw >= .99 && m.top.raw >= .5 && full ? 'High' : (full || (m.top && m.top.raw >= .42) ? 'Medium' : 'Low');
  return { l, c: l === 'High' ? 'g' : l === 'Medium' ? 'y' : 'r', why: `Top match ${m.top ? m.top.pct + '% relevance' : ''}; ${full ? 'clause number and page are indexed.' : 'clause or page is not indexed – ' + AI_VERIFY.toLowerCase() + '.'}` };
}

/* ---------- optional LLM mode (server-side proxy) ---------- */
async function aiCallLLM(m, question, history) {
  const ev = m.ev.map((id, i) => { const c = clauseById(id); return { n: i + 1, id, authority: authLabel(c.auth), document: c.doc.title, edition: aiEdition(c.doc), section: c.sec, clause: c.cl || null, page: c.pg || null, text: c.x }; });
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch(S.aiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
      body: JSON.stringify({ question, topic: m.rq.topic, authorities: m.rq.auth, compare: m.rq.cmp, history, evidence: ev }) });
    if (!r.ok) throw new Error('AI proxy returned HTTP ' + r.status);
    const j = await r.json();
    if (typeof j.answer !== 'string' || !j.answer.trim()) throw new Error('The AI proxy returned an empty answer.');
    return j.answer;
  } catch (e) { throw new Error(e.name === 'AbortError' ? 'The AI proxy timed out.' : e.message); }
  finally { clearTimeout(to); }
}
/* accept model text only if it cites retrieved evidence; unknown [n] markers are removed and counted */
function aiValidate(text, n) {
  const bad = []; let used = 0;
  const clean = text.replace(/\[(\d+)\]/g, (s, d) => { if (+d >= 1 && +d <= n) { used++; return s; } bad.push(d); return ''; });
  return { clean, bad, used, ok: used > 0 };
}

/* ---------- conversation flow ---------- */
async function aiSend(text) {
  text = String(text || '').trim(); if (!text || AI.busy) return;
  let conv = aiConv();
  if (!conv) { conv = { id: 'c' + Date.now(), title: text.slice(0, 48), msgs: [], ts: Date.now() }; S.convs.unshift(conv); S.curConv = conv.id; }
  if (!conv.msgs.length) conv.title = text.slice(0, 48);
  conv.msgs.push({ role: 'user', text, ts: Date.now() });
  const m = { role: 'ai', pending: true, ts: Date.now() }; conv.msgs.push(m); conv.ts = Date.now();
  AI.draft = '';
  await aiFill(conv, m, text);
}
async function aiFill(conv, m, text) {
  AI.busy = true; m.pending = true; m.err = null; persist(); aiRefresh();
  const idx = conv.msgs.indexOf(m), before = conv.msgs.slice(0, idx - 1);
  await new Promise(r => setTimeout(r, 250));   // lets the loading state paint
  try {
    const b = aiBuild(before, text); Object.assign(m, b);
    if (S.aiEndpoint && m.ev.length) {
      try {
        const hist = before.slice(-6).map(x => x.role === 'user' ? { role: 'user', text: x.text } : { role: 'assistant', text: x.text || (x.ev || []).map(id => clauseById(id)?.t).join('; ') });
        const raw = await aiCallLLM(m, text, hist), v = aiValidate(raw, m.ev.length);
        if (!v.ok) throw new Error('The model answer carried no valid citation to the retrieved clauses and was discarded.');
        m.text = v.clean; m.mode = 'llm'; m.badCites = v.bad;
      } catch (e) { m.err = e.message; m.mode = 'extractive'; m.text = null; }
    }
  } catch (e) { m.ok = false; m.ev = []; m.err = 'Retrieval failed: ' + e.message; }
  m.pending = false; AI.busy = false; persist(); aiRefresh();
}
function aiRefresh() { if (parseHash().r === 'ai') { const k = $('#aiq'); if (k) AI.draft = k.value; render(); const l = $('#chatLog'); if (l && l.lastElementChild) l.lastElementChild.scrollIntoView({ block: 'end' }); } }
function aiSubmit(q) { aiSend(q); }

/* ---------- rendering ---------- */
const aiCite = (m, id) => { const i = m.ev.indexOf(id); return i < 0 ? '' : `<sup class="cite">[${i + 1}]</sup>`; };
const aiPage = c => c.pg ? (c.doc.id === 'addc05' ? 'PDF page ' : 'Page ') + c.pg : AI_VERIFY + ' (page not indexed)';
const aiClause = c => c.cl ? 'Clause ' + c.cl : AI_VERIFY + ' (clause not indexed)';
const aiShort = (t, n) => t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + ' …' : t;
const aiSec = (h, body) => `<div class="ca-sec"><h5>${h}</h5>${body}</div>`;

function aiMd(text) {   // tiny, safe markdown: **bold**, bullets, pipe tables, [n] markers
  const lines = esc(text).split('\n'); let out = '', tbl = [], list = false;
  const inl = s => s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\[(\d+)\]/g, '<sup class="cite">[$1]</sup>');
  const flush = () => { if (!tbl.length) return; const rows = tbl.filter(r => !/^\|?[\s:|-]+\|?$/.test(r)).map(r => r.replace(/^\||\|$/g, '').split('|').map(x => inl(x.trim())));
    out += '<div class="ca-tw"><table class="ca-t">' + rows.map((r, i) => '<tr>' + r.map(x => `<${i ? 'td' : 'th'}>${x}</${i ? 'td' : 'th'}>`).join('') + '</tr>').join('') + '</table></div>'; tbl = []; };
  lines.forEach(l => {
    if (/^\s*\|/.test(l)) { tbl.push(l.trim()); return; } flush();
    if (/^\s*[-*]\s+/.test(l)) { if (!list) { out += '<ul>'; list = true; } out += '<li>' + inl(l.replace(/^\s*[-*]\s+/, '')) + '</li>'; return; }
    if (list) { out += '</ul>'; list = false; }
    out += l.trim() ? '<p>' + inl(l) + '</p>' : '';
  });
  flush(); if (list) out += '</ul>'; return out;
}

function aiRefTable(m, cs) {
  return `<div class="ca-tw"><table class="ca-t"><tr><th>#</th><th>Authority</th><th>Document / edition</th><th>Section</th><th>Clause</th><th>Page</th><th></th></tr>${cs.map(c => `<tr><td>[${m.ev.indexOf(c.id) + 1}]</td><td>${authPill(c.auth)}</td><td>${esc(c.doc.title)}<br><span class="muted sm">${esc(aiEdition(c.doc))}</span></td><td>${esc(c.sec || AI_VERIFY)}</td><td>${c.cl ? esc(c.cl) : '<span class="muted">' + AI_VERIFY + '</span>'}</td><td>${c.pg ? esc(c.pg) : '<span class="muted">' + AI_VERIFY + '</span>'}</td><td><button class="btn sm" data-a="src" data-id="${c.id}">${ic('eye', 13)} Source</button></td></tr>`).join('')}</table></div>`;
}
function aiExtract(m, c, n) { return `<blockquote class="ca-q">${esc(aiShort(c.x, n || 520))}${aiCite(m, c.id)}</blockquote>`; }

function aiSingleHTML(m) {
  const cs = m.ev.map(clauseById), c = cs[0], rel = cs.slice(1), cid = compareFor(c);
  const attrs = cid ? D.compare[cid].attrs.filter(a => c.a && c.a[a.k]) : [];
  const direct = attrs.length ? attrs.slice(0, 3).map(a => `<b>${esc(a.l)}:</b> ${esc(c.a[a.k])}`).join('<br>') : esc(c.e || aiShort(c.x, 220));
  return aiSec('Direct Answer', `<p>${direct} ${aiCite(m, c.id)}</p>`)
    + aiSec('Code Requirement ' + badge('official'), `<p>${esc(c.e || c.t)} ${aiCite(m, c.id)}</p>`)
    + aiSec('Official Reference', aiRefTable(m, [c]))
    + aiSec('Source Extract', aiExtract(m, c))
    + aiSec('Engineering Interpretation ' + badge('rec'), `<p>${esc(c.rec || 'Reference this clause in the design basis and verify the applicable edition and authority instructions before submission.')}</p><p class="muted sm">Interpretation – not part of the official source text.</p>`)
    + (rel.length ? aiSec('Related Requirements', `<div class="ca-rel">${rel.map(r => `<div class="ca-relc"><div>${authPill(r.auth)} <b>${esc(r.t)}</b>${aiCite(m, r.id)}</div><p class="muted sm">${esc(aiShort(r.x, 160))}</p><button class="btn sm" data-a="src" data-id="${r.id}">${ic('eye', 13)} Source</button></div>`).join('')}</div>`) : '');
}
function aiCompareHTML(m) {
  const auths = m.rq.auth, pick = (a, k) => { for (const id of (m.by[a] || [])) { const c = clauseById(id); if (c.a && c.a[k]) return c; } return null; };
  const top = a => (m.by[a] || []).length ? clauseById(m.by[a][0]) : null, cell = (c, v) => c ? `${esc(v)} ${aiCite(m, c.id)}` : `<span class="muted">${AI_NA}</span>`;
  let rows = '';
  if (m.cid) D.compare[m.cid].attrs.forEach(at => {
    const cells = auths.map(a => { const c = pick(a, at.k); return c ? { c, val: c.a[at.k] } : null; });
    if (!cells.some(Boolean)) return;
    const st = STATUS[classify(cells)];
    rows += `<tr><th>${esc(at.l)}</th>${cells.map(x => `<td>${x ? cell(x.c, x.val) : cell(null)}</td>`).join('')}<td>${st[0]} ${st[1]}</td></tr>`;
  });
  if (!rows) rows = `<tr><th>Requirement</th>${auths.map(a => { const c = top(a); return `<td>${c ? esc(c.t) + ' – ' + esc(aiShort(c.x, 170)) + ' ' + aiCite(m, c.id) : cell(null)}</td>`; }).join('')}<td>See extracts</td></tr>`;
  rows += `<tr><th>Clause</th>${auths.map(a => { const c = top(a); return `<td>${c ? (c.cl ? esc(c.cl) : AI_VERIFY) : AI_NA}</td>`; }).join('')}<td></td></tr>`
    + `<tr><th>Page</th>${auths.map(a => { const c = top(a); return `<td>${c ? (c.pg ? esc(c.pg) : AI_VERIFY) : AI_NA}</td>`; }).join('')}<td></td></tr>`
    + `<tr><th>Document / edition</th>${auths.map(a => { const c = top(a); return `<td>${c ? esc(c.doc.short || c.doc.title) + '<br><span class="muted sm">' + esc(aiEdition(c.doc)) + '</span>' : AI_NA}</td>`; }).join('')}<td></td></tr>`;
  const table = `<div class="ca-tw"><table class="ca-t"><tr><th>Item</th>${auths.map(a => `<th>${esc(authLabel(a))}</th>`).join('')}<th>Status</th></tr>${rows}</table></div>`;
  const miss = auths.filter(a => !top(a)), conf = m.cid ? compareTable(m.cid, auths).filter(r => r.status === 'conflict').length : 0;
  const cs = m.ev.map(clauseById);
  return aiSec('Direct Answer', `<p>Requirements retrieved for <b>${esc(m.rq.topic)}</b> from ${auths.map(authLabel).join(', ')}.${miss.length ? ` <b>${miss.map(authLabel).join(', ')}</b>: ${AI_NA.toLowerCase()}.` : ''}${conf ? ` <b>${conf} conflicting value${conf > 1 ? 's' : ''}</b> – compare the editions below before relying on either.` : ''}</p>`)
    + aiSec('Comparison ' + badge('official'), table)
    + aiSec('Official Reference', aiRefTable(m, cs))
    + aiSec('Source Extracts', cs.map(c => `<div class="ca-ex">${authPill(c.auth)} <b>${esc(c.t)}</b>${aiExtract(m, c, 380)}</div>`).join(''))
    + aiSec('Engineering Interpretation ' + badge('rec'), `<p>Differences between authorities are checked against the project's governing jurisdiction, edition and contractual requirements. Interpretation – not official text.</p>`);
}
function aiSuggest(m) {
  if (!m.ok) return [];
  const out = [], c = clauseById(m.ev[0]);
  if (m.rq.cmp) { m.rq.auth.filter(a => (m.by[a] || []).length).slice(0, 2).forEach(a => out.push('What about ' + authLabel(a) + '?')); out.push('Show me the clauses'); }
  else {
    D.indexedAuth.filter(a => a !== c.auth).slice(0, 2).forEach(a => out.push('Compare it with ' + authLabel(a)));
    out.push('Show me the clauses');
    const r = m.ev[1] && clauseById(m.ev[1]); if (r) out.push(r.t);
  }
  return [...new Set(out)].slice(0, 4);
}

function aiMsgHTML(m, i) {
  if (m.role === 'user') return `<div class="you">${esc(m.text)}</div>`;
  if (m.pending) return `<div class="ai-msg ca-load"><span class="ca-dots"><i></i><i></i><i></i></span> Searching the indexed documents…</div>`;
  const err = m.err ? `<div class="ca-err">${ic('alert', 16)}<div><b>${m.mode === 'extractive' && m.ev && m.ev.length ? 'LLM answer unavailable – showing the extractive answer from the indexed clauses.' : 'Something went wrong.'}</b><br><span class="sm">${esc(m.err)}</span></div><button class="btn sm" data-a="ai-retry" data-v="${i}">Retry</button></div>` : '';
  if (!m.ok) return `<div class="ai-msg">${err}<div class="notfound">${ic('alert', 22)}<div><h3>${AI_NOT_FOUND}</h3><p class="muted">ElectroCode AI answers only from indexed clauses${m.rq && m.rq.auth.length ? ' for ' + m.rq.auth.map(authLabel).join(', ') : ''} and does not guess requirements. Try rephrasing, remove the authority/subject filter, or ask an administrator to index the relevant document.</p><div class="chips"><a class="chip" href="#/search?q=${encodeURIComponent(m.rq ? m.rq.topic : '')}">Search “${esc(m.rq ? m.rq.topic : '')}” manually</a></div></div></div></div>`;
  const lv = m.level, n = m.ev.length, nA = new Set(m.ev.map(id => clauseById(id).auth)).size;
  const body = m.mode === 'llm'
    ? aiSec('Answer ' + badge('ai'), `<div class="ca-llm">${aiMd(m.text)}</div>${m.badCites && m.badCites.length ? `<p class="warn sm">${m.badCites.length} citation marker(s) pointed at evidence that was not retrieved and were removed.</p>` : ''}`) + aiSec('Official Reference', aiRefTable(m, m.ev.map(clauseById))) + aiSec('Source Extracts', m.ev.map(clauseById).map(c => `<div class="ca-ex">${authPill(c.auth)} <b>${esc(c.t)}</b>${aiExtract(m, c, 380)}</div>`).join(''))
    : (m.rq.cmp ? aiCompareHTML(m) : aiSingleHTML(m));
  const top = clauseById(m.ev[0]);
  return `<div class="ai-msg">${err}
  <div class="ca-meta"><span class="chip ${lv.c} sm" title="${esc(lv.why)}">${ic('shield', 12)} Evidence: ${lv.l}</span><span class="chip sm ${m.mode === 'llm' ? 'b' : ''}">${m.mode === 'llm' ? 'LLM-written · citations validated' : 'Extractive · quoted from indexed clauses'}</span><span class="muted sm">${n} clause${n > 1 ? 's' : ''} · ${nA} authorit${nA > 1 ? 'ies' : 'y'}${m.rq.follow ? ' · follow-up on “' + esc(aiShort(m.rq.topic, 40)) + '”' : ''}</span></div>
  <p class="muted sm">${esc(lv.why)}</p>${body}
  <div class="ca-act"><button class="btn sm" data-a="ai-copy" data-v="${i}">${ic('copy', 13)} Copy answer</button><button class="btn sm" data-a="ai-cites" data-v="${i}">${ic('copy', 13)} Copy citations</button><button class="btn sm" data-a="ai-export" data-v="${i}">${ic('file', 13)} Export</button><button class="btn sm" data-a="save" data-id="${top.id}">${ic('bookmark', 13)} Save reference</button><button class="btn sm" data-a="flag" data-v="${esc(m.rq.topic)}">${ic('alert', 13)} Flag</button></div>
  ${aiSuggest(m).length ? `<div class="ca-sug"><span class="muted sm">Ask next:</span>${aiSuggest(m).map(s => `<button class="chip" data-a="ai-sug" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}
  <p class="warn sm">${DISCLAIMER} The applicable edition depends on the project jurisdiction and authority instructions.</p></div>`;
}

function aiView() {
  const conv = aiConv(), sc = S.aiScope;
  if (conv) conv.msgs.forEach(m => { if (m.pending && !AI.busy) { m.pending = false; m.ok = false; m.ev = []; m.err = 'The previous request was interrupted.'; m.rq = m.rq || { topic: '', auth: [] }; } });
  const subjects = D.subjectCats.flatMap(c => c.items);
  const scopeTxt = (sc.auth === 'All' ? 'All authorities' : authLabel(sc.auth)) + (sc.subj ? ' · ' + sc.subj : '');
  const welcome = `<div class="ca-welcome"><div class="ca-logo">${ic('bot', 30)}</div><h3>Welcome to ElectroCode AI</h3><p>Ask technical questions, search electrical authority codes, compare requirements, and access verified code references in one place.</p>
    <div class="ca-prompts">${AI_PROMPTS.map(([l, i, q]) => `<button class="ca-pr" data-a="ai-sug" data-v="${esc(q)}">${ic(i, 18)}<span>${l}</span></button>`).join('')}</div>
    <p class="muted sm">Answers come only from indexed clauses and always show authority, document, clause and page – or say that nothing was found.</p></div>`;
  const hist = S.convs.map(c => `<div class="ca-ci ${c.id === S.curConv ? 'on' : ''}"><button class="ca-ct" data-a="ai-conv" data-id="${c.id}" title="${esc(c.title)}">${esc(c.title || 'New chat')}</button><button class="icon-btn" data-a="ai-ren" data-id="${c.id}" aria-label="Rename">${ic('file', 14)}</button><button class="icon-btn" data-a="ai-del" data-id="${c.id}" aria-label="Delete">${ic('x', 14)}</button></div>`).join('') || '<p class="muted sm">No conversations yet.</p>';
  return `<div class="ca ${AI.histOpen ? 'hist-open' : ''}">
  <aside class="ca-hist"><button class="btn primary w" data-a="ai-new">${ic('plus', 15)} New chat</button><h4>History</h4>${hist}</aside>
  <section class="ca-main">
   <div class="ca-head"><div class="ca-title">${ic('bot', 22)}<div><b>ElectroCode AI</b><span class="muted sm">${esc(scopeTxt)}</span></div></div>
    <div class="ca-hbtn"><span class="chip sm ${S.aiEndpoint ? 'b' : ''}" title="${S.aiEndpoint ? 'LLM proxy configured' : 'No LLM proxy configured – answers are assembled from quoted clauses'}">${S.aiEndpoint ? 'LLM mode' : 'Extractive mode'}</span><span class="chip g sm">${D.clauses.length} clauses · ${D.docs.length} docs indexed</span><button class="btn sm ca-hb" data-a="ai-hist">${ic('clock', 14)} History</button><button class="btn sm" data-a="ai-new">${ic('plus', 14)} New chat</button></div></div>
   <div class="ca-log" id="chatLog">${conv && conv.msgs.length ? conv.msgs.map(aiMsgHTML).join('') : welcome}</div>
   <form class="ca-comp" data-form="ai">
    <div class="ca-filters"><label>Authority<select data-ai="auth"><option>All</option>${D.indexedAuth.map(a => `<option value="${a}" ${sc.auth === a ? 'selected' : ''}>${esc(authLabel(a))}</option>`).join('')}</select></label>
     <label>Subject<select data-ai="subj"><option value="">Any subject</option>${subjects.map(s => `<option ${sc.subj === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label></div>
    <div class="ca-in"><textarea id="aiq" rows="2" placeholder="Ask about an electrical code requirement…  (Enter to send, Shift+Enter for a new line)" aria-label="Message ElectroCode AI">${esc(AI.draft)}</textarea><button class="btn primary" type="submit" ${AI.busy ? 'disabled' : ''}>${AI.busy ? 'Working…' : ic('send', 14) + ' Send'}</button></div>
   </form>
  </section></div>`;
}

/* ---------- export / copy ---------- */
function aiQuestionFor(i) { const c = aiConv(); return c ? (c.msgs[i - 1] && c.msgs[i - 1].text) || '' : ''; }
function aiCitationList(m) { return m.ev.map((id, i) => { const c = clauseById(id); return `[${i + 1}] ${authLabel(c.auth)} – ${c.doc.title}, ${aiEdition(c.doc)}; ${c.sec ? 'Section ' + c.sec + '; ' : ''}${c.cl ? 'Clause ' + c.cl : AI_VERIFY + ' (clause)'}; ${c.pg ? 'Page ' + c.pg : AI_VERIFY + ' (page)'}`; }).join('\n'); }
function aiMarkdown(m, q) {
  const cs = m.ev.map(clauseById); let t = `## ${q}\n\n`;
  if (m.mode === 'llm') t += m.text + '\n\n';
  else if (m.rq.cmp) {
    t += `| Item | ${m.rq.auth.map(authLabel).join(' | ')} |\n|---|${m.rq.auth.map(() => '---').join('|')}|\n`;
    ['Requirement', 'Clause', 'Page'].forEach(k => { t += `| ${k} | ${m.rq.auth.map(a => { const id = (m.by[a] || [])[0], c = id && clauseById(id); if (!c) return AI_NA; return k === 'Requirement' ? c.t + ' – ' + aiShort(c.x, 200).replace(/\|/g, '/') : k === 'Clause' ? (c.cl || AI_VERIFY) : (c.pg || AI_VERIFY); }).join(' | ')} |\n`; });
    t += '\n';
  } else { const c = cs[0]; t += `**Requirement:** ${c.e || c.t} [1]\n\n> ${c.x}\n\n**Interpretation (not official text):** ${c.rec || '—'}\n\n`; }
  return t + `### Sources\n${aiCitationList(m)}\n\n_Evidence: ${m.level.l} – ${m.level.why}_\n_${DISCLAIMER}_\n`;
}
const aiCopy = (txt, msg) => navigator.clipboard?.writeText(txt).then(() => toast(msg), () => toast('Copy blocked by browser'));

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a^="ai-"]'); if (!el || el.dataset.a === 'ai-ask') return;
  const a = el.dataset.a, v = el.dataset.v, id = el.dataset.id, conv = aiConv(), m = conv && conv.msgs[+v];
  switch (a) {
    case 'ai-new': S.curConv = null; AI.histOpen = false; AI.draft = ''; persist(); render(); setTimeout(() => $('#aiq')?.focus(), 0); break;
    case 'ai-hist': AI.histOpen = !AI.histOpen; render(); break;
    case 'ai-conv': S.curConv = id; AI.histOpen = false; persist(); render(); break;
    case 'ai-del': S.convs = S.convs.filter(c => c.id !== id); if (S.curConv === id) S.curConv = null; persist(); render(); break;
    case 'ai-ren': { const c = S.convs.find(x => x.id === id); openModal(`<div class="pad"><h3>Rename conversation</h3><form data-form="ai-rename" data-id="${id}"><label>Title<input name="t" value="${esc(c.title)}" maxlength="80" required></label><button class="btn primary w" type="submit">Save</button></form></div>`, 'sm'); break; }
    case 'ai-sug': aiSend(v); break;
    case 'ai-retry': if (conv && m) { const q = aiQuestionFor(+v); aiFill(conv, m, q); } break;
    case 'ai-copy': if (m) aiCopy(aiMarkdown(m, aiQuestionFor(+v)), 'Answer copied with citations'); break;
    case 'ai-cites': if (m) aiCopy(aiCitationList(m), 'Citations copied'); break;
    case 'ai-export': if (m) {
      const md = aiMarkdown(m, aiQuestionFor(+v));
      try { const u = URL.createObjectURL(new Blob([md], { type: 'text/markdown' })), l = document.createElement('a'); l.href = u; l.download = 'electrocode-answer.md'; l.click(); URL.revokeObjectURL(u); } catch (x) { /* sandbox */ }
      aiCopy(md, 'Answer exported (also copied to the clipboard)');
    } break;
  }
});
document.addEventListener('change', e => {
  const k = e.target.dataset && e.target.dataset.ai; if (!k) return;
  S.aiScope[k] = e.target.value; persist(); const t = $('#aiq'); if (t) AI.draft = t.value; render();
});
document.addEventListener('keydown', e => {
  if (e.target.id === 'aiq' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); const t = e.target; AI.draft = ''; const q = t.value; t.value = ''; aiSend(q); }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  if (f.dataset.form === 'ai') { const t = $('#aiq'), q = t.value; t.value = ''; AI.draft = ''; aiSend(q); }
  if (f.dataset.form === 'ai-rename') { const c = S.convs.find(x => x.id === f.dataset.id), t = new FormData(f).get('t'); if (c && t) { c.title = String(t).trim().slice(0, 80); persist(); } closeModal(); render(); }
  if (f.dataset.form === 'ai-endpoint') {
    const u = String(new FormData(f).get('u') || '').trim();
    if (u && !/^https:\/\/|^http:\/\/localhost[:/]/.test(u)) { toast('Use an https:// URL (or http://localhost)'); return; }
    S.aiEndpoint = u; persist(); toast(u ? 'LLM proxy saved – ElectroCode AI will use it' : 'LLM proxy removed – extractive mode'); render();
  }
});
