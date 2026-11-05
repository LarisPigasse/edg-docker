// Prove dal vivo di AA5: accessi dell'assistenza visibili al cliente, sui due gateway
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = p => jwt.sign({ accountType: 'operatore', roleId: 1, modules: ['*'], ...p }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const ROOT = firma({ accountId: 1, tenantId: 1, email: 'root@expressdeliverygroup.com', permissions: ['*'], systemTenant: true });
const ADMIN = firma({ accountId: 9, tenantId: 2, email: 'demo.admin@expressdeliverygroup.com', accountType: 'cliente', permissions: ['vigilo.*', 'account.assistenze'], modules: ['vigilo'], systemTenant: false });
const OPER = firma({ accountId: 10, tenantId: 2, email: 'demo.operatore@expressdeliverygroup.com', accountType: 'cliente', permissions: ['vigilo.write', 'vigilo.costi'], modules: ['vigilo'], systemTenant: false });
const EDG = firma({ accountId: 1, tenantId: 1, email: 'root@expressdeliverygroup.com', permissions: ['account.assistenze'], systemTenant: true });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' → ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const c = async (gw, t, m, p, b) => {
  const r = await fetch(`http://${gw}:8080${p}`, { method: m, headers: { ...(t ? { Authorization: `Bearer ${t}` } : {}), 'Content-Type': 'application/json' }, ...(b ? { body: JSON.stringify(b) } : {}) });
  let j = null; try { j = await r.json(); } catch {}
  return { s: r.status, j, d: j?.data };
};
const STATI = ['aperta', 'uscita', 'scaduta', 'chiusa'];
const URL = '/auth/assistenza/nel-mio-tenant';
(async () => {
  try {
    for (const gw of ['api-gateway-1', 'api-gateway-2']) {
      const a = await c(gw, ADMIN, 'GET', URL);
      v(`${gw}: admin del cliente → 200 con l'elenco`, a.s === 200 && Array.isArray(a.d) && a.d.length > 0 && a.d.length <= 64, a.j);
      v(`${gw}: forma giusta (operatore è un nome, stato noto, date ISO)`, a.d?.every(x => typeof x.operatore === 'string' && x.operatore && STATI.includes(x.stato) && !isNaN(Date.parse(x.inizio)) && x.uuid), a.d?.[0]);
      v(`${gw}: nessuna email del personale EDG`, !JSON.stringify(a.d).includes('@') && a.d?.every(x => !('email' in x) && !('id' in x)), a.d?.[0]);
      v(`${gw}: dal più recente`, a.d?.every((x, i, l) => !i || Date.parse(l[i - 1].inizio) >= Date.parse(x.inizio)));
      v(`${gw}: Assistenza con "come", Preparazione senza`, a.d?.every(x => (x.modo === 'assistenza') === !!x.perConto), a.d?.find(x => (x.modo === 'assistenza') !== !!x.perConto));
      v(`${gw}: operatore senza permesso → 403`, (await c(gw, OPER, 'GET', URL)).s === 403);
      v(`${gw}: senza token → 401`, (await c(gw, null, 'GET', URL)).s === 401);
      const due = await c(gw, ADMIN, 'GET', URL + '?limit=2');
      v(`${gw}: limit=2 → 2`, due.s === 200 && due.d.length === 2, due.j);
      v(`${gw}: limit=65 → 400`, (await c(gw, ADMIN, 'GET', URL + '?limit=65')).s === 400);
      v(`${gw}: limit=0 → 400`, (await c(gw, ADMIN, 'GET', URL + '?limit=0')).s === 400);
      const sis = await c(gw, EDG, 'GET', URL);
      v(`${gw}: tenant di sistema → nessun accesso (ognuno vede solo il suo)`, sis.s === 200 && sis.d.length === 0, sis.j);
    }
    // Un accesso aperto ora come demo.utente: in cima, "aperta", come Demo Utente
    const ap = await c('api-gateway-1', ROOT, 'POST', '/auth/assistenza', { tenantId: 2, modo: 'assistenza', motivo: 'Prova AA5: accesso visto dal cliente', perConto: 4 });
    v('apertura come demo.utente', ap.s === 201, ap.j);
    const primo = (await c('api-gateway-2', ADMIN, 'GET', URL)).d?.[0];
    v('in cima, "aperta", come Demo Utente, col motivo', primo?.stato === 'aperta' && primo.perConto === 'Demo Utente' && primo.motivo === 'Prova AA5: accesso visto dal cliente' && primo.fine === null, primo);
    const sc = await c('api-gateway-1', null, 'POST', '/auth/assistenza/scambio', { codice: ap.d.codice });
    v('nella scheda assistita come addetto la pagina non si apre: 403', (await c('api-gateway-1', sc.d.accessToken, 'GET', URL)).s === 403);
    v('chiusura da EDG', (await c('api-gateway-2', ROOT, 'DELETE', `/auth/assistenza/${ap.d.sessione.id}`)).s === 200);
    const dopo = (await c('api-gateway-1', ADMIN, 'GET', URL)).d?.[0];
    v('dopo la chiusura: "chiusa" con la fine', dopo?.uuid === primo?.uuid && dopo.stato === 'chiusa' && !!dopo.fine, dopo);
    // Come demo.admin in sola lettura: la pagina si legge
    const ap2 = await c('api-gateway-1', ROOT, 'POST', '/auth/assistenza', { tenantId: 2, modo: 'assistenza', motivo: 'Prova AA5: vista dell’admin', perConto: 9 });
    const sc2 = await c('api-gateway-2', null, 'POST', '/auth/assistenza/scambio', { codice: ap2.d.codice });
    const vista = await c('api-gateway-2', sc2.d.accessToken, 'GET', URL);
    v('come demo.admin in sola lettura: la pagina si legge', vista.s === 200 && vista.d[0]?.stato === 'aperta', vista.j);
    v('uscita', (await c('api-gateway-2', sc2.d.accessToken, 'POST', '/auth/assistenza/fine')).s === 200);
  } catch (e) { ko++; console.log('ERRORE', e.message); }
  console.log(`TOTALE: ${ok} ok, ${ko} ko`);
})();
