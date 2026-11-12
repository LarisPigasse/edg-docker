// Rifornimenti: registratoDa sui due gateway (DAF XF 01)
const jwt = require('/app/node_modules/jsonwebtoken');
const T = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 300) : ''}`); };
(async () => {
  for (const gw of ['api-gateway-1', 'api-gateway-2']) {
    const g = async p => (await fetch(`http://${gw}:8080/api/vigilo${p}`, { headers: { Authorization: `Bearer ${T}` } })).json();
    const r = await g('/rifornimenti?soggetto=dfe34431-f501-41bb-a08e-cfd57918eede&pagina=1&righe=128');
    const autori = {};
    for (const x of r.data) autori[x.registratoDa ?? 'null'] = (autori[x.registratoDa ?? 'null'] || 0) + 1;
    console.log(gw, r.meta.total, 'rifornimenti, prima pagina', r.data.length, 'autori', JSON.stringify(autori));
    v(`${gw}: ogni rifornimento ha registratoDa`, r.data.length > 0 && r.data.every(x => 'registratoDa' in x), r.data[0]);
    const uno = (await g(`/rifornimenti/${r.data[0].uuid}`)).data;
    v(`${gw}: anche il dettaglio`, uno.registratoDa === r.data[0].registratoDa, uno);
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
