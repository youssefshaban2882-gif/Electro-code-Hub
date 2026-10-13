/* Builds the indexed library from the documents supplied by the user (js/real/*.js).
 * ctx: all clause text is transcribed/extracted from the supplied PDFs; page images are rendered from those PDFs. */
D.docs = [
  { id: 'dbc21', auth: 'DEWA', title: 'Dubai Building Code – Part G: Incoming utilities (DEWA electrical requirements)', short: 'DBC 2021 Part G', version: '2021 Edition', rev: 'Part G', pub: '2021-01-01', rdate: '—', eff: '—', status: 'As supplied', pages: 92, ds: 'Indexed', img: 'dbc', pad: 2, src: 'Dubai Building Code_English_2021 Edition_compressed.pdf', scope: 'G.4 electrical systems, G.5 EV charging, G.6 solar PV, G.7 substations and MV, G.8 LPG, G.9.1 water metering, G.11.1 telecoms. District cooling (G.10) and detailed telecom sub-sections (G.11.2 onward) are not indexed. Page references are the printed Part G page numbers (G 16 …).' },
  { id: 'sewa20', auth: 'SEWA', title: 'Electric Booklet – Regulations for Electrical Installations', short: 'SEWA Booklet 2020', version: '2020', rev: '—', pub: '2020-01-01', rdate: '—', eff: '—', status: 'As supplied', pages: 222, ds: 'Indexed', img: 'sewa', pad: 3, src: 'S1-SWEA-Electric-booklet_complete 2020.pdf', scope: 'Sections 1, 3–14 (selected clauses) and Appendix A tables 1–25, 31–40 (cable ampacity tables summarised – read values in the page image). Section 2 (definitions) and the Appendix B figures are not indexed. Page references are the printed page numbers; images are PDF pages (printed page + 10).' },
  { id: 'addc05', auth: 'ADDC', title: 'The Electricity Distribution Code', short: 'ADDC Dist. Code v3.0', version: 'Version 3.0', rev: 'EN-806', pub: '2005-11-30', rdate: '2005-11-30', eff: '—', status: 'As supplied', pages: 89, ds: 'Indexed', img: 'addc', pad: 2, src: 'ADDC - The Electricity Distribution Code.pdf', scope: 'Utility network code (planning & connection). Not a building wiring regulation; selected DPCC clauses.' },
  { id: 'fls18', auth: 'FLS', title: 'UAE Fire & Life Safety Code of Practice – Chapters 5, 6 and 7', short: 'UAE FLS 2018', version: 'September 2018', rev: 'CDGH-OP-25', pub: '2018-09-01', rdate: '—', eff: '—', status: 'As supplied', pages: 39, ds: 'Indexed', img: 'fls', pad: 2, src: 'UAE FIRE CODE_ENG_SEPTEMBER_2018.pdf (extract)', scope: 'Chapter 5 Exit Signs, 6 Emergency Lighting, 7 Emergency Voice Evacuation Systems. Page references are the code’s printed pages (“Page N of 1348”); printed pages 386, 393, 398, 399 are not in the supplied extract.' },
  { id: 'cibse12', auth: 'CIBSE', title: 'SLL Code for Lighting (2012)', short: 'CIBSE SLL 2012', version: '2012', rev: '—', pub: '2012-01-01', rdate: '—', eff: '—', status: 'As supplied', pages: 342, ds: 'Indexed', img: 'cibse', pad: 3, src: 'Code for Lighting CIBSE (NEW 2012).PDF', scope: 'Schedule of lighting requirements: Chapter 2 tables 2.5–2.57 (indoor workplaces, per BS EN 12464-1) and Chapter 3 tables 3.5–3.19 (outdoor). Design guidance chapters, calculations and Tables 2.1–2.4 are not indexed. Page references are the printed page numbers; images are PDF pages (printed page + 11).' }
];
D.docs.forEach(d => { d.indexed = D.real.filter(c => c.d === d.id).length; });

D.clauses = D.real.map(c => Object.assign({ a: null }, c));
D.clauses.forEach(c => { const d = D.docs.find(x => x.id === c.d); c.img = c.f ? `pages/${d.img}/p-${String(c.f).padStart(d.pad, '0')}.jpg` : null; });

D.authorities.forEach(a => { a.indexed = D.docs.some(d => d.auth === a.id); });
D.indexedAuth = D.authorities.filter(a => a.indexed).map(a => a.id);

/* comparison matrix – keys match clause.a attributes */
D.compare = {
  'emergency-lighting': { name: 'Emergency Lighting', attrs: [{ k: 'min_lux', l: 'Minimum lux (floor level, egress path)' }, { k: 'avg_lux', l: 'Average initial lux' }, { k: 'end_lux', l: 'Lux at end of duration' }, { k: 'duration', l: 'Duration' }, { k: 'location', l: 'Where required' }, { k: 'el_standard', l: 'Luminaire standard' }, { k: 'testing', l: 'Testing' }] },
  'voltage-drop': { name: 'Voltage Drop', attrs: [{ k: 'vd_light', l: 'Lighting circuits' }, { k: 'vd_power', l: 'Power circuits' }] },
  'db-switchgear': { name: 'DBs & Switchgear', attrs: [{ k: 'front_clear', l: 'Working space in front of panels' }, { k: 'db_height', l: 'Mounting height (top of DB)' }, { k: 'db_spare', l: 'Spare ways' }, { k: 'db_dedicated_room', l: 'Dedicated room' }, { k: 'fdb_capacity', l: 'FDB capacity' }, { k: 'submain_max', l: 'Sub-main limit' }] },
  'earthing': { name: 'Earthing', attrs: [{ k: 'earth_res', l: 'Earth electrode resistance' }, { k: 'earth_rod_depth', l: 'Electrode depth' }, { k: 'earth_pit', l: 'Earth pit' }, { k: 'multi_electrode', l: 'Number of electrodes' }, { k: 'earth_spacing', l: 'Electrode spacing' }, { k: 'disconnection_time', l: 'Earth-fault disconnection time' }] },
  'rcd-protection': { name: 'RCD Protection', attrs: [{ k: 'rcd_sockets', l: 'Socket-outlet circuits' }, { k: 'rcd_fixed', l: 'Lighting / fixed equipment' }] },
  'circuits-sockets': { name: 'Circuits & Sockets', attrs: [{ k: 'lighting_circuit_max', l: 'Lighting circuit maximum' }, { k: 'conductor_light', l: 'Lighting conductor size' }, { k: 'socket_conductor', l: 'Socket circuit conductor' }, { k: 'ring_sockets', l: 'Sockets per circuit' }, { k: 'socket_height', l: 'Socket mounting height' }, { k: 'socket_load', l: 'Assumed socket load' }] },
  'power-factor': { name: 'Power Factor', attrs: [{ k: 'pf', l: 'Required power factor' }] },
  'transformer-room': { name: 'Transformer Room', attrs: [{ k: 'tx_room_size', l: 'Room size' }, { k: 'tx_room_height', l: 'Clear height' }, { k: 'tx_ffl', l: 'Floor level vs outside' }, { k: 'tx_1000_md', l: 'Permitted demand on 1,000 kVA' }] },
  'generator': { name: 'Standby Generator', attrs: [{ k: 'gen_changeover', l: 'Changeover / paralleling' }, { k: 'gen_required', l: 'When required' }] }
};
D.cmpDefaultCols = ['DEWA', 'SEWA', 'ADDC', 'FLS', 'CIBSE'];

D.review = [
  { id: 'r1', kind: 'Page set', msg: 'UAE Fire Code extract is missing printed pages 386, 393, 398 and 399 (chapter 5) – confirm against the full document', st: 'pending' },
  { id: 'r2', kind: 'OCR', msg: 'SEWA booklet and UAE Fire Code PDFs have a scrambled text layer – clauses were transcribed from page images; spot-check numbers', st: 'pending' },
  { id: 'r3', kind: 'Clause', msg: 'SEWA clause numbering repeats in the booklet (e.g. 4.1.13 on printed p.44 under section 4.2; 6.2.3 / 6.2.10 repeated) – verify numbering', st: 'pending' },
  { id: 'r4', kind: 'Scope', msg: 'SEWA Appendix B figures, A-Tables 26–30 and the DBC district cooling section are not indexed yet; SEWA cable ampacity tables are only partly transcribed – verify against the page images', st: 'pending' }
];
