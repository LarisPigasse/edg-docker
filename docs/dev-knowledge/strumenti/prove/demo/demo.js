// Demo del Tenant Demo Edg (tenant 2): soggetti, fornitori, letture, storico dal 2024, guasti, segnalazioni.
// Tutto via API (diretto al servizio col segreto del gateway), come demo.admin; l'addetto come demo.utente.
// Lo snapshot per tornare indietro è in /app/uploads/.demo-snapshot-tenant2.json.
const fs = require('fs');
const E = process.env;
const utente = p => JSON.stringify({ accountType: 'cliente', tenantId: 2, roleId: 1, modules: ['*'], ...p });
const ADMIN = utente({ accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const ADD = utente({ accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.own'] });
const OGGI = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
const DA = '2024-11-01';
let chiamate = 0, errori = 0;
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
async function api(m, p, b, chi = ADMIN) {
  chiamate++;
  const r = await fetch(`http://localhost:${E.PORT || 3006}/api/vigilo${p}`, { method: m, headers: { 'x-gateway-secret': E.GATEWAY_SECRET, 'x-user-data': chi, 'Content-Type': 'application/json' }, ...(b ? { body: JSON.stringify(b) } : {}) });
  let j = null; try { j = await r.json(); } catch {}
  if (!r.ok) throw new Error(`${m} ${p} → ${r.status} ${j?.message ?? ''} ${j?.errors ? JSON.stringify(j.errors) : ''}`);
  return j?.data;
}
const prova = async (cosa, f) => { try { return await f(); } catch (e) { errori++; log('ERRORE', cosa, e.message); return null; } };

// --- caso ripetibile e date ---------------------------------------------------
let seme = 1103;
const caso = () => { seme |= 0; seme = (seme + 0x6d2b79f5) | 0; let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const tra = (a, b) => a + Math.floor(caso() * (b - a + 1));
const circa = (n, pct = 0.16) => Math.round(n * (1 + (caso() * 2 - 1) * pct));
const D = g => new Date(`${g}T00:00:00Z`);
const S = d => d.toISOString().slice(0, 10);
const giorni = (g, n) => S(new Date(D(g).getTime() + n * 864e5));
const mesi = (g, n) => { const d = D(g); const giorno = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n); const fine = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); d.setUTCDate(Math.min(giorno, fine)); return S(d); };
const diff = (a, b) => Math.round((D(b) - D(a)) / 864e5);
const minG = (a, b) => (a < b ? a : b);
let nFattura = 1024;
const fattura = g => `FT ${g.slice(0, 4)}/${String(nFattura++).padStart(4, '0')}`;

// --- catalogo -----------------------------------------------------------------
const FORNITORI = [
  ['dimarco', 'Officina Di Marco Veicoli Industriali', 'officina', '0861 721456', 'Sandro Di Marco', "Zona Industriale, Sant'Egidio alla Vibrata (TE)"],
  ['giuliani', 'Autofficina Giuliani', 'officina', '0861 803120', 'Marco Giuliani', 'Via Nazionale 64, Nereto (TE)'],
  ['carrozzeria', 'Carrozzeria Vibrata', 'carrozzeria', '0861 750318', 'Franco Ciarrocchi', 'Via Piane 12, Corropoli (TE)'],
  ['gomme', 'Pneumatici Adriatica', 'gommista', '085 4471209', 'Davide Mancini', 'Via Tiburtina 210, Pescara'],
  ['revisioni', 'Centro Revisioni Val Vibrata', 'centro-revisioni', '0861 812044', null, 'Via Bonifica 8, Nereto (TE)'],
  ['mctc', 'Motorizzazione Civile di Teramo', 'ente', '0861 248100', null, 'Via Cona, Teramo'],
  ['aci', 'ACI — Delegazione di Nereto', 'ente', '0861 856032', null, 'Piazza Cavour 3, Nereto (TE)'],
  ['generali', 'Generali — Agenzia di Giulianova', 'assicurazione', '085 8003416', 'Laura Di Felice', 'Lungomare Zara 40, Giulianova (TE)'],
  ['tachi', 'Tachi Service Abruzzo', 'officina', '085 9358812', 'Roberto Pace', 'Zona Industriale, Montesilvano (PE)'],
  ['medico', 'Studio Medico del Lavoro Teramo', 'medico-competente', '0861 245566', 'Dott.ssa Elena Rapagnà', 'Corso De Michetti 18, Teramo'],
  ['formazione', 'Formazione Sicura', 'consulente', '0861 411902', 'Ilaria Sacchetti', 'Via Po 7, Teramo'],
  ['antincendio', 'Antincendio Adriatica', 'altro', '085 4214470', 'Giorgio Rossetti', 'Via Raiale 96, Pescara'],
  ['termo', 'Termoidraulica Pavone', 'altro', '0861 857741', 'Luigi Pavone', 'Via Roma 210, Nereto (TE)'],
  ['commercialista', 'Studio Commercialista Marcozzi', 'consulente', '0861 852210', 'Dott. Paolo Marcozzi', 'Viale Europa 5, Nereto (TE)'],
  ['dhollandia', 'Dhollandia Service Centro Italia', 'officina', '085 9771230', 'Sergio Pompa', 'Via Aterno 120, San Giovanni Teatino (CH)'],
];
const F = {}; // chiave → uuid

const SEDI = [
  { k: 'ner', nome: 'Sede di Nereto', cat: 'Uffici', ident: 'NER', dati: { indirizzo: 'Via Roma 128', comune: 'Nereto', cap: '64015', provincia: 'TE', conformitaImpianto: '2019-03-15' } },
  { k: 'pes', nome: 'Magazzino di Pescara', cat: 'Magazzini e capannoni', ident: 'PES', dati: { indirizzo: 'Via Tiburtina 512', comune: 'Pescara', cap: '65129', provincia: 'PE', conformitaImpianto: '2021-06-10' } },
];
const PERSONE = [
  { k: 'demo', nome: 'Demo Utente', esiste: true, cat: 'Autisti', sede: 'ner', dati: { nascita: '1985-04-12', assunzione: '2019-03-01', mansione: 'Autista' }, costo: 28 },
  { k: 'luca', nome: 'Luca Ferretti', cat: 'Autisti', sede: 'ner', dati: { nascita: '1978-09-23', assunzione: '2015-06-01', mansione: 'Autista', telefono: '333 1024512' }, costo: 30 },
  { k: 'paolo', nome: 'Paolo Marini', cat: 'Autisti', sede: 'ner', dati: { nascita: '1982-01-17', assunzione: '2017-02-15', mansione: 'Autista', telefono: '333 2048256' }, costo: 30 },
  { k: 'andrea', nome: 'Andrea Di Sabatino', cat: 'Autisti', sede: 'pes', dati: { nascita: '1990-11-05', assunzione: '2021-09-01', mansione: 'Autista', telefono: '347 4096128' }, costo: 28 },
  { k: 'marco', nome: 'Marco Pompei', cat: 'Autisti', sede: 'pes', dati: { nascita: '1972-06-30', assunzione: '2012-04-01', mansione: 'Autista', telefono: '349 8192064' }, costo: 30 },
  { k: 'giulia', nome: 'Giulia Mancini', cat: "Personale d'ufficio", sede: 'ner', dati: { nascita: '1988-02-14', assunzione: '2018-10-01', mansione: 'Impiegata amministrativa' }, costo: 24 },
  { k: 'stefano', nome: 'Stefano Rossi', cat: 'Personale operativo', sede: 'ner', dati: { nascita: '1980-08-08', assunzione: '2014-01-07', mansione: 'Meccanico e magazziniere' }, costo: 32 },
];
const TRATTORI = 'Autocarri oltre 3,5 t e trattori stradali';
const VEICOLI = [
  { k: 'sway1', nome: 'Iveco S-Way 01', cat: TRATTORI, ident: 'GH128KM', dati: { marca: 'Iveco', modello: 'S-Way 490', immatricolazione: '2022-03-10', alimentazione: 'gasolio' }, sede: 'ner', km: [245000, 10500] },
  { k: 'sway2', nome: 'Iveco S-Way 02', cat: TRATTORI, ident: 'GH256KN', dati: { marca: 'Iveco', modello: 'S-Way 490', immatricolazione: '2023-05-12', alimentazione: 'gasolio' }, sede: 'ner', km: [160000, 11200] },
  { k: 'daf', nome: 'DAF XF 01', cat: TRATTORI, ident: 'GF064ZR', dati: { marca: 'DAF', modello: 'XF 480', immatricolazione: '2021-09-20', alimentazione: 'gasolio' }, sede: 'pes', km: [410000, 9600] },
  { k: 'schmitz', nome: 'Semirimorchio Schmitz 01', cat: 'Rimorchi e semirimorchi oltre 3,5 t', ident: 'XA512BC', dati: { marca: 'Schmitz Cargobull', modello: 'S.KO Cool', immatricolazione: '2020-04-01' }, sede: 'ner' },
  { k: 'krone', nome: 'Semirimorchio Krone 02', cat: 'Rimorchi e semirimorchi oltre 3,5 t', ident: 'XA128CD', dati: { marca: 'Krone', modello: 'Profi Liner', immatricolazione: '2022-02-15' }, sede: 'pes' },
  { k: 'ducato', nome: 'Fiat Ducato 02', cat: 'Furgoni e autocarri fino a 3,5 t', ident: 'GJ512AB', dati: { marca: 'Fiat', modello: 'Ducato Maxi 2.2', immatricolazione: '2021-07-01', alimentazione: 'gasolio' }, sede: 'pes', km: [98000, 3200] },
  { k: 'panda', nome: 'Fiat Panda aziendale', cat: 'Autovetture', ident: 'GK032PN', dati: { marca: 'Fiat', modello: 'Panda Hybrid', immatricolazione: '2023-01-20', alimentazione: 'ibrido' }, sede: 'ner', km: [21000, 1400] },
  { k: 'fdemo', nome: 'Furgone Demo', esiste: true, dati: { marca: 'Renault', modello: 'Kangoo', immatricolazione: '2020-06-15', alimentazione: 'gasolio' }, sede: 'ner', km: [72000, 1600] },
  { k: 'fuff', nome: 'Furgone Ufficio', esiste: true, dati: { marca: 'Citroën', modello: 'Berlingo', immatricolazione: '2022-09-01', alimentazione: 'gasolio' }, sede: 'pes', km: [38000, 1100] },
];
const ATTREZZATURE = [
  { k: 'est1', nome: 'Estintore a polvere 6 kg', cat: 'Estintori a polvere', ident: 'EST-0128', dati: { marca: 'Gloria', modello: 'PD6GA', fabbricazione: '2019-05-10', messaInServizio: '2019-06-01', ubicazione: 'Magazzino, ingresso carico' }, sede: 'pes' },
  { k: 'est2', nome: 'Estintore a CO2 5 kg', cat: 'Estintori a CO2', ident: 'EST-0256', dati: { marca: 'Gloria', modello: 'KS5ST', fabbricazione: '2021-02-18', messaInServizio: '2021-03-01', ubicazione: 'Uffici, sala server' }, sede: 'ner' },
  { k: 'sponda', nome: 'Sponda idraulica Dhollandia', cat: 'Sponde idrauliche caricatrici', ident: 'SP-1024', dati: { marca: 'Dhollandia', modello: 'DH-LM.15', fabbricazione: '2022-03-01', messaInServizio: '2022-03-10', ubicazione: 'Montata sul Fiat Ducato 02' }, sede: 'pes' },
];
const SOG = {}; // chiave → { uuid, nome, tipo, contatore }

// km: cumulati mese per mese, con mesi più o meno pieni (ripetibili)
const KM = {};
function preparaKm(v) {
  const tappe = [['2024-10-01', v.km[0]]];
  let g = '2024-10-01', km = v.km[0];
  while (g <= OGGI) { const p = mesi(g, 1); km += Math.round(v.km[1] * (0.82 + caso() * 0.36)); tappe.push([p, km]); g = p; }
  KM[v.k] = tappe;
}
function kmAl(k, g) {
  const t = KM[k];
  for (let i = 1; i < t.length; i++) if (g <= t[i][0]) { const [g0, k0] = t[i - 1], [g1, k1] = t[i]; return Math.round(k0 + ((k1 - k0) * diff(g0, g)) / diff(g0, g1)); }
  return t[t.length - 1][1];
}
function quandoKm(k, soglia) {
  let g = '2024-10-01';
  for (let i = 0; i < 1024 && g <= giorni(OGGI, 365); i++) { if (kmAl(k, g) >= soglia) return g; g = giorni(g, 4); }
  return null;
}

// --- piani: quanto costa, chi lo fa, da quando c'è storia ------------------------
const pesante = s => ['sway1', 'sway2', 'daf'].includes(s.k);
const semi = s => ['schmitz', 'krone'].includes(s.k);
function piano(s, nome) {
  const p = { storia: null, imp: 0, forn: null, mano: null, esec: undefined, rif: true };
  const anno = () => giorni(DA, tra(0, 300));
  switch (nome) {
    case 'Revisione annuale': return { ...p, storia: anno(), imp: semi(s) ? 150 : 190, forn: semi(s) ? 'revisioni' : 'mctc', negativo: s.k === 'sway2' };
    case 'Revisione': return { ...p, storia: { fdemo: '2024-06-30', ducato: '2025-07-31' }[s.k] ?? null, imp: 80, forn: 'revisioni' };
    case 'Tassa automobilistica (bollo)': return { ...p, storia: anno(), imp: pesante(s) ? 720 : semi(s) ? 410 : s.k === 'ducato' ? 290 : 210, forn: 'aci', rif: false };
    case 'Assicurazione RCA': return { ...p, storia: anno(), imp: pesante(s) ? 3300 : semi(s) ? 880 : s.k === 'ducato' ? 1280 : 640, forn: 'generali' };
    case 'Controllo periodico del tachigrafo': return { ...p, storia: giorni('2024-12-01', tra(0, 200)), imp: 180, forn: 'tachi', rinvio: s.k === 'sway1' };
    case "Scarico dati dell'unità di bordo": return { ...p, storia: giorni('2025-02-01', tra(0, 60)), mano: [['giulia', 0.5]], rif: false };
    case 'Tagliando':
      if (pesante(s)) return { ...p, tagliando: 64000, imp: 1100, forn: 'dimarco', misto: 0.25 };
      return { ...p, tagliando: s.k === 'ducato' ? 32000 : 16000, imp: s.k === 'ducato' ? 420 : 260, forn: 'giuliani', interno: 0.5 };
    case 'Visita medica periodica': return { ...p, storia: anno(), imp: 70, forn: 'medico' };
    case 'Accertamento di assenza di tossicodipendenza': return { ...p, storia: anno(), imp: 90, forn: 'medico' };
    case 'Scarico dati della carta del conducente': return { ...p, storia: giorni('2026-06-01', tra(0, 20)), mano: [['giulia', 0.25]], rif: false };
    case 'RLS': return { ...p, storia: '2025-01-20', imp: 220, forn: 'formazione' };
    case 'Controllo periodico dei presidi antincendio': return { ...p, storia: giorni(DA, tra(0, 150)), imp: s.k === 'pes' ? 190 : 140, forn: 'antincendio' };
    case "Manutenzione dell'impianto termico": return { ...p, storia: giorni(DA, tra(30, 200)), imp: 180, forn: 'termo' };
    case 'Controllo della cassetta di primo soccorso': return { ...p, storia: giorni('2025-07-01', tra(0, 50)), mano: [['stefano', 0.25]], rif: false };
    case 'Manutenzione e controllo': return { ...p, storia: '2025-03-10', imp: 380, forn: 'dhollandia' };
    case 'Quota annuale Albo autotrasportatori': return { ...p, storia: '2024-12-31', imp: 260 };
    case 'REN — dimostrazione della capacità finanziaria': return { ...p, storia: '2025-04-30', imp: 600, forn: 'commercialista' };
    case 'Riunione periodica di prevenzione': return { ...p, storia: '2025-02-20', imp: 400, forn: 'formazione' };
    case 'Polizza RC verso terzi e prestatori di lavoro': return { ...p, storia: '2025-03-31', imp: 2600, forn: 'generali' };
    case 'Polizza merci trasportate': return { ...p, storia: '2025-06-30', imp: 1800, forn: 'generali' };
    case 'PEC': return { ...p, storia: '2025-01-15', imp: 48, rif: false };
    case 'Rimborso accise sul gasolio': return { ...p, storia: '2025-01-31', imp: 120, forn: 'commercialista' };
    default: return p;
  }
}
// date fisse per i controlli a lunga cadenza (in regola o vicine) e stati voluti alla fine
const FUTURO = {
  'CQC merci': () => giorni('2027-03-01', tra(0, 900)),
  'Patente C / CE': () => giorni('2027-01-15', tra(0, 1100)),
  'Carta tachigrafica del conducente': () => giorni('2027-05-01', tra(0, 900)),
  'Formazione dei lavoratori': () => giorni('2027-02-01', tra(0, 1000)),
  'Visita medica dei videoterminalisti': () => '2028-10-14',
  'Controllo di efficienza energetica': () => '2027-06-30',
  'Rinnovo periodico di conformità antincendio (CPI)': () => '2028-09-30',
  'Addetto antincendio': () => '2029-04-15',
  'Addetto al primo soccorso': () => giorni(OGGI, 21),
  'Firma digitale': () => '2027-02-11',
};
const LASCIA = new Set(['demo|Formazione dei lavoratori', 'stefano|Formazione dei lavoratori', 'azienda|Valutazione degli agenti fisici']);
const STATI = {
  'fuff|Revisione': giorni(OGGI, -25), // scaduta
  'andrea|Visita medica periodica': giorni(OGGI, -12), // scaduta
  'pes|Controllo periodico dei presidi antincendio': giorni(OGGI, -40), // scaduta
  "daf|Scarico dati dell'unità di bordo": giorni(OGGI, -6), // scaduta
  'ducato|Assicurazione RCA': giorni(OGGI, -6), // in tolleranza
  'azienda|Polizza merci trasportate': giorni(OGGI, -3), // in tolleranza
  'sway2|Tassa automobilistica (bollo)': giorni(OGGI, 5), // entro 8 giorni
  'luca|Scarico dati della carta del conducente': giorni(OGGI, 3), // entro 8 giorni
  'fdemo|Tassa automobilistica (bollo)': giorni(OGGI, 20), // entro 32 giorni
  'paolo|Carta tachigrafica del conducente': giorni(OGGI, 27), // entro 32 giorni
};
// scadenze da aggiungere a mano (controlli non automatici)
const MANUALI = [
  ['stefano', 'Addetto antincendio'], ['giulia', 'Addetto al primo soccorso'], ['paolo', 'RLS'],
  ['ner', 'Controllo della cassetta di primo soccorso'], ['pes', 'Controllo della cassetta di primo soccorso'],
  ['ner', "Manutenzione dell'impianto termico"], ['pes', "Manutenzione dell'impianto termico"],
  ['ner', 'Controllo di efficienza energetica'], ['pes', 'Rinnovo periodico di conformità antincendio (CPI)'],
  ['azienda', 'Polizza RC verso terzi e prestatori di lavoro'], ['azienda', 'Polizza merci trasportate'], ['azienda', 'PEC'],
  ['azienda', 'Firma digitale'], ['azienda', 'Rimborso accise sul gasolio'],
];

// --- registrazioni -------------------------------------------------------------
const detta = uuid => api('GET', `/scadenze/${uuid}`);
function corpo(s, d, p, g, extra = {}) {
  const r = d.richieste || {};
  const conMano = r.manodopera && r.manodopera !== 'nascosto';
  const b = { eseguitaIl: g, esito: 'positivo', note: null, ...extra };
  if (p.mano) { if (conMano) { b.esecuzione = 'interna'; b.manodopera = p.mano.map(([k, ore]) => ({ persona: SOG[k].uuid, ore })); } }
  else if (p.interno && conMano && caso() < p.interno) { b.esecuzione = 'interna'; b.manodopera = [{ persona: SOG.stefano.uuid, ore: [1.5, 2, 2.5][tra(0, 2)] }]; b.importo = circa(p.imp * 0.4); }
  else if (p.imp) {
    b.importo = circa(p.imp);
    if (p.forn) b.fornitore = F[p.forn];
    if (conMano && p.forn) b.esecuzione = 'esterna';
    if (conMano && p.misto && caso() < p.misto) { b.esecuzione = 'entrambe'; b.manodopera = [{ persona: SOG.stefano.uuid, ore: 1 }]; }
  }
  if (p.rif && b.importo) b.riferimento = fattura(g);
  if (d.contatore && SOG[s.k].km && r.lettura !== 'nascosto') b.lettura = kmAl(s.k, g);
  if (r.importo === 'obbligatorio' && b.importo == null) b.importo = circa(p.imp || 64);
  if (r.fornitore === 'obbligatorio' && !b.fornitore) b.fornitore = F[p.forn || 'dimarco'];
  if (r.riferimento === 'obbligatorio' && !b.riferimento) b.riferimento = fattura(g);
  if (r.importo === 'nascosto') delete b.importo;
  if (r.fornitore === 'nascosto') delete b.fornitore;
  if (r.riferimento === 'nascosto') delete b.riferimento;
  return b;
}
let registrate = 0;
async function storia(s, sc, p, limite) {
  let uuid = sc.uuid, rinviata = false, negativo = !!p.negativo;
  for (let giro = 0; giro < 64 && uuid; giro++) {
    const d = await detta(uuid);
    let scade = d.scadeIl;
    if (p.tagliando && d.sogliaUso != null) { const gk = quandoKm(s.k, d.sogliaUso); if (gk && (!scade || gk < scade)) scade = gk; }
    if (!scade || scade > limite) break;
    if (p.rinvio && !rinviata) {
      rinviata = true;
      await api('POST', `/scadenze/${uuid}/rinvio`, { dataNuova: giorni(scade, 20), motivo: 'Officina autorizzata al completo fino a fine mese' });
      continue;
    }
    const g = minG(giorni(scade, tra(-12, 3)), giorni(OGGI, -1));
    if (negativo) {
      negativo = false;
      await api('POST', `/scadenze/${uuid}/registrazioni`, corpo(s, d, p, g, { esito: 'negativo', dataNuova: giorni(g, 21), note: 'Usura eccessiva dei tamburi freno: da ripresentare dopo la riparazione' }));
      registrate++;
      continue;
    }
    const r = await api('POST', `/scadenze/${uuid}/registrazioni`, corpo(s, d, p, g));
    registrate++;
    uuid = r?.successiva?.uuid ?? null;
  }
  return uuid;
}

async function trattaScadenze(s) {
  const elenco = await api('GET', `/scadenze?soggetto=${s.uuid}&righe=128`);
  for (const sc of elenco) {
    const nome = sc.controllo?.nome; if (!nome) continue;
    const chiave = `${s.k}|${nome}`;
    if (LASCIA.has(chiave)) continue;
    await prova(chiave, async () => {
      if (FUTURO[nome] && !STATI[chiave]) { await api('PATCH', `/scadenze/${sc.uuid}`, { scadeIl: FUTURO[nome]() }); return; }
      const p = piano(s, nome);
      let aperta = sc.uuid;
      const fine = STATI[chiave] ? giorni(STATI[chiave], -1) : giorni(OGGI, -2);
      if (p.tagliando) {
        const prima = giorni(DA, -tra(10, 140));
        await api('PATCH', `/scadenze/${sc.uuid}`, { scadeIl: mesi(prima, 12), sogliaUso: kmAl(s.k, prima) + p.tagliando });
        aperta = await storia(s, sc, p, fine);
      } else if (p.storia) {
        await api('PATCH', `/scadenze/${sc.uuid}`, { scadeIl: p.storia });
        aperta = await storia(s, sc, p, fine);
      }
      if (STATI[chiave] && aperta) await api('PATCH', `/scadenze/${aperta}`, { scadeIl: STATI[chiave] });
    });
  }
}

// --- via ------------------------------------------------------------------------
(async () => {
  log('Demo del Tenant Demo, oggi', OGGI);
  const categorie = await api('GET', '/categorie?righe=128');
  const CAT = Object.fromEntries(categorie.map(c => [c.nome, c.uuid]));
  const controlli = await api('GET', '/controlli?righe=128');
  const CTR = (nome, tipo) => controlli.find(c => c.nome === nome && c.tipoSoggetto === tipo)?.uuid;

  for (const [k, nome, tipo, tel, ref, ind] of FORNITORI)
    await prova(`fornitore ${nome}`, async () => { F[k] = (await api('POST', '/fornitori', { nome, tipo, telefono: tel, referente: ref, indirizzo: ind, email: `info@${k}.example.it` })).uuid; });
  log('fornitori', Object.keys(F).length);

  const esistenti = await api('GET', '/soggetti?righe=128&stato=attivi');
  const crea = async (tipo, x) => {
    const c = { tipo, nome: x.nome, categoria: x.cat ? CAT[x.cat] : null, identificativo: x.ident ?? null, dati: x.dati ?? {}, sede: x.sede ? SOG[x.sede].uuid : null };
    let u;
    if (x.esiste) {
      u = esistenti.find(e => e.nome === x.nome).uuid;
      const { tipo: _t, ...m } = c;
      if (!x.cat) delete m.categoria;
      if (!x.ident) delete m.identificativo;
      await api('PATCH', `/soggetti/${u}`, m);
    } else u = (await api('POST', '/soggetti', c)).uuid;
    if (x.costo) await api('PATCH', `/soggetti/${u}`, { costoOrario: x.costo });
    const det = await api('GET', `/soggetti/${u}`);
    SOG[x.k] = { k: x.k, uuid: u, nome: x.nome, tipo, contatore: det.contatori?.find(z => z.unita === 'km')?.uuid ?? null, km: !!x.km };
  };
  for (const x of SEDI) await prova(x.nome, () => crea('sede', x));
  await prova('azienda', () => crea('azienda', { k: 'azienda', nome: 'Tenant Demo Edg', cat: 'Azienda', ident: '01234567890', dati: { codiceFiscale: '01234567890', pec: 'amministrazione@pec.demo.example.it', indirizzo: 'Via Roma 128, Nereto (TE)' } }));
  for (const x of PERSONE) await prova(x.nome, () => crea('persona', x));
  for (const x of VEICOLI) await prova(x.nome, () => crea('veicolo', x));
  for (const x of ATTREZZATURE) await prova(x.nome, () => crea('attrezzatura', x));
  log('soggetti', Object.keys(SOG).length);

  for (const [k, nome] of MANUALI) await prova(`manuale ${k} ${nome}`, () => api('POST', '/scadenze', { soggetto: SOG[k].uuid, controllo: CTR(nome, SOG[k].tipo), scadeIl: null }));
  log('scadenze manuali', MANUALI.length);

  // letture mensili dei km
  let letture = 0;
  for (const v of VEICOLI.filter(v => v.km)) {
    preparaKm(v);
    const c = SOG[v.k]?.contatore;
    if (!c) { log('senza contatore', v.nome); continue; }
    for (let g = '2024-11-01'; g <= OGGI; g = mesi(g, 1)) {
      const giorno = minG(giorni(g, tra(0, 3)), OGGI);
      await prova(`lettura ${v.nome} ${giorno}`, () => api('POST', `/contatori/${c}/letture`, { valore: kmAl(v.k, giorno), lettoIl: giorno }));
      letture++;
    }
  }
  log('letture', letture);

  // assegnazioni (Demo Utente ha già il Furgone Demo)
  const ASS = [['luca', 'sway1', '2024-11-01'], ['paolo', 'sway2', '2024-11-01'], ['marco', 'daf', '2024-11-01', '2025-01-31'], ['andrea', 'daf', '2025-02-01'], ['marco', 'ducato', '2025-02-01'], ['giulia', 'fuff', '2024-11-01'], ['andrea', 'krone', '2025-02-01'], ['luca', 'schmitz', '2024-11-01']];
  for (const [p, m, dal, al] of ASS) await prova(`assegnazione ${p} ${m}`, () => api('POST', '/assegnazioni', { persona: SOG[p].uuid, soggetto: SOG[m].uuid, dal, al: al ?? null }));
  log('assegnazioni', ASS.length);

  // storico e stati
  for (const k of Object.keys(SOG)) { await trattaScadenze(SOG[k]); log('storico', SOG[k].nome, '— registrazioni finora', registrate); }

  // guasti già riparati
  const GUASTI = [
    ['sway1', 'Sostituzione frizione', 'Slitta in salita a pieno carico', '2025-03-18', 'dimarco', 2850, null],
    ['daf', 'Perdita aria impianto frenante', 'Calo di pressione a veicolo fermo', '2025-06-04', 'dimarco', 640, 2],
    ['ducato', 'Specchietto destro rotto', 'Urto in retromarcia nel piazzale', '2025-09-12', 'carrozzeria', 180, null],
    ['schmitz', 'Gruppo frigo in avaria', 'Non mantiene la temperatura sotto i 4 °C', '2025-12-02', 'dimarco', 1450, null],
    ['sway2', 'Foratura pneumatico asse posteriore', 'Pneumatico sostituito sul posto', '2026-02-20', 'gomme', 420, null],
    ['panda', 'Spia motore accesa', 'Sensore di pressione sostituito internamente', '2026-05-14', null, 64, 1.5],
    ['sway1', 'Paraurti danneggiato in manovra', 'Urto contro la colonnina in banchina', '2026-08-27', 'carrozzeria', 960, null],
  ];
  for (const [k, titolo, descrizione, g, forn, imp, ore] of GUASTI)
    await prova(`guasto ${titolo}`, async () => {
      const sc = await api('POST', `/soggetti/${SOG[k].uuid}/guasti`, { titolo, descrizione, bloccaUso: false, scadeIl: giorni(g, 3) });
      const b = { eseguitaIl: giorni(g, 2), esito: 'positivo', importo: imp, note: null };
      if (forn) { b.fornitore = F[forn]; b.riferimento = fattura(g); b.esecuzione = ore ? 'entrambe' : 'esterna'; } else b.esecuzione = 'interna';
      if (ore) b.manodopera = [{ persona: SOG.stefano.uuid, ore }];
      if (sc.contatore && SOG[k].km) b.lettura = kmAl(k, b.eseguitaIl);
      await api('POST', `/scadenze/${sc.uuid}/registrazioni`, b);
      registrate++;
    });
  await prova('guasto aperto DAF', () => api('POST', `/soggetti/${SOG.daf.uuid}/guasti`, { titolo: 'Centralina del cambio in errore', descrizione: 'Il cambio resta in folle, codice errore sul cruscotto. Mezzo fermo in piazzale.', bloccaUso: true, scadeIl: giorni(OGGI, 2) }));
  await prova('guasto aperto Ducato', () => api('POST', `/soggetti/${SOG.ducato.uuid}/guasti`, { titolo: 'Rumore dalle sospensioni anteriori', descrizione: 'Colpi sulle buche, lato destro', bloccaUso: false, scadeIl: giorni(OGGI, 6) }));
  log('guasti', GUASTI.length + 2);

  // segnalazioni dell'addetto (demo.utente): la sua carta del conducente e il tagliando del Furgone Demo
  const suo = async (k, nome) => (await api('GET', `/scadenze?soggetto=${SOG[k].uuid}&righe=128`)).find(x => x.controllo?.nome === nome);
  await prova('segnalazione carta', async () => {
    const sc = await suo('demo', 'Scarico dati della carta del conducente');
    await api('POST', `/scadenze/${sc.uuid}/segnalazioni`, { eseguitaIl: giorni(OGGI, -1), note: 'Scaricata in sede con il lettore, file salvato' }, ADD);
  });
  await prova('segnalazione tagliando', async () => {
    const sc = await suo('fdemo', 'Tagliando');
    await api('POST', `/scadenze/${sc.uuid}/segnalazioni`, { eseguitaIl: giorni(OGGI, -2), lettura: kmAl('fdemo', giorni(OGGI, -2)), note: 'Fatto da Autofficina Giuliani, fattura consegnata in ufficio' }, ADD);
  });

  fs.writeFileSync('/app/uploads/.demo-creati.json', JSON.stringify({ quando: new Date().toISOString(), fornitori: F, soggetti: SOG }, null, 2));
  log(`FINE: ${registrate} registrazioni, ${chiamate} chiamate, ${errori} errori`);
})().catch(e => log('ERRORE FATALE', e.stack));
