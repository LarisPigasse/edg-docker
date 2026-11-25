// Fase 2 log, passo 2b: riepilogo dell'uso di un tenant e ultimo uso dei tenant (ADR117). Solo lettura.
// Nel container auth-service, DOPO la ricostruzione di log-service.
const jwt = require('/app/node_modules/jsonwebtoken');
const E = process.env;
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 300) : ''}`); };
const firma = o => jwt.sign(o, E.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
const ADMIN_EDG = firma({ accountType: 'operatore', modules: ['*'], tenantId: 1, systemTenant: true, accountId: 3, email: 'system@expressdeliverygroup.com', roleId: 2, permissions: ['sistema.logs', 'sistema.tenant'] });
const OPER_EDG = firma({ accountType: 'operatore', modules: ['*'], tenantId: 1, systemTenant: true, accountId: 2, email: 'operatore@expressdeliverygroup.com', roleId: 3, permissions: ['system.read'] });
const CLI = firma({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', roleId: 2, permissions: ['vigilo.*', 'sistema.logs'] });
const g = async (gw, p, t = ADMIN_EDG) => { const r = await fetch(`http://${gw}:8080/api/log${p}`, { headers: { Authorization: `Bearer ${t}` } }); return { s: r.status, j: await r.json().catch(() => null) }; };
(async () => {
  for (const gw of ['api-gateway-1', 'api-gateway-2']) {
    const r = await g(gw, '/uso?tenantId=2');
    v(`${gw}: riepilogo del Tenant Demo (200, 32 giorni)`, r.s === 200 && r.j.giorni === 32 && r.j.tenantId === 2, r);
    const u = r.j;
    const vig = u.moduli.find(m => m.modulo === 'vigilo');
    console.log('   vigilo:', JSON.stringify(vig));
    console.log('   persone:', u.persone.map(p => `${p.email} acc ${p.accessi} cons ${p.consultazioni} mod ${p.modifiche} login ${p.login} [${p.moduli}]`).join(' · '));
    console.log('   assistenza:', JSON.stringify(u.assistenza));
    v(`${gw}: Vigilo con accessi, consultazioni e persone`, vig && vig.accessi > 0 && vig.consultazioni > 0 && vig.persone > 0, vig);
    // i conti tornano con l'elenco dei log: USO di Vigilo nel periodo = cliente + assistenza EDG
    const q = new URLSearchParams({ limit: '1', tenantId: '2', modulo: 'vigilo', categoria: 'USO', startDate: u.dal, endDate: u.al });
    const tot = (await g(gw, `/azioni?${q}`)).j.totalCount;
    const somma = vig.accessi + vig.consultazioni + u.assistenza.accessi + u.assistenza.consultazioni;
    v(`${gw}: accessi + consultazioni (cliente + assistenza) = eventi USO dei Logs (${tot})`, somma === tot, { somma, tot });
    v(`${gw}: l'assistenza EDG è a parte, con l'operatore`, u.assistenza.accessi >= 1 && u.assistenza.operatori.includes('Admin EDG (prova)'), u.assistenza);
    const op = u.persone.find(p => p.accountId === '10');
    v(`${gw}: l'operatore demo fra le persone, con le sue consultazioni`, op && op.consultazioni >= 12 && op.moduli.includes('vigilo'), op);
    const conVigilo = u.persone.filter(p => p.moduli.includes('vigilo')).length;
    v(`${gw}: persone di Vigilo = persone dell'elenco che lo usano (${conVigilo})`, vig.persone === conVigilo, { modulo: vig.persone, elenco: conVigilo });
    v(`${gw}: persone dal più recente`, u.persone.every((p, i) => i === 0 || new Date(u.persone[i - 1].ultimoUso) >= new Date(p.ultimoUso)));
    v(`${gw}: giorni=8 -> 8`, (await g(gw, '/uso?tenantId=2&giorni=8')).j?.giorni === 8);
    v(`${gw}: giorni=9999 -> 256 (massimo)`, (await g(gw, '/uso?tenantId=2&giorni=9999')).j?.giorni === 256);
    v(`${gw}: giorni=abc -> 32`, (await g(gw, '/uso?tenantId=2&giorni=abc')).j?.giorni === 32);
    v(`${gw}: senza tenant -> 400`, (await g(gw, '/uso')).s === 400);
    v(`${gw}: operatore EDG -> 403`, (await g(gw, '/uso?tenantId=2', OPER_EDG)).s === 403);
    v(`${gw}: admin del cliente -> 403`, (await g(gw, '/uso?tenantId=2', CLI)).s === 403);
    const t = await g(gw, '/uso/tenant');
    const demo = t.j?.tenant?.find(x => x.tenantId === 2);
    console.log('   ultimo uso:', JSON.stringify(t.j?.tenant));
    v(`${gw}: ultimo uso dei tenant (Tenant Demo nell'ultima ora, con accessi e persone)`, t.s === 200 && demo && Date.now() - new Date(demo.ultimoUso) < 3.6e6 && demo.accessi > 0 && demo.persone > 0, t.j);
    v(`${gw}: ultimo uso: operatore EDG -> 403`, (await g(gw, '/uso/tenant', OPER_EDG)).s === 403);
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
