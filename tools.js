/* Engineering tools – indicative calculators. Always verify against authority requirements. */
const CABLE = [ // mm², Iz (A, 3-ph XLPE Cu clipped direct, indicative), mV/A/m (3-ph, indicative)
  [2.5, 34, 15], [4, 46, 9.5], [6, 59, 6.4], [10, 81, 3.8], [16, 107, 2.4], [25, 138, 1.5], [35, 171, 1.1], [50, 209, .82],
  [70, 269, .57], [95, 328, .42], [120, 382, .34], [150, 441, .28], [185, 506, .23], [240, 599, .19], [300, 693, .17]];
const BREAKERS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000];
const TX = [100, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150];
const GEN = [20, 30, 40, 60, 80, 100, 125, 160, 200, 250, 320, 400, 500, 650, 800, 1000, 1250, 1500, 2000];
/* Space types for the lux calculator – built from the indexed CIBSE SLL Code (2012) Chapter 2 schedule */
const SPACE_GROUPS = {}, SPACE_BY_REF = {};
(function () {
  const fl = (v, k) => { const m = new RegExp(k + ' ([\\d.]+|–)').exec(v); return m ? m[1].replace(/\.$/, '') : '–'; };
  D.clauses.filter(c => c.d === 'cibse12' && c.ch === '2').forEach(c => {
    const em = /Ēm (\d+) lx/.exec(c.x); const g = /^Table ([\d.]+) \((.+?)\) – (.*?): maintained/.exec(c.x); if (!em || !g) return;
    const rec = { ref: c.cl, em: +em[1], ugr: fl(c.x, 'UGRL'), uo: fl(c.x, 'Uo'), ra: fl(c.x, 'Ra'), cid: c.id, label: c.cl + '  ' + g[3].replace(/[•\s]+$/, '') };
    SPACE_BY_REF[c.cl] = rec; (SPACE_GROUPS['Table ' + g[1] + ' – ' + g[2]] = SPACE_GROUPS['Table ' + g[1] + ' – ' + g[2]] || []).push({ v: c.cl, l: rec.label });
  });
  SPACE_BY_REF.FLS = { ref: 'UAE FLS ch.6', em: 1.1, ugr: '–', uo: '–', ra: '–', label: 'Emergency escape route (UAE Fire Code – min. 1.1 lux, any point)' };
  SPACE_GROUPS['UAE Fire Code – emergency lighting'] = [{ v: 'FLS', l: SPACE_BY_REF.FLS.label }];
})();
const r = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const iFromKw = (kw, v, pf, ph) => ph == 3 ? kw * 1000 / (Math.sqrt(3) * v * pf) : kw * 1000 / (v * pf);
const vdCalc = (I, L, mv, ph, v) => (ph == 3 ? 1 : 2 / Math.sqrt(3)) * mv * I * L / 1000 / v * 100;

const TOOLS = [
  { id: 'cable', name: 'Cable Size Calculator', ic: 'zap', std: 'IEC 60364-5-52 (selection & erection – current-carrying capacity & voltage drop)', cmp: 'voltage-drop',
    f: [['kw', 'Load (kW)', 45], ['v', 'Voltage (V)', 400], ['pf', 'Power factor', .9], ['ph', 'Phases', 3, ['3', '1']], ['len', 'Length (m)', 80], ['der', 'Derating factor', .8], ['lim', 'Voltage-drop limit (%)', 4]],
    run: v => { const I = iFromKw(v.kw, v.v, v.pf, v.ph); const ok = CABLE.find(c => c[1] * v.der >= I && vdCalc(I, v.len, c[2], v.ph, v.v) <= v.lim); const c0 = CABLE.find(c => c[1] * v.der >= I);
      return { rows: [['Design current Ib', r(I) + ' A'], ['Required Iz (Ib ÷ derating)', r(I / v.der) + ' A'], ['Smallest size by current', c0 ? c0[0] + ' mm²' : 'n/a'], ['Selected size (current + voltage drop)', ok ? ok[0] + ' mm² Cu XLPE' : 'Exceeds table – use parallel runs', 'ok'], ['Voltage drop', ok ? r(vdCalc(I, v.len, ok[2], v.ph, v.v)) + ' % (' + r(vdCalc(I, v.len, ok[2], v.ph, v.v) * v.v / 100) + ' V)' : '—']] }; } },
  { id: 'vd', name: 'Voltage Drop Calculator', ic: 'zap', std: 'IEC 60364-5-52 Annex G; authority limits per Compare Codes', cmp: 'voltage-drop',
    f: [['I', 'Current (A)', 63], ['len', 'Length (m)', 60], ['size', 'Cable size (mm²)', 16, CABLE.map(c => String(c[0]))], ['ph', 'Phases', 3, ['3', '1']], ['v', 'Voltage (V)', 400], ['lim', 'Limit (%)', 4]],
    run: v => { const mv = CABLE.find(c => c[0] == v.size)[2]; const p = vdCalc(v.I, v.len, mv, v.ph, v.v); return { rows: [['mV/A/m (indicative)', mv], ['Voltage drop', r(p * v.v / 100) + ' V'], ['Voltage drop %', r(p) + ' %', p <= v.lim ? 'ok' : 'bad'], ['Result', p <= v.lim ? 'PASS – within ' + v.lim + '%' : 'FAIL – exceeds ' + v.lim + '%', p <= v.lim ? 'ok' : 'bad']] }; } },
  { id: 'breaker', name: 'Breaker Sizing', ic: 'shield', std: 'IEC 60364-4-43 (Ib ≤ In ≤ Iz)', cmp: null,
    f: [['Ib', 'Design current Ib (A)', 52], ['Iz', 'Cable capacity Iz (A)', 81]],
    run: v => { const In = BREAKERS.find(b => b >= v.Ib); const ok = In && In <= v.Iz; return { rows: [['Next standard rating ≥ Ib', In ? In + ' A' : 'n/a'], ['Check Ib ≤ In ≤ Iz', ok ? 'PASS' : 'FAIL – increase cable size', ok ? 'ok' : 'bad'], ['Overload current I2 (1.45·In)', In ? r(1.45 * In) + ' A' : '—'], ['I2 ≤ 1.45·Iz', In && 1.45 * In <= 1.45 * v.Iz ? 'PASS' : 'FAIL', In && In <= v.Iz ? 'ok' : 'bad']] }; } },
  { id: 'load', name: 'Load Calculation', ic: 'layers', std: 'IEC 60364-8-1 / authority demand-factor tables', cmp: null,
    f: [['kw', 'Connected load (kW)', 320], ['df', 'Demand factor', .75], ['div', 'Diversity factor', .9], ['pf', 'Power factor', .9], ['v', 'Voltage (V)', 400]],
    run: v => { const md = v.kw * v.df * v.div; return { rows: [['Maximum demand', r(md) + ' kW', 'ok'], ['Apparent power', r(md / v.pf) + ' kVA'], ['Demand current', r(iFromKw(md, v.v, v.pf, 3)) + ' A']] }; } },
  { id: 'tx', name: 'Transformer Sizing', ic: 'layers', std: 'IEC 60076; authority substation rules', cmp: null,
    f: [['kva', 'Maximum demand (kVA)', 780], ['gr', 'Future growth (%)', 20], ['ld', 'Max loading (%)', 80]],
    run: v => { const req = v.kva * (1 + v.gr / 100) / (v.ld / 100); const s = TX.find(t => t >= req); return { rows: [['Required rating', r(req) + ' kVA'], ['Selected standard size', s ? s + ' kVA' : 'Use multiple units', 'ok']] }; } },
  { id: 'gen', name: 'Generator Sizing', ic: 'zap', std: 'ISO 8528-1 / authority standby rules', cmp: null,
    f: [['kw', 'Essential load (kW)', 280], ['pf', 'Load power factor', .85], ['mot', 'Largest motor start (kVA)', 150], ['mg', 'Margin (%)', 10]],
    run: v => { const run = v.kw / v.pf * (1 + v.mg / 100); const step = (v.kw / v.pf) * .6 + v.mot; const need = Math.max(run, step / 1.5); const kva = GEN.find(g => g * 1.25 >= need) ; return { rows: [['Running load incl. margin', r(run) + ' kVA'], ['Step-load requirement', r(step) + ' kVA'], ['Selected set (kW prime)', kva ? kva + ' kW ≈ ' + r(kva / .8) + ' kVA' : 'Use paralleled sets', 'ok']], note: 'Step-load check is simplified; confirm with supplier transient data.' }; } },
  { id: 'ups', name: 'UPS Sizing', ic: 'cpu', std: 'IEC 62040-3', cmp: null,
    f: [['kw', 'Critical load (kW)', 80], ['pf', 'Load PF', .9], ['eff', 'UPS efficiency', .94], ['min', 'Autonomy (min)', 15], ['g', 'Growth (%)', 20]],
    run: v => { const kva = v.kw * (1 + v.g / 100) / v.pf; const kwh = v.kw * (1 + v.g / 100) / v.eff * v.min / 60; return { rows: [['Required UPS rating', r(kva) + ' kVA', 'ok'], ['Battery energy (usable)', r(kwh) + ' kWh'], ['With 25% ageing margin', r(kwh * 1.25) + ' kWh']] }; } },
  { id: 'pf', name: 'Power Factor Correction', ic: 'bolt', std: 'IEC 60831 / authority PF requirement', cmp: null,
    f: [['kw', 'Active power (kW)', 400], ['p1', 'Existing PF', .78], ['p2', 'Target PF', .95]],
    run: v => { const q = v.kw * (Math.tan(Math.acos(v.p1)) - Math.tan(Math.acos(v.p2))); return { rows: [['Capacitor bank required', r(q) + ' kvar', 'ok'], ['Suggested stages', Math.ceil(q / 50) + ' × 50 kvar']] }; } },
  { id: 'lux', name: 'Lux Calculator (Lumen Method)', ic: 'bulb', std: 'CIBSE SLL Code for Lighting (2012) / BS EN 12464-1 – Chapter 2 schedule', cmp: null,
    f: [['sp', 'Space type (CIBSE SLL 2012 Chapter 2)', '2.30.2', SPACE_GROUPS], ['area', 'Area (m²)', 120], ['lm', 'Luminaire lumens (lm)', 3600], ['uf', 'Utilisation factor', .6], ['mf', 'Maintenance factor', .8]],
    run: v => { const sp = SPACE_BY_REF[v.sp] || SPACE_BY_REF['2.30.2']; const E = sp.em; const n = Math.ceil(E * v.area / (v.lm * v.uf * v.mf)); const ach = n * v.lm * v.uf * v.mf / v.area; const c = clauseById(sp.cid); return { rows: [['Space type', sp.label], ['Target maintained illuminance Ēm', E + ' lux'], ['UGR limit / uniformity Uo / min. Ra', sp.ugr + ' / ' + sp.uo + ' / ' + sp.ra], ['Source', c ? c.doc.short + ', Table ' + c.sec.replace('Table ', '') + ', ref. ' + c.cl + ', p.' + c.pg : sp.ref], ['Luminaires required', n, 'ok'], ['Achieved illuminance', r(ach, 0) + ' lux'], ['Spacing (square grid)', r(Math.sqrt(v.area / n)) + ' m']], note: 'Target values are the maintained illuminance in the CIBSE schedule; check the specific requirements in the clause (open it from Search).' }; } },
  { id: 'sc', name: 'Short Circuit Calculator', ic: 'alert', std: 'IEC 60909 (simplified transformer-limited fault level)', cmp: null,
    f: [['kva', 'Transformer (kVA)', 1000], ['z', 'Impedance (%)', 6], ['v', 'Secondary voltage (V)', 400]],
    run: v => { const If = v.kva * 1000 / (Math.sqrt(3) * v.v); const Isc = If / (v.z / 100); return { rows: [['Full-load current', r(If) + ' A'], ['Prospective fault current (infinite source)', r(Isc / 1000) + ' kA', 'ok'], ['Suggested breaker Icu ≥', [25, 36, 50, 65, 85, 100].find(k => k >= Isc / 1000) + ' kA']], note: 'Ignores source and cable impedance – conservative.' }; } },
  { id: 'conduit', name: 'Conduit Fill Calculator', ic: 'layers', std: 'IEC 61386 / IEC 60364-5-52 – fill ≤ 40% for >2 cables', cmp: null,
    f: [['id', 'Conduit internal Ø (mm)', 25, ['16', '20', '25', '32', '40', '50', '63']], ['od', 'Cable outer Ø (mm)', 6.5], ['n', 'Number of cables', 6]],
    run: v => { const fill = v.n * Math.PI * (v.od / 2) ** 2 / (Math.PI * (v.id / 2) ** 2) * 100; const lim = v.n > 2 ? 40 : 53; return { rows: [['Fill ratio', r(fill) + ' %', fill <= lim ? 'ok' : 'bad'], ['Limit', lim + ' %'], ['Result', fill <= lim ? 'PASS' : 'FAIL – use larger conduit', fill <= lim ? 'ok' : 'bad']] }; } },
  { id: 'vdx', name: 'Voltage Drop Excel Generator', ic: 'download', std: 'IEC 60364-5-52 – schedule export (CSV opens in Excel)', cmp: 'voltage-drop', custom: true }
];
TOOLS.forEach(t => { if (t.id === 'cable') t.f.forEach(x => 0); });

function selOpts(o, d) {
  const opt = x => { const v = x && x.v !== undefined ? x.v : x, l = x && x.l !== undefined ? x.l : x; return `<option value="${esc(v)}" ${String(v) === String(d) ? 'selected' : ''}>${esc(l)}</option>`; };
  return Array.isArray(o) ? o.map(opt).join('') : Object.entries(o).map(([g, arr]) => `<optgroup label="${esc(g)}">${arr.map(opt).join('')}</optgroup>`).join('');
}
function toolForm(t) {
  if (t.custom) return `<div class="vdx">${vdxTable()}<div class="row gap"><button class="btn" data-a="vdx-add">${ic('plus', 14)} Add circuit</button><button class="btn primary" data-a="vdx-dl">${ic('download', 14)} Download Excel (.csv)</button></div></div>`;
  return `<div class="form-grid">${t.f.map(([k, l, d, o]) => o ? `<label>${l}<select data-tool-in="${k}">${selOpts(o, d)}</select></label>` : `<label>${l}<input data-tool-in="${k}" type="number" step="any" value="${d}"></label>`).join('')}</div>`;
}
let VDX = [{ n: 'DB-01 Feeder', I: 120, L: 45, s: 50 }, { n: 'DB-02 Feeder', I: 85, L: 70, s: 35 }, { n: 'Lighting L1', I: 16, L: 40, s: 4 }];
function vdxRows() { return VDX.map(x => { const mv = (CABLE.find(c => c[0] == x.s) || CABLE[0])[2]; const p = vdCalc(x.I, x.L, mv, 3, 400); return { ...x, mv, p }; }); }
function vdxTable() {
  return `<table class="tbl"><thead><tr><th>Circuit</th><th>I (A)</th><th>L (m)</th><th>Size (mm²)</th><th>VD %</th><th>Status</th><th></th></tr></thead><tbody>${vdxRows().map((x, i) => `<tr><td><input data-vdx="${i}.n" value="${esc(x.n)}"></td><td><input type="number" data-vdx="${i}.I" value="${x.I}"></td><td><input type="number" data-vdx="${i}.L" value="${x.L}"></td><td><select data-vdx="${i}.s">${CABLE.map(c => `<option ${c[0] == x.s ? 'selected' : ''}>${c[0]}</option>`).join('')}</select></td><td>${r(x.p)}</td><td><span class="chip ${x.p <= 4 ? 'g' : 'r'}">${x.p <= 4 ? 'OK' : 'Exceeds 4%'}</span></td><td><button class="icon-btn" data-a="vdx-del" data-id="${i}" aria-label="Remove">${ic('trash', 14)}</button></td></tr>`).join('')}</tbody></table>`;
}
function vdxCSV() {
  const rows = [['Circuit', 'Current (A)', 'Length (m)', 'Size (mm2)', 'mV/A/m', 'Voltage (V)', 'VD (V)', 'VD (%)', 'Limit (%)', 'Status']];
  vdxRows().forEach((x, i) => rows.push([x.n, x.I, x.L, x.s, x.mv, 400, r(x.p * 4), r(x.p), 4, x.p <= 4 ? 'OK' : 'EXCEEDS']));
  rows.push([], ['Indicative values – verify cable data and authority limits before use. Generated by ElectroCode Hub.']);
  return rows.map(r => r.map(c => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
}
function toolRun(t, root) {
  if (t.custom) return;
  const v = {}; $$('[data-tool-in]', root).forEach(el => { v[el.dataset.toolIn] = el.tagName === 'SELECT' && isNaN(el.value) ? el.value : parseFloat(el.value) || (el.tagName === 'SELECT' ? el.value : 0); });
  let res; try { res = t.run(v); } catch (e) { res = { rows: [['Error', 'Check inputs', 'bad']] }; }
  $('#toolOut', root).innerHTML = `<table class="tbl res"><tbody>${res.rows.map(([a, b, f]) => `<tr><td>${a}</td><td class="${f || ''}"><b>${b}</b></td></tr>`).join('')}</tbody></table>${res.note ? `<p class="muted sm">${res.note}</p>` : ''}`;
}
