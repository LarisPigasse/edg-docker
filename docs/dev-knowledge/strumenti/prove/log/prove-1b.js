// Fase 1 log, passo 1b: campo modulo, filtro Modulo, ricerca come testo, filtri solo testuali.
// Nel container auth-service, DOPO la ricostruzione di log-service e assegnaModulo.js. Solo lettura
// (una richiesta a una rotta inesistente di Vigilo per far nascere, se il servizio lo registra, un evento nuovo).
const jwt = require('/app/node_modules/jsonwebtoken');
const E = process.env;
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 240) : ''}`); };
const f = o => jwt.sign({ accountType: 'operatore', modules: ['*'], tenantId: 1, systemTenant: true, ...o }, E.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
const ROOT = f({ accountId: 1, email: 'root.prova@expressdeliverygroup.com', roleId: 1, permissions: ['*'] });
const CLI = jwt.sign({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', roleId: 2, permissions: ['vigilo.*'] }, E.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
const g = async (gw, p, t = ROOT) => { const r = await fetch(`http://${gw}:8080${p}`, { headers: { Authorization: `Bearer ${t}` } }); return { s: r.status, j: await r.json().catch(() => null) }; };
const quanti = async (gw, q) => { const r = await g(gw, `/api/log/azioni?limit=1&${q}`); if (r.s !== 200) throw new Error(`${q} -> ${r.s} ${JSON.stringify(r.j).slice(0, 160)}`); return r.j.totalCount; };
(async () => {
  for (const gw of ['api-gateway-1', 'api-gateway-2']) {
    const tutti = await quanti(gw, '');
    const vig = await quanti(gw, 'modulo=vigilo');
    const pia = await quanti(gw, 'modulo=piattaforma');
    const daServizi = (await quanti(gw, 'entita=vigilo-service')) + (await quanti(gw, 'entita=vehicle-service'));
    console.log(`${gw}: tutti ${tutti}, vigilo ${vig}, piattaforma ${pia}, eventi di vigilo-service + vehicle-service ${daServizi}`);
    v(`${gw}: vigilo + piattaforma = tutti (nessun evento senza modulo)`, vig + pia === tutti, { tutti, vig, pia });
    v(`${gw}: modulo vigilo = eventi dei suoi servizi`, vig === daServizi, { vig, daServizi });
    const lv = await g(gw, '/api/log/azioni?limit=64&modulo=vigilo');
    v(`${gw}: gli eventi del filtro vigilo hanno modulo 'vigilo'`, lv.j.logs.length > 0 && lv.j.logs.every(l => l.modulo === 'vigilo'));
    const lp = await g(gw, '/api/log/azioni?limit=64&modulo=piattaforma');
    v(`${gw}: gli eventi della piattaforma hanno modulo null`, lp.j.logs.length > 0 && lp.j.logs.every(l => l.modulo === null));
    v(`${gw}: modulo sconosciuto -> nessun evento`, (await quanti(gw, 'modulo=spedizioni')) === 0);
    v(`${gw}: modulo non valido -> nessun evento (non ignorato)`, (await quanti(gw, `modulo=${encodeURIComponent('Vigilo!')}`)) === 0);
    const st = await g(gw, '/api/log/statistiche?modulo=vigilo');
    v(`${gw}: statistiche filtrate per modulo`, st.s === 200 && st.j.total === vig, st.j && st.j.total);
    v(`${gw}: ricerca "(" non rompe (200)`, (await g(gw, `/api/log/azioni?limit=1&search=${encodeURIComponent('(')}`)).s === 200);
    const lett = await g(gw, `/api/log/azioni?limit=64&search=${encodeURIComponent('auth.servic')}`);
    v(`${gw}: il punto di "Cerca" è un punto, non "qualunque carattere"`, lett.s === 200 && lett.j.totalCount === 0, lett.j && lett.j.totalCount);
    v(`${gw}: categoria[$ne]=AUTH non diventa un operatore (= nessun filtro)`, (await quanti(gw, `categoria${encodeURIComponent('[$ne]')}=AUTH`)) === tutti);
  }
  // Evento nuovo: il modulo si assegna alla scrittura (hook del modello)
  const prima = new Date().toISOString();
  await g('api-gateway-1', '/api/vigilo/prova-1b-rotta-inesistente', CLI);
  await new Promise(r => setTimeout(r, 2048));
  const nuovi = await g('api-gateway-2', `/api/log/azioni?limit=64&startDate=${encodeURIComponent(prima)}`);
  for (const l of nuovi.j.logs) console.log('  nuovo:', l.azione.entita, l.sottoCategoria, '-> modulo', JSON.stringify(l.modulo));
  v('gli eventi nuovi hanno il campo modulo', nuovi.j.logs.every(l => 'modulo' in l));
  const nv = nuovi.j.logs.filter(l => l.azione.entita === 'vigilo-service');
  if (nv.length) v("evento nuovo di vigilo-service -> modulo 'vigilo'", nv.every(l => l.modulo === 'vigilo'));
  else console.log('   (vigilo-service non ha registrato la rotta inesistente: controllo degli eventi nuovi di Vigilo dal browser)');
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
