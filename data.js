/* ElectroCode Hub – static data (authorities, subjects, filters, concepts, sample projects). Indexed documents/clauses live in js/real/*.js
 * IMPORTANT: Clause wording, section numbers, page numbers and values below are ILLUSTRATIVE
 * sample content used to demonstrate the product. They are NOT verified extracts of the
 * official SEWA / DEWA / ADDC / UAE FLS / IEC / NFPA / CIBSE documents.
 * In production this file is replaced by the indexed database (see /db/schema.sql).
 */
const D = {};

D.authorities = [
  { id: 'DEWA', name: 'DEWA', full: 'Dubai Electricity and Water Authority', country: 'UAE', region: 'Dubai', color: '#14a37f', desc: 'Regulations and guidelines for electrical installations in Dubai.' },
  { id: 'SEWA', name: 'SEWA', full: 'Sharjah Electricity, Water and Gas Authority', country: 'UAE', region: 'Sharjah', color: '#e8833a', desc: 'Electrical installation regulations for the Emirate of Sharjah.' },
  { id: 'ADDC', name: 'ADDC', full: 'Abu Dhabi Distribution Company', country: 'UAE', region: 'Abu Dhabi', color: '#7c5cff', desc: 'Distribution network and wiring requirements for Abu Dhabi.' },
  { id: 'FLS', name: 'UAE FLS', full: 'UAE Fire & Life Safety Code of Practice', country: 'UAE', region: 'Federal', color: '#e5484d', desc: 'Federal fire protection and life safety requirements.' },
  { id: 'IEC', name: 'IEC', full: 'International Electrotechnical Commission', country: 'Intl', region: 'Global', color: '#2f6bff', desc: 'IEC 60364 low-voltage installation series (reference).' },
  { id: 'NFPA', name: 'NFPA', full: 'National Fire Protection Association', country: 'USA', region: 'Global', color: '#475569', desc: 'NFPA 70, 72 and 101 (reference).' },
  { id: 'CIBSE', name: 'CIBSE', full: 'Chartered Institution of Building Services Engineers', country: 'UK', region: 'Global', color: '#c58a12', desc: 'CIBSE / SLL lighting guidance (reference).' }
];

D.subjectCats = [
  { cat: 'Electrical Design', ic: 'zap', items: ['Load Estimation', 'Load Schedule', 'Demand Factor', 'Diversity Factor', 'Voltage Drop', 'Short Circuit', 'Cable Sizing', 'Breaker Selection', 'Protection', 'Power Factor', 'Earthing', 'Lightning Protection'] },
  { cat: 'Lighting', ic: 'bulb', items: ['Indoor Lighting', 'Outdoor Lighting', 'Emergency Lighting', 'Façade Lighting', 'Landscape Lighting', 'Lux Requirements', 'UGR', 'CRI', 'CCT', 'Lighting Controls'] },
  { cat: 'Power', ic: 'cpu', items: ['Socket Outlets', 'Small Power', 'Motors', 'HVAC', 'Pumps', 'Fans', 'AHU', 'FCU'] },
  { cat: 'MV / LV', ic: 'layers', items: ['MV Switchgear', 'Transformers', 'MDB', 'SMDB', 'DB', 'RMU', 'Generator', 'UPS'] },
  { cat: 'Fire & Life Safety', ic: 'flame', items: ['Fire Alarm', 'Emergency Lighting', 'Fire Pumps', 'Smoke Control', 'Fire Rated Cables', 'Fire Stopping'] }
];

D.filterOpts = {
  disc: ['Electrical', 'Lighting', 'Power', 'Fire Alarm', 'Earthing', 'Lightning Protection', 'Low Voltage', 'Medium Voltage', 'Generator', 'Transformer', 'UPS', 'ELV', 'BMS'],
  subj: ['Cable', 'Circuit Breaker', 'Voltage Drop', 'Lighting', 'Emergency Lighting', 'Socket', 'Generator', 'Transformer', 'DB', 'MDB', 'SMDB', 'Earthing', 'Protection']
};

D.examples = ['Emergency lighting lux requirement', 'Maximum voltage drop', 'Socket outlet requirements', 'Cable sizing', 'Generator room ventilation', 'Transformer room requirements', 'Fire alarm cable requirements', 'DB clearance', 'Electrical room dimensions', 'RCD requirements', 'Earthing requirements', 'Lighting levels for corridors', 'Emergency lighting requirements in DEWA'];

/* concept groups – stand-in for vector embeddings in the prototype */
D.concepts = [
  ['emergency lighting', 'escape lighting', 'emergency illumination', 'standby lighting', 'exit sign', 'egress'],
  ['lux', 'illuminance', 'illumination', 'lighting level', 'light level', 'foot-candle'],
  ['lighting', 'luminaire', 'lamp', 'illuminance'],
  ['distribution board', 'db', 'panel', 'switchboard', 'mdb', 'smdb', 'board'],
  ['clearance', 'working space', 'space', 'access', 'headroom', 'dimension'],
  ['voltage drop', 'volt drop', 'vd'],
  ['earthing', 'earth', 'grounding', 'bonding', 'electrode'],
  ['rcd', 'residual current', 'earth leakage', 'gfci', 'rcbo', '30 ma'],
  ['socket', 'outlet', 'receptacle', 'small power'],
  ['generator', 'genset', 'standby generator'],
  ['transformer', 'substation', 'rmu', 'ring main'],
  ['fire alarm', 'detection', 'call point', 'smoke detector'],
  ['cable', 'conductor', 'wire', 'cable sizing'],
  ['ventilation', 'airflow', 'louvre', 'cooling', 'hvac', 'combustion air'],
  ['room', 'electrical room', 'switchroom', 'substation room'],
  ['fire resistant', 'fire-resistant', 'fire rated', 'circuit integrity'],
  ['breaker', 'circuit breaker', 'breaking capacity', 'short circuit', 'fault'],
  ['power factor', 'pf correction', 'capacitor'],
  ['lightning', 'surge', 'air terminal']
];

D.projects = [
  { id: 'p1', name: 'Dubai Office Tower', auth: 'DEWA', type: 'Commercial', stage: 'Detailed Design', sections: ['LV System', 'Lighting', 'Small Power', 'Emergency Lighting', 'Generator', 'Transformer', 'Fire Alarm'], progress: 64 },
  { id: 'p2', name: 'Sharjah Residential Villas', auth: 'SEWA', type: 'Residential', stage: 'Concept', sections: ['LV System', 'Lighting', 'Small Power', 'Earthing'], progress: 28 },
  { id: 'p3', name: 'Abu Dhabi Logistics Hub', auth: 'ADDC', type: 'Industrial', stage: 'Authority Submission', sections: ['LV System', 'Transformer', 'Generator', 'Lighting', 'Fire Alarm'], progress: 82 }
];
D.folders = ['My Electrical Standards', 'Current Project', 'Emergency Lighting', 'Generator', 'LV Design', 'Authority Comments'];

D.diff = [];

D.users = [
  { n: 'Youssef Shaban', e: 'youssefshaban2882@gmail.com', r: 'Admin', last: 'Today' },
  { n: 'Layla Haddad', e: 'layla.h@example.com', r: 'Editor', last: 'Yesterday' },
  { n: 'Omar Farouk', e: 'omar.f@example.com', r: 'Engineer', last: '2 days ago' },
  { n: 'Sara Khalil', e: 'sara.k@example.com', r: 'Engineer', last: '4 days ago' },
  { n: 'Guest Reviewer', e: 'reviewer@example.com', r: 'Viewer', last: '1 week ago' }
];

