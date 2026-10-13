/* Core: utils, icons, state, hybrid search, comparison engine, source-page renderer */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICON = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V21h16"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  compare: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  shield: '<path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  zap: '<path d="M13 2 3 14h8l-1 8 10-12h-8z"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 14h.01M15 14h.01"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><path d="M17 5a3.500 3.500 0 0 1 0 7M22 20c0-2.500-1.500-4.500-4-5.500"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  zin: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
  zout: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M8 11h6"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.700c.600.500 1 1.300 1 2.300h6c0-1 .400-1.800 1-2.300A7 7 0 0 0 12 2z"/>',
  flame: '<path d="M12 2s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-8z"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  send: '<path d="m22 2-11 11M22 2l-7 20-4-9-9-4z"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.700L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  home: '<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'
};
const ic = (n, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ''}</svg>`;

/* ---------------- state ---------------- */
const KEY = 'ech.v3';
const defaults = () => ({
  user: null, role: 'Admin', theme: 'light',
  saved: [
    { cid: 'dbc-G.4.4.2', project: 'p1', folder: 'LV Design', t: Date.now() - 864e5 * 2 },
    { cid: 'fls-6-T6.1-2', project: 'p1', folder: 'Emergency Lighting', t: Date.now() - 864e5 },
    { cid: 'sewa20-4.1.10', project: 'p2', folder: 'Current Project', t: Date.now() - 36e5 * 5 }
  ],
  projects: JSON.parse(JSON.stringify(D.projects)), folders: [...D.folders],
  filters: { auth: [], disc: [], subj: [] },
  recents: ['Emergency lighting lux requirement', 'Maximum voltage drop', 'Earthing requirements'],
  chat: [], docStatus: {}, extraDocs: [], review: JSON.parse(JSON.stringify(D.review)), users: JSON.parse(JSON.stringify(D.users)),
  cmp: { subject: 'emergency-lighting', cols: [...D.cmpDefaultCols] }
});
let S;
try { S = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = defaults(); }
S.saved = (S.saved || []).filter(s => D.clauses.some(c => c.id === s.cid));
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } };

/* ---------------- lookup helpers ---------------- */
const authById = id => D.authorities.find(a => a.id === id) || { id, name: id, color: '#64748b' };
const docById = id => [...D.docs, ...S.extraDocs].find(d => d.id === id);
const clauseById = id => D.clauses.find(c => c.id === id);
D.clauses.forEach(c => { c.doc = docById(c.d); c.auth = c.doc.auth; });
const authLabel = id => authById(id).name;
const authPill = id => `<span class="apill" style="--ac:${authById(id).color}">${esc(authLabel(id))}</span>`;
const docStatus = d => S.docStatus[d.id] || d.ds;
const fmtDate = s => s && s !== '—' ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const ago = t => { const m = Math.round((Date.now() - t) / 6e4); return m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
const pgText = c => c.pg ? (c.doc.id === 'addc05' ? 'PDF page ' : 'Page ') + c.pg : 'Ref. standard';
const trace = c => [authLabel(c.auth), c.doc.title, 'Section ' + c.sec, 'Clause ' + c.cl, pgText(c)];

/* ---------------- hybrid search (keyword + semantic + metadata) ---------------- */
const STOP = new Set('the a an of for in to and or is are what whats according requirement requirements shall be as per by with on at from how do does i need me show find give about under all any minimum maximum'.split(' '));
const AUTH_WORDS = { dewa: 'DEWA', sewa: 'SEWA', addc: 'ADDC', fls: 'FLS', 'fire & life': 'FLS', 'life safety': 'FLS', iec: 'IEC', nfpa: 'NFPA', cibse: 'CIBSE' };
const stem = w => { if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1); if (w.length > 6 && w.endsWith('ing')) w = w.slice(0, -3); return w.length > 4 && w.endsWith('e') ? w.slice(0, -1) : w; };
const tokenize = q => String(q).toLowerCase().replace(/[^a-z0-9.\s]/g, ' ').split(/\s+/).map(w => w.replace(/^\.+|\.+$/g, '')).filter(w => w && !STOP.has(w) && !AUTH_WORDS[w]).map(stem);
const detectAuth = q => { const l = String(q).toLowerCase(); return [...new Set(Object.keys(AUTH_WORDS).filter(k => new RegExp('(^|[^a-z])' + k.replace('&', '\\&') + '([^a-z]|$)').test(l)).map(k => AUTH_WORDS[k]))]; };
const CRE = D.concepts.map(g => g.map(t => t.length <= 3 ? new RegExp('(^|[^a-z0-9])' + t + '([^a-z0-9]|$)') : new RegExp(t.replace(/[-]/g, '[- ]'))));
const concepts = text => { const l = String(text).toLowerCase(); const out = new Set(); CRE.forEach((g, i) => { if (g.some(r => r.test(l))) out.add(i); }); return out; };
const inter = (a, b) => [...a].filter(x => b.has(x)).length;
D.clauses.forEach(c => {
  const full = [c.t, c.x, c.s.join(' ')].join(' ');
  c._tok = new Set(tokenize(full)); c._ttok = new Set(tokenize(c.t)); c._stok = new Set(tokenize(c.s.join(' ')));
  c._con = concepts(full); c._scon = concepts(c.s.join(' ') + ' ' + c.t);
});

function subjMatch(c, y) {
  const text = (c.s.join(' ') + ' ' + c.t).toLowerCase();
  return new RegExp('\\b' + y.toLowerCase().replace(/[^a-z ]/g, '') + 's?\\b').test(text);
}

function search(q, f = S.filters) {
  const qt = tokenize(q), qa = detectAuth(q), qc = concepts(q);
  if (!qt.length && !qa.length) return [];
  const numRef = (String(q).match(/\b\d+(\.\d+)+\b/g) || []);
  const out = [];
  for (const c of D.clauses) {
    if (f.auth.length && !f.auth.includes(c.auth)) continue;
    if (f.disc.length && !c.k.some(x => f.disc.includes(x))) continue;
    if (f.subj.length && !f.subj.some(y => subjMatch(c, y))) continue;
    const kw = qt.length ? qt.filter(t => c._tok.has(t)).length / qt.length : 0;
    const tk = qt.length ? qt.filter(t => c._ttok.has(t)).length / qt.length : 0;
    const sk = qt.length ? qt.filter(t => c._stok.has(t)).length / qt.length : 0;
    const kwS = Math.min(1, .5 * kw + .35 * tk + .15 * sk);
    const sem = qc.size && c._con.size ? inter(qc, c._con) / Math.sqrt(qc.size * c._con.size) : 0;
    const subj = qc.size ? Math.min(1, inter(qc, c._scon) / qc.size) : 0;
    const wantAuth = qa.length ? qa : f.auth;
    const authS = wantAuth.length ? (wantAuth.includes(c.auth) ? 1 : 0) : .5;
    const exact = numRef.includes(c.cl) ? 1 : (String(q).toLowerCase().includes(c.t.toLowerCase()) ? 1 : 0);
    const ver = c.doc.status === 'Superseded' ? .4 : 1;
    const off = ['Published', 'Verified'].includes(docStatus(c.doc)) ? 1 : .6;
    if (kwS === 0 && sem === 0 && !exact) continue;
    const parts = { exact: .07 * exact, subject: .22 * subj, authority: .12 * authS, version: .08 * ver, semantic: .18 * sem, official: .05 * off, keyword: .28 * kwS };
    const raw = Object.values(parts).reduce((a, b) => a + b, 0);
    if (raw < .3) continue;
    out.push({ c, raw, kwS, kw, sem, parts, pct: Math.min(99, Math.round(raw * 108)) });
  }
  // near-ties (within 1%) keep document order so the lead clause of a section ranks first
  return out.sort((a, b) => (Math.round(b.raw * 100) - Math.round(a.raw * 100)) || D.clauses.indexOf(a.c) - D.clauses.indexOf(b.c));
}

const hilite = (text, q) => {
  let h = esc(text);
  [...new Set(tokenize(q))].filter(t => t.length > 2).forEach(t => { h = h.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*)', 'gi'), '<mark>$1</mark>'); });
  return h;
};

/* ---------------- comparison engine ---------------- */
/* leading number + unit, e.g. "≤ 1 Ω", "2.5%", "1,800 W" → {n, u}; null when the value is not a plain quantity */
const numUnit = v => { const m = String(v).replace(/,/g, '').match(/^[^\d]{0,3}(\d+(?:\.\d+)?)\s*(%|[A-Za-zΩ²]+)?/); return m ? { n: parseFloat(m[1]), u: (m[2] || '').toLowerCase() } : null; };
function classify(cells) {
  const sp = cells.filter(Boolean);
  if (sp.length < 2) return sp.length ? 'single' : 'na';
  const norm = sp.map(x => x.val.toLowerCase().trim());
  if (new Set(norm).size === 1) return 'same';
  // “conflict” only when every value is a quantity in the same unit and they differ by 5× or more
  const q = sp.map(x => numUnit(x.val));
  if (q.every(x => x && x.n > 0 && x.u) && new Set(q.map(x => x.u)).size === 1 && Math.max(...q.map(x => x.n)) / Math.min(...q.map(x => x.n)) >= 5) return 'conflict';
  return 'different';
}
const STATUS = { same: ['🟢', 'Same'], different: ['🟡', 'Different'], conflict: ['🔴', 'Conflict'], na: ['⚪', 'Not specified'], single: ['⚪', 'Single source'] };
function compareTable(subjectId, cols = S.cmp.cols) {
  const cfg = D.compare[subjectId];
  return cfg.attrs.map(a => {
    const cells = cols.map(au => { const c = D.clauses.find(c => c.auth === au && c.a && c.a[a.k]); return c ? { c, val: c.a[a.k] } : null; });
    return { attr: a, cells, status: classify(cells) };
  });
}
const compareFor = c => { const k = Object.keys(c.a || {}); return Object.keys(D.compare).find(id => D.compare[id].attrs.some(a => k.includes(a.k))); };

/* ---------------- source page / figure renderer (illustrative render) ---------------- */
function wrap(text, n) {
  const words = String(text).split(' '), lines = []; let cur = '';
  words.forEach(w => { if ((cur + ' ' + w).trim().length > n) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur); return lines;
}
function figure(kind, c, y) {
  const g = (inner) => `<g transform="translate(60 ${y})">${inner}</g>`;
  const lbl = (x, yy, t, a = 'middle') => `<text x="${x}" y="${yy}" font-size="10" fill="#334155" text-anchor="${a}" font-family="Inter,Arial">${t}</text>`;
  if (kind === 'dbclear') return g(`<rect width="500" height="190" fill="#f8fafc" stroke="#cbd5e1"/><rect x="170" y="10" width="160" height="26" fill="#1e3a8a"/>${lbl(250, 27, '<tspan fill="#fff">DISTRIBUTION BOARD</tspan>')}<rect x="150" y="36" width="200" height="110" fill="#2f6bff" opacity=".1" stroke="#2f6bff" stroke-dasharray="6 4"/>${lbl(250, 98, 'CLEAR WORKING SPACE')}<path d="M370 36v110" stroke="#0f172a"/><path d="M366 36h8M366 146h8" stroke="#0f172a"/>${lbl(404, 94, c.a?.front_clear || '1000 mm', 'start')}${lbl(250, 176, 'Fig. – Working space plan (illustrative)')}`);
  if (kind === 'earthing') return g(`<rect width="500" height="190" fill="#f8fafc" stroke="#cbd5e1"/><path d="M0 60h500" stroke="#92400e" stroke-width="2"/><path d="M250 30V60M250 60v100" stroke="#0f172a" stroke-width="3"/><path d="M230 160h40" stroke="#0f172a" stroke-width="3"/><circle cx="250" cy="28" r="6" fill="#e5484d"/><path d="M250 60l-90 20M250 60l90 20" stroke="#14a37f" stroke-width="2"/>${lbl(250, 20, 'Earth bar / test link', 'middle')}${lbl(400, 100, 'Earth electrode', 'start')}${lbl(250, 182, 'Fig. – Earthing arrangement (illustrative)')}`);
  if (kind === 'emlayout') return g(`<rect width="500" height="190" fill="#f8fafc" stroke="#cbd5e1"/><rect x="20" y="70" width="460" height="50" fill="#e2e8f0"/>${[70, 170, 270, 370].map(x => `<circle cx="${x}" cy="95" r="7" fill="#f59e0b"/><circle cx="${x}" cy="95" r="26" fill="#f59e0b" opacity=".15"/>`).join('')}<rect x="440" y="78" width="36" height="16" fill="#14a37f"/>${lbl(458, 90, '<tspan fill="#fff">EXIT</tspan>')}${lbl(250, 150, '1 lux min. on escape-route centre line')}${lbl(250, 182, 'Fig. – Emergency lighting layout (illustrative)')}`);
  if (kind === 'genroom') return g(`<rect width="500" height="190" fill="#f8fafc" stroke="#cbd5e1"/><rect x="150" y="50" width="200" height="80" fill="#e2e8f0" stroke="#475569"/>${lbl(250, 94, 'GENERATOR')}<path d="M20 90h110" stroke="#2f6bff" stroke-width="3" marker-end="url(#ar)"/><path d="M370 90h110" stroke="#e5484d" stroke-width="3"/>${lbl(75, 80, 'Air inlet louvre')}${lbl(425, 80, 'Discharge louvre')}${lbl(250, 182, 'Fig. – Generator room ventilation (illustrative)')}`);
  return '';
}
function pageSVG(c, opt = {}) {
  const lines = wrap(`${c.cl}  ${c.x}`, 62), by = 285, lh = 17;
  const bh = lines.length * lh + 18;
  const fake = (y, n, w = 480) => Array.from({ length: n }, (_, i) => `<rect x="60" y="${y + i * 14}" width="${i === n - 1 ? w * .6 : w}" height="6" rx="3" fill="#e2e8f0"/>`).join('');
  const fy = by + bh + 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 800" class="pagesvg" role="img" aria-label="Illustrative render of ${esc(c.doc.short)} page ${c.pg}">
  <rect width="620" height="800" fill="#fff"/><rect width="620" height="52" fill="#0b1a33"/>
  <text x="60" y="32" fill="#fff" font-size="13" font-weight="700" font-family="Inter,Arial">${esc(c.doc.title)}</text>
  <text x="560" y="32" fill="#9fb3d1" font-size="11" text-anchor="end" font-family="Inter,Arial">v${esc(c.doc.version)}</text>
  <text x="60" y="100" font-size="20" font-weight="700" fill="#0f172a" font-family="Inter,Arial">${esc(c.sec)}  ${esc(c.t.split(' – ')[0])}</text>
  <rect x="60" y="112" width="60" height="3" fill="${authById(c.auth).color}"/>
  ${fake(140, 6)}<text x="60" y="${by - 12}" font-size="11" fill="#64748b" font-family="Inter,Arial">${esc(c.cl)} ${esc(c.t)}</text>
  ${opt.hl === false ? '' : `<rect x="50" y="${by}" width="520" height="${bh}" rx="4" fill="#fde047" fill-opacity=".35" stroke="#eab308" stroke-width="1.5"/>`}
  ${lines.map((l, i) => `<text x="60" y="${by + 22 + i * lh}" font-size="12.5" fill="#0f172a" font-family="Inter,Arial">${esc(l)}</text>`).join('')}
  ${fake(fy, 4)}${c.fig ? figure(c.fig, c, fy + 70) : fake(fy + 70, 12)}
  <text x="310" y="772" font-size="11" fill="#64748b" text-anchor="middle" font-family="Inter,Arial">Page ${c.pg || '—'}</text>
  <text transform="rotate(-28 310 420)" x="310" y="430" font-size="44" font-weight="800" fill="#0b1a33" fill-opacity=".05" text-anchor="middle" font-family="Inter,Arial">DEMO RENDER</text></svg>`;
}

/* real page image (rendered from the supplied PDF) – falls back to the generated placeholder */
function pageView(c) { return c.img ? '<img class="pageimg" src="' + c.img + '" alt="Source page ' + c.pg + ' – ' + esc(c.doc.short) + '">' : pageSVG(c); }
