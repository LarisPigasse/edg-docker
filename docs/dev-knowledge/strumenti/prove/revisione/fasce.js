// A+B: fasce "in scadenza" che non si sovrappongono, sui due gateway
const jwt = require('/app/node_modules/jsonwebtoken');
const T = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const g = async (gw, p) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { headers: { Authorization: `Bearer ${T}` } }); return { s: r.status, j: await r.json() }; };
const piu = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
(async () => {
  for (const gw of ['api-gateway-1', 'api-gateway-2']) {
    const d = (await g(gw, '/dashboard')).j.data, c = d.conteggi, oggi = d.oggi;
    console.log(gw, JSON.stringify(c));
    v(`${gw}: entro8 + entro32 + piuAvanti = inScadenza`, c.entro8 + c.entro32 + c.piuAvanti === c.inScadenza, c);
    const tutte = (await g(gw, '/scadenze?stati=scaduta,in-tolleranza,in-scadenza&pagina=1&righe=128')).j;
    v(`${gw}: Da fare = scadute + tolleranza + le tre fasce`, tutte.meta.total === c.scadute + c.inTolleranza + c.entro8 + c.entro32 + c.piuAvanti, [tutte.meta.total, c]);
    const r32 = (await g(gw, '/scadenze?stati=in-scadenza&oltre=8&entro=32&pagina=1&righe=128')).j;
    v(`${gw}: filtro oltre 8 entro 32 = entro32 (${c.entro32})`, r32.meta.total === c.entro32, r32.meta.total);
    v(`${gw}: tutte fra il giorno 9 e il 32`, r32.data.every(s => s.urgenzaIl > piu(oggi, 8) && s.urgenzaIl <= piu(oggi, 32)), r32.data.map(s => s.urgenzaIl));
    const r8 = (await g(gw, '/scadenze?stati=in-scadenza&entro=8&pagina=1&righe=128')).j;
    v(`${gw}: entro=8 da solo invariato (${c.entro8})`, r8.meta.total === c.entro8, r8.meta.total);
    const r33 = (await g(gw, '/scadenze?stati=in-scadenza&oltre=32&pagina=1&righe=128')).j;
    v(`${gw}: oltre=32 da solo = piuAvanti con data (${r33.meta.total})`, r33.meta.total <= c.piuAvanti && r33.data.every(s => s.urgenzaIl > piu(oggi, 32)), r33.data.map(s => s.urgenzaIl));
    v(`${gw}: oltre fuori limite -> 400`, (await g(gw, '/scadenze?oltre=8192')).s === 400);
    v(`${gw}: oltre non numerico -> 400`, (await g(gw, '/scadenze?oltre=abc')).s === 400);
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
