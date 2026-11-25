// Fase 1 log, passo 1e: consultazioni in vigilo-service (ADR117). Nel container auth-service,
// DOPO la ricostruzione di vigilo-service. Solo letture: lascia nei log (che non si cancellano) le
// consultazioni di prova dell'operatore demo (account 10), riconoscibili dallo user-agent "prova-1e".
// Le chiavi "già registrata" restano 16 minuti in vigilo-service: per rilanciarlo prima, riavviarlo.
const jwt = require('/app/node_modules/jsonwebtoken');
const E = process.env;
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 300) : ''}`); };
const firma = o => jwt.sign(o, E.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
const ROOT = firma({ accountType: 'operatore', modules: ['*'], tenantId: 1, systemTenant: true, accountId: 1, email: 'root.prova@expressdeliverygroup.com', roleId: 1, permissions: ['*'] });
const OPER = { accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 10, email: 'demo.operatore@expressdeliverygroup.com', roleId: 3, permissions: ['vigilo.read', 'vigilo.write', 'vigilo.costi'] };
const T = firma(OPER);
const idAss = 900000 + Math.floor(Math.random() * 65536);
const TA = firma({ ...OPER, assistenza: { id: idAss, modo: 'assistenza', operatore: { id: 3, email: 'system@expressdeliverygroup.com', nome: 'Admin EDG (prova)' }, tenant: { id: 2, nome: 'Tenant Demo Edg' }, scade: new Date(Date.now() + 3e5).toISOString() } });
const UA = 'prova-1e';
const g = async (p, t = T, gw = 'api-gateway-1') => { const r = await fetch(`http://${gw}:8080${p}`, { headers: { Authorization: `Bearer ${t}`, 'User-Agent': UA } }); const ct = r.headers.get('content-type') || ''; return { s: r.status, j: ct.includes('json') ? await r.json().catch(() => null) : await r.text() }; };
const vg = (p, t, gw) => g(`/api/vigilo${p}`, t, gw);
const pausa = ms => new Promise(r => setTimeout(r, ms));
const oggi = new Date().toISOString().slice(0, 10);
(async () => {
  const prima = new Date().toISOString();
  // elenchi: non si registrano
  const soggetti = (await vg('/soggetti?righe=16')).j.data;
  const scadenze = (await vg('/scadenze?righe=4')).j.data;
  const fornitori = (await vg('/fornitori?righe=4')).j.data;
  const veicolo = soggetti.find(s => s.tipo === 'veicolo') ?? soggetti[0];
  let documento = null;
  for (const s of soggetti) {
    const a = (await vg(`/allegati?entita=soggetto&id=${s.uuid}`)).j?.data ?? [];
    if (a.length) { documento = { ...a[0], di: s.nome }; break; }
  }
  // schede: due volte la stessa (una sola consultazione), su gateway diversi
  v(`scheda di ${veicolo.nome} (x2)`, (await vg(`/soggetti/${veicolo.uuid}`, T)).s === 200 && (await vg(`/soggetti/${veicolo.uuid}`, T, 'api-gateway-2')).s === 200);
  v('scadenza', (await vg(`/scadenze/${scadenze[0].uuid}`)).s === 200);
  v(`fornitore ${fornitori[0].nome}`, (await vg(`/fornitori/${fornitori[0].uuid}`)).s === 200);
  if (documento) {
    v(`documento ${documento.nomeFile ?? documento.nome} aperto`, (await vg(`/allegati/${documento.uuid}`)).s === 200);
    v('stesso documento scaricato', (await vg(`/allegati/${documento.uuid}?scarica=1`)).s === 200);
  } else console.log('   (nessun documento nei soggetti demo: consultazione dei documenti non provata dal vivo)');
  // report e analisi (i filtri cambiati non contano due volte)
  v('dashboard', (await vg('/dashboard')).s === 200 && (await vg('/dashboard?tipo=veicolo')).s === 200);
  v('analisi', (await vg('/analisi')).s === 200);
  v('spese e consumi', (await vg('/resoconti/spese')).s === 200 && (await vg('/resoconti/spese?periodo=12m')).s === 200);
  v('CSV delle spese', (await vg('/resoconti/spese/righe.csv')).s === 200);
  v('costo dei mezzi (report)', (await vg('/resoconti/mezzi')).s === 200);
  v('costo di un solo mezzo (dalla scheda: non conta)', (await vg(`/resoconti/mezzi?soggetto=${veicolo.uuid}`)).s === 200);
  v(`andamento dei costi di ${veicolo.nome}`, (await vg(`/resoconti/mezzi/${veicolo.uuid}/andamento`)).s === 200);
  v('resoconto per fornitore', (await vg('/resoconti/fornitori')).s === 200);
  v('controlli non seguiti', (await vg('/controlli-non-seguiti')).s === 200);
  v('calendario', (await vg(`/calendario?dal=${oggi}&al=${oggi}`)).s === 200);
  v('in assistenza: scheda dello stesso veicolo', (await vg(`/soggetti/${veicolo.uuid}`, TA, 'api-gateway-2')).s === 200);
  await pausa(3072);

  const q = new URLSearchParams({ limit: '64', categoria: 'USO', userId: '10', startDate: prima });
  const r = await g(`/api/log/azioni?${q}`, ROOT);
  const cons = (r.j.logs ?? []).filter(l => l.sottoCategoria === 'vigilo.consultazione');
  for (const l of [...cons].reverse()) console.log('  ', l.azione.operazione);
  const quante = c => cons.filter(l => l.azione.dettagli?.cosa === c && !l.azione.dettagli?.assistenza).length;
  for (const [c, n] of Object.entries({ soggetto: 1, scadenza: 1, fornitore: 1, dashboard: 1, analisi: 1, 'resoconto-spese': 1, 'csv-spese': 1, 'resoconto-mezzi': 1, 'andamento-mezzo': 1, 'resoconto-fornitori': 1, 'controlli-non-seguiti': 1, calendario: 1, ...(documento ? { 'documento-aperto': 1, 'documento-scaricato': 1 } : {}) }))
    v(`${c}: ${n} consultazione`, quante(c) === n, quante(c));
  v('nessuna consultazione per gli elenchi', !cons.some(l => /elenc/.test(l.azione.dettagli?.cosa ?? '')) && cons.every(l => l.azione.dettagli?.cosa));
  const s = cons.find(l => l.azione.dettagli?.cosa === 'soggetto' && !l.azione.dettagli?.assistenza);
  v('frase della scheda con il nome', s && s.azione.operazione === `Ha aperto la scheda di ${veicolo.nome}: demo.operatore@expressdeliverygroup.com`, s && s.azione.operazione);
  const a = cons.find(l => l.azione.dettagli?.cosa === 'andamento-mezzo');
  v("l'andamento cerca il nome del mezzo", a && a.azione.operazione.includes(veicolo.nome), a && a.azione.operazione);
  if (documento) {
    const d = cons.find(l => l.azione.dettagli?.cosa === 'documento-scaricato');
    v('documento: nome del file e del soggetto', d && d.azione.operazione.includes(`(${documento.di})`), d && d.azione.operazione);
  }
  const csv = cons.find(l => l.azione.dettagli?.cosa === 'csv-spese');
  v('CSV: nome del file nei dettagli', csv && typeof csv.azione.dettagli.file === 'string', csv && csv.azione.dettagli);
  const sp = cons.find(l => l.azione.dettagli?.cosa === 'resoconto-spese');
  v('report: i filtri della prima consultazione', sp && sp.azione.dettagli.filtri && sp.azione.dettagli.filtri.periodo !== '12m', sp && sp.azione.dettagli);
  const as = cons.find(l => l.azione.dettagli?.assistenza);
  v("assistenza: un'altra consultazione, con l'operatore EDG", as && as.azione.dettagli.cosa === 'soggetto' && /assistenza EDG: Admin EDG \(prova\)/.test(as.azione.operazione), as && as.azione.operazione);
  v('consultazioni: modulo vigilo e categoria USO', cons.length > 0 && cons.every(l => l.modulo === 'vigilo' && l.categoria === 'USO'));
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
