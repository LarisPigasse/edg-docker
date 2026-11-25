// Fase 1 log, passi 1c+1d: categoria USO e accessi ai moduli registrati dal gateway (ADR117).
// Nel container auth-service, DOPO la ricostruzione di log-service e dei due gateway.
// Lascia nei log (che non si cancellano) 3 accessi di prova degli account demo, riconoscibili
// dallo user-agent "prova-1d" e da sessioni "prova-1d-…".
const jwt = require('/app/node_modules/jsonwebtoken');
const Redis = require('/app/node_modules/ioredis');
const E = process.env;
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 300) : ''}`); };
const firma = o => jwt.sign(o, E.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
const ROOT = firma({ accountType: 'operatore', modules: ['*'], tenantId: 1, systemTenant: true, accountId: 1, email: 'root.prova@expressdeliverygroup.com', roleId: 1, permissions: ['*'] });
const DEMO_ADMIN = 'demo.admin@expressdeliverygroup.com';
const DEMO_UTENTE = 'demo.utente@expressdeliverygroup.com';
const cliente = sessionId => firma({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: DEMO_ADMIN, roleId: 2, permissions: ['vigilo.*'], sessionId });
const UA = 'prova-1d';
const g = async (gw, p, t, extra = {}) => { const r = await fetch(`http://${gw}:8080${p}`, { headers: { Authorization: `Bearer ${t}`, 'User-Agent': UA, ...extra } }); return { s: r.status, j: await r.json().catch(() => null) }; };
const pausa = ms => new Promise(r => setTimeout(r, ms));
const prova = `prova-1d-${Date.now().toString(36)}`;
const S1 = `${prova}-a`, S2 = `${prova}-b`;
(async () => {
  const redis = new Redis(E.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  await redis.connect();
  const prima = new Date().toISOString();

  // 1) stessa sessione su tutti e due i gateway: un solo accesso
  for (const gw of ['api-gateway-1', 'api-gateway-2', 'api-gateway-1']) v(`${gw}: GET /api/vigilo/me (${S1})`, (await g(gw, '/api/vigilo/me', cliente(S1))).s === 200);
  // 2) campanella in sottofondo: nessun accesso; poi la stessa sessione apre Vigilo: un accesso
  v('campanella (x-edg-sfondo) -> 200', (await g('api-gateway-2', '/api/vigilo/avvisi?limit=1', cliente(S2), { 'x-edg-sfondo': '1' })).s === 200);
  await pausa(1024);
  v('dopo la campanella nessun segno in Redis', (await redis.exists(`uso:${S2}:vigilo`)) === 0);
  v('apertura di Vigilo nella stessa sessione -> 200', (await g('api-gateway-1', '/api/vigilo/avvisi?limit=1', cliente(S2))).s === 200);
  // 3) accesso assistito (modo assistenza, sola lettura): l'operatore EDG nell'evento
  const assistito = firma({
    accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 4, email: DEMO_UTENTE, roleId: 4, permissions: ['vigilo.own'],
    assistenza: { id: 900001, modo: 'assistenza', operatore: { id: 3, email: 'system@expressdeliverygroup.com', nome: 'Admin EDG (prova)' }, tenant: { id: 2, nome: 'Tenant Demo Edg' }, perConto: { id: 4, email: DEMO_UTENTE, nome: 'Utente Demo' }, scade: new Date(Date.now() + 3e5).toISOString() },
  });
  v('assistenza: GET /api/vigilo/me -> 200', (await g('api-gateway-2', '/api/vigilo/me', assistito)).s === 200);
  await pausa(2048);

  // Redis: segni con la pausa del parametro (32 minuti predefiniti)
  const ttl = await redis.ttl(`uso:${S1}:vigilo`);
  v('segno in Redis con la pausa (fra 31 e 32 minuti)', ttl > 31 * 60 && ttl <= 32 * 60, ttl);
  v('segno della sessione assistita', (await redis.exists('uso:as900001:vigilo')) === 1);

  // Eventi registrati
  const r = await g('api-gateway-1', `/api/log/azioni?limit=64&categoria=USO&startDate=${encodeURIComponent(prima)}`, ROOT);
  v('categoria USO filtrabile (200)', r.s === 200, r.j);
  const miei = (r.j?.logs ?? []).filter(l => l.contesto?.userAgent === UA);
  for (const l of miei) console.log('  ', l.timestamp, l.azione.entita, l.sottoCategoria, l.modulo, '|', l.azione.operazione, '| sessione', l.azione.dettagli?.sessione);
  const di = s => miei.filter(l => l.azione.dettagli?.sessione === s);
  v(`${S1}: un solo accesso per tre richieste su due gateway`, di(S1).length === 1, di(S1).length);
  v(`${S2}: un accesso (la campanella non conta)`, di(S2).length === 1, di(S2).length);
  const e = di(S1)[0];
  v('evento: USO, vigilo.accesso, modulo vigilo, da un gateway', e && e.categoria === 'USO' && e.sottoCategoria === 'vigilo.accesso' && e.modulo === 'vigilo' && /^api-gateway-[12]$/.test(e.azione.entita), e);
  v('evento: utente e tenant', e && e.origine.id === '9' && e.origine.dettagli.tenantId === 2 && e.origine.dettagli.email === DEMO_ADMIN);
  const a = di('as900001')[0];
  v("assistenza: evento con l'operatore EDG", a && a.azione.dettagli.assistenza?.operatore?.id === 3 && /assistenza EDG: Admin EDG \(prova\)/.test(a.azione.operazione), a && a.azione);
  const st = await g('api-gateway-2', `/api/log/statistiche?startDate=${encodeURIComponent(prima)}`, ROOT);
  v('statistiche: conteggio della categoria USO', st.s === 200 && st.j.byCategory?.USO >= 3, st.j && st.j.byCategory);
  const m = await g('api-gateway-2', `/api/log/azioni?limit=1&modulo=vigilo&categoria=USO&startDate=${encodeURIComponent(prima)}`, ROOT);
  v('filtri insieme: modulo vigilo + categoria USO', m.s === 200 && m.j.totalCount >= 3, m.j && m.j.totalCount);

  await redis.del(`uso:${S1}:vigilo`, `uso:${S2}:vigilo`, 'uso:as900001:vigilo');
  await redis.quit();
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
