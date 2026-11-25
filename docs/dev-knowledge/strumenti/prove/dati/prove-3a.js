// Fase 3, passo 3a: dati di un tenant in Vigilo — riepilogo, "solo i dati", "tutto", permessi (ADR117).
// Nel container auth-service, DOPO la ricostruzione di vigilo-service. Lavora SOLO sul tenant finto
// 2147480001 (nessun tenant vero): avvio, due soggetti, un fornitore, un documento, poi le eliminazioni.
// Lo lascia vuoto. Nei log restano gli eventi della prova (i log non si cancellano).
const jwt = require('/app/node_modules/jsonwebtoken');
const E = process.env;
const T = 2147480001;
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 300) : ''}`); };
const firma = o => jwt.sign(o, E.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
const ADMIN_T = firma({ accountType: 'cliente', modules: ['vigilo'], tenantId: T, systemTenant: false, accountId: 900301, email: 'prova.3a@esempio.it', roleId: 2, permissions: ['vigilo.*'] });
const ROOT = firma({ accountType: 'operatore', modules: ['*'], tenantId: 1, systemTenant: true, accountId: 1, email: 'root.prova@expressdeliverygroup.com', roleId: 1, permissions: ['*'] });
const ADMIN_EDG = firma({ accountType: 'operatore', modules: ['*'], tenantId: 1, systemTenant: true, accountId: 3, email: 'system@expressdeliverygroup.com', roleId: 2, permissions: ['sistema.tenant', 'sistema.logs', 'vigilo.*'] });
const CLI = firma({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', roleId: 2, permissions: ['vigilo.*', 'sistema.tenant'] });
const ROOT_ASS = firma({ accountType: 'operatore', modules: ['*'], tenantId: 1, systemTenant: true, accountId: 1, email: 'root.prova@expressdeliverygroup.com', roleId: 1, permissions: ['*'], assistenza: { id: 900302, modo: 'preparazione', operatore: { id: 1, email: 'root.prova@expressdeliverygroup.com', nome: 'Root' }, tenant: { id: T, nome: 'Prova' }, scade: new Date(Date.now() + 3e5).toISOString() } });
const req = async (gw, metodo, p, t, corpo) => {
  const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${t}`, 'User-Agent': 'prova-3a', ...(corpo ? { 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined });
  return { s: r.status, j: await r.json().catch(() => null) };
};
const g = (p, t = ADMIN_T, gw = 'api-gateway-1') => req(gw, 'GET', p, t);
const dati = `/piattaforma/tenant/${T}/dati`;
const riepilogo = async (gw = 'api-gateway-1') => (await g(dati, ROOT, gw)).j.data;
const somma = righe => righe.reduce((a, r) => a + r.righe, 0);
const righe = (rp, tab) => [...rp.dati, ...rp.configurazione].find(r => r.tabella === tab).righe;
(async () => {
  // da capo: se la prova precedente ha lasciato qualcosa, via tutto
  let rp = await riepilogo();
  if (somma(rp.dati) + somma(rp.configurazione) > 0) await req('api-gateway-1', 'DELETE', dati, ROOT, { modo: 'tutto', conferma: T });

  // avvio di Vigilo nel tenant finto (base + autotrasporto, voci preselezionate)
  const p = (await g('/avvio/proposta?modelli=base,trasporto')).j.data;
  const cat = p.tipi.flatMap(t => t.categorie).filter(c => c.preselezionata).map(c => c.chiave);
  const con = p.tipi.flatMap(t => t.controlli).filter(c => c.preselezionato ?? c.preselezionata).map(c => c.chiave);
  const av = await req('api-gateway-1', 'POST', '/avvio', ADMIN_T, { modelli: ['base', 'trasporto'], categorie: cat, controlli: con });
  v(`avvio del tenant di prova (${cat.length} categorie, ${con.length} controlli)`, av.s === 200 || av.s === 201, av.j);
  const categorie = (await g('/categorie?righe=128&pagina=1')).j.data;
  const cv = categorie.find(c => c.tipoSoggetto === 'veicolo');
  const s1 = await req('api-gateway-1', 'POST', '/soggetti', ADMIN_T, { tipo: 'veicolo', nome: 'Furgone prova 3a', categoria: cv.uuid, identificativo: 'ZZ001ZZ' });
  const s2 = await req('api-gateway-1', 'POST', '/soggetti', ADMIN_T, { tipo: 'veicolo', nome: 'Bilico prova 3a', categoria: cv.uuid, identificativo: 'ZZ002ZZ' });
  v('due soggetti creati', [200, 201].includes(s1.s) && [200, 201].includes(s2.s), [s1.j, s2.j]);
  const f = await req('api-gateway-1', 'POST', '/fornitori', ADMIN_T, { nome: 'Officina prova 3a', tipo: 'officina' });
  v('un fornitore creato', [200, 201].includes(f.s), f.j);
  const fd = new FormData();
  fd.append('entita', 'soggetto');
  fd.append('id', s1.j.data.uuid);
  fd.append('file', new Blob([Buffer.from('%PDF-1.4\n% prova 3a\n%%EOF\n')], { type: 'application/pdf' }), 'prova-3a.pdf');
  const up = await fetch('http://api-gateway-1:8080/api/vigilo/allegati', { method: 'POST', headers: { Authorization: `Bearer ${ADMIN_T}` }, body: fd });
  v('un documento caricato', [200, 201].includes(up.status), await up.text().catch(() => ''));

  rp = await riepilogo('api-gateway-2');
  console.log('   riepilogo:', JSON.stringify({ avviato: rp.avviato, scadenze: rp.scadenze, documenti: rp.documenti, dati: rp.dati.filter(r => r.righe).map(r => `${r.tabella} ${r.righe}`), conf: rp.configurazione.filter(r => r.righe).map(r => `${r.tabella} ${r.righe}`) }));
  v('riepilogo: avviato, 2 soggetti, 1 fornitore, 1 documento, scadenze aperte', rp.avviato && righe(rp, 'soggetti') === 2 && righe(rp, 'fornitori') === 1 && rp.documenti.numero === 1 && rp.documenti.byte > 0 && rp.scadenze.aperte > 0, rp);
  const confPrima = rp.configurazione.map(r => r.righe);

  // permessi e sicurezze
  v('admin EDG legge il riepilogo', (await g(dati, ADMIN_EDG, 'api-gateway-2')).s === 200);
  v('admin EDG non elimina -> 403', (await req('api-gateway-2', 'DELETE', dati, ADMIN_EDG, { modo: 'dati', conferma: T })).s === 403);
  v('admin del cliente (anche con sistema.tenant) -> 403', (await g(dati, CLI)).s === 403);
  v('root in accesso assistito non elimina -> 403', (await req('api-gateway-1', 'DELETE', dati, ROOT_ASS, { modo: 'dati', conferma: T })).s === 403);
  v('conferma sbagliata -> 400', (await req('api-gateway-1', 'DELETE', dati, ROOT, { modo: 'dati', conferma: T - 1 })).s === 400);
  v('modo sconosciuto -> 400', (await req('api-gateway-1', 'DELETE', dati, ROOT, { modo: 'qualcosa', conferma: T })).s === 400);
  v('dopo i rifiuti i dati ci sono ancora', righe(await riepilogo(), 'soggetti') === 2);
  v('il tenant di sistema non si elimina -> 409', (await req('api-gateway-1', 'DELETE', '/piattaforma/tenant/1/dati', ROOT, { modo: 'dati', conferma: 1 })).s === 409);

  // solo i dati: la configurazione resta, Vigilo resta avviato
  const d = await req('api-gateway-2', 'DELETE', dati, ROOT, { modo: 'dati', conferma: T });
  console.log('   esito "dati":', JSON.stringify(d.j && d.j.data));
  v('"solo i dati": 2 soggetti e 1 documento tolti', d.s === 200 && d.j.data.righe.soggetti === 2 && d.j.data.file.tolti === 1 && d.j.data.file.nonTolti === 0, d.j);
  rp = await riepilogo();
  v('"solo i dati": dati a zero', somma(rp.dati) === 0 && rp.documenti.numero === 0, rp.dati);
  v('"solo i dati": configurazione intatta e avviato', rp.avviato && JSON.stringify(rp.configurazione.map(r => r.righe)) === JSON.stringify(confPrima), rp.configurazione);
  v('dopo "solo i dati" si lavora subito (nuovo soggetto)', [200, 201].includes((await req('api-gateway-1', 'POST', '/soggetti', ADMIN_T, { tipo: 'veicolo', nome: 'Furgone dopo', categoria: cv.uuid })).s));

  // tutto: torna come appena attivato
  const t = await req('api-gateway-1', 'DELETE', dati, ROOT, { modo: 'tutto', conferma: T });
  v('"tutto": esito con le righe e che cosa resta', t.s === 200 && t.j.data.righe.impostazioni === 1 && t.j.data.righe.soggetti === 1 && /procedura di avvio/.test(t.j.data.resta), t.j);
  rp = await riepilogo('api-gateway-2');
  v('"tutto": dati e configurazione a zero, non avviato', !rp.avviato && somma(rp.dati) === 0 && somma(rp.configurazione) === 0, rp);
  const avvio = await g('/avvio');
  v('"tutto": la procedura di avvio si riapre', avvio.s === 200, avvio.j);

  // audit
  await new Promise(r => setTimeout(r, 2048));
  const q = new URLSearchParams({ limit: '8', search: `tenant ${T}` });
  const lg = await fetch(`http://api-gateway-1:8080/api/log/azioni?${q}`, { headers: { Authorization: `Bearer ${ROOT}` } }).then(r => r.json());
  const ev = lg.logs.filter(l => l.sottoCategoria === 'vigilo.dati.eliminati');
  for (const l of ev) console.log('   audit:', l.azione.operazione);
  v('due eventi di audit, con chi e i conteggi', ev.length >= 2 && ev.every(l => l.origine.id === '1' && l.azione.dettagli.tenantEliminato === T && l.categoria === 'AUDIT'), ev.length);
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message, e.stack));
