/* Compare Codes – free-text comparison across authorities */
function compareSearchBox(q) {
  return `<form class="sbox" data-form="compare-search" autocomplete="off">${ic('search', 18)}<input id="cq" name="cq" value="${esc(q)}" placeholder="Type anything to compare across codes – e.g. earthing resistance, DB clearance, RCD, transformer room…" aria-label="Compare search"><button class="btn primary" type="submit">Compare</button></form>`;
}

function freeCompare(q, cols) {
  const res = search(q, { auth: [], disc: [], subj: [] });
  const by = a => res.filter(r => r.c.auth === a).slice(0, 3);
  const found = cols.filter(a => by(a).length).length;
  const card = x => `<article class="fc-card"><div class="row between"><b>${esc(x.c.t)}</b><span class="chip sm">${x.pct}%</span></div>
    <p class="sm">${hilite(x.c.x.length > 330 ? x.c.x.slice(0, 330) + '…' : x.c.x, q)}</p>
    ${x.c.a ? `<p class="fc-val sm">${Object.values(x.c.a).slice(0, 3).map(v => esc(v)).join(' · ')}</p>` : ''}
    <span class="src sm">${esc(x.c.doc.short)} · cl. ${esc(x.c.cl)} · ${esc(pgText(x.c))}</span>
    <div class="rc-act"><button class="btn sm primary" data-a="src" data-id="${x.c.id}">${ic('eye', 13)} View source</button><button class="btn sm" data-a="copy" data-id="${x.c.id}">${ic('copy', 13)} Copy</button></div></article>`;
  return `<div class="page-h"><h2>Compare Codes</h2><p class="muted">Best matching clauses per authority for “${esc(q)}”.</p></div>${compareSearchBox(q)}
  <div class="card cmp-ctl"><div class="chips"><span class="muted sm">Authorities</span>${D.authorities.filter(a => a.indexed).map(a => `<button class="chip ${cols.includes(a.id) ? 'on' : ''}" data-a="cmp-col" data-v="${a.id}">${a.name}</button>`).join('')}</div>
  <div class="legend"><span><b>${found}</b> of ${cols.length} selected authorities have matching clauses</span><a class="link" href="#/compare">Back to ready-made subjects</a></div></div>
  <div class="fc-grid" style="--n:${cols.length}">${cols.map(a => { const r = by(a); return `<section class="fc-col" style="--ac:${authById(a).color}"><header>${authPill(a)} <span class="muted sm">${r.length ? r.length + (r.length > 1 ? ' matches' : ' match') : ''}</span></header>${r.length ? r.map(card).join('') : '<div class="fc-none">⚪ Not specified in the indexed clauses of this authority.</div>'}</section>`; }).join('')}</div>
  <p class="warn sm">${ic('alert', 14)} Matches are ranked by relevance and may not answer exactly the same question – open each source to compare. ${DISCLAIMER}</p>`;
}

/* Space program – SEWA transformer room checklist (supplied HTML, embedded) */
function spaceView() {
  return `<div class="page-h"><h2>Space program</h2><p class="muted">SEWA transformer room checklist with 3D drawings – tick items as you check them. Based on SEWA Booklet 2020 section 4.1.</p></div><iframe class="space-frame" src="space-program.html" title="SEWA Transformer Room Checklist" loading="lazy"></iframe>`;
}

function dewaSubView() {
  return `<div class="page-h"><h2>DEWA substation</h2><p class="muted">DEWA substation / transformer room checklist with 3D drawings – tick items as you check them. Based on Dubai Building Code 2021, Part G.7.</p></div><iframe class="space-frame" src="dewa-substation.html" title="DEWA Substation Checklist" loading="lazy"></iframe>`;
}