// Analisi fase D: segnali e soglie (una soglia cambiata e rimessa com'era), limiti, permessi
const jwt = require('/app/node_modules/jsonwebtoken');
const f = o => jwt.sign({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, ...o }, process.env.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
const T = f({ roleId: 2, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const TW = f({ roleId: 3, accountId: 10, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.read', 'vigilo.write', 'vigilo.costi'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 300) : ''}`); };
const g = async (gw, p, m = 'GET', b, t = T) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: m, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
(async () => {
  const a = (await g('api-gateway-1', '/analisi')).j.data;
  const s0 = a.soglie;
  console.log('soglie', JSON.stringify(s0), '· modificabili', a.soglieModificabili);
  for (const x of a.segnali) console.log(' ', x.gravita, '|', x.titolo, '|', x.dettaglio);
  v('il DAF consuma più della sua categoria: segnale', a.segnali.some(x => x.tipo === 'consumoAlto' && /DAF/.test(x.titolo)));
  v('la struttura fuori soglia: segnale', a.segnali.some(x => x.tipo === 'struttura'));
  v('dal più grave', a.segnali.every((x, i) => i === 0 || ['alta', 'media', 'bassa'].indexOf(a.segnali[i - 1].gravita) <= ['alta', 'media', 'bassa'].indexOf(x.gravita)));
  try {
    v('chi non ha vigilo.config non cambia le soglie -> 403', (await g('api-gateway-2', '/analisi/soglie', 'PATCH', { consumoAlto: 32 }, TW)).s === 403);
    v('soglia fuori limite -> 400', (await g('api-gateway-1', '/analisi/soglie', 'PATCH', { consumoAlto: 0 })).s === 400);
    const c = await g('api-gateway-2', '/analisi/soglie', 'PATCH', { consumoAlto: 32 });
    v('consumo alto al 32%: il segnale del DAF sparisce (gw2)', c.s === 200 && c.j.data.soglie.consumoAlto === 32 && !c.j.data.segnali.some(x => x.tipo === 'consumoAlto'), c.j && c.j.message);
    const k = await g('api-gateway-1', '/analisi/soglie', 'PATCH', { kmMeseMinimi: 2048 });
    v('poco usato sotto i 2048 km/mese: compaiono i segnali (gw1)', k.j.data.segnali.filter(x => x.tipo === 'pocoUsato').length > 0 && k.j.data.operativita.utilizzo.soglia === 2048);
  } finally {
    const r = await g('api-gateway-1', '/analisi/soglie', 'PATCH', s0);
    console.log('rimesse:', JSON.stringify(r.j.data.soglie));
    v('soglie rimesse com\'erano', JSON.stringify(r.j.data.soglie) === JSON.stringify(s0));
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
