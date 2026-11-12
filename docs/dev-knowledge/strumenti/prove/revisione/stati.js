// Dopo il ricalcolo: nessuna scadenza aperta "in scadenza" con la data passata; dashboard uguale sui due gateway
const jwt = require('/app/node_modules/jsonwebtoken');
const T = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const g = async (gw, p) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { headers: { Authorization: `Bearer ${T}` } }); return { s: r.status, j: await r.json() }; };
(async () => {
  const conteggi = [];
  for (const gw of ['api-gateway-1', 'api-gateway-2']) {
    const d = await g(gw, '/dashboard');
    v(`${gw}: dashboard 200`, d.s === 200, d.j);
    const c = d.j.data.conteggi, oggi = d.j.data.oggi;
    conteggi.push(JSON.stringify(c));
    console.log(gw, 'oggi', oggi, JSON.stringify(c));
    const l = await g(gw, '/scadenze?stati=in-scadenza&ordina=urgenza&pagina=1&righe=128');
    const passate = l.j.data.filter(s => s.scadeIl && s.scadeIl < oggi && !s.sogliaUso);
    v(`${gw}: nessuna "in scadenza" con la data passata`, passate.length === 0, passate.map(s => [s.titolo, s.soggetto && s.soggetto.nome, s.scadeIl, s.testo]));
    v(`${gw}: in scadenza = elenco`, l.j.meta.total === c.inScadenza, [l.j.meta.total, c.inScadenza]);
    for (const nome of ['Iveco S-Way 02', 'Luca Ferretti']) {
      const x = await g(gw, `/scadenze?testo=${encodeURIComponent(nome)}&stati=scaduta,in-tolleranza,in-scadenza&pagina=1&righe=32`);
      for (const s of x.j.data.filter(s => s.scadeIl && s.scadeIl <= '2026-11-08')) console.log('   ', nome, '|', s.titolo, '|', s.stato, '|', s.testo);
    }
  }
  v('stessi conteggi sui due gateway', conteggi[0] === conteggi[1]);
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
