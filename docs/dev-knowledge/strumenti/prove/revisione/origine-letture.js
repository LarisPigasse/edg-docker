// Origine delle letture (registrazione o rifornimento) sui due gateway: DAF XF 01
const jwt = require('/app/node_modules/jsonwebtoken');
const T = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 300) : ''}`); };
(async () => {
  for (const gw of ['api-gateway-1', 'api-gateway-2']) {
    const g = async p => (await fetch(`http://${gw}:8080/api/vigilo${p}`, { headers: { Authorization: `Bearer ${T}` } })).json();
    const d = (await g('/soggetti/dfe34431-f501-41bb-a08e-cfd57918eede')).data;
    const l = (await g(`/contatori/${d.contatori[0].uuid}/letture?pagina=1&righe=128`)).data;
    const reg = l.filter(x => x.fonte === 'registrazione'), man = l.filter(x => x.fonte === 'manuale');
    console.log(gw, 'esempio', JSON.stringify(reg[0] && reg[0].origine));
    v(`${gw}: le ${reg.length} letture dei tagliandi hanno l'origine`, reg.length === 4 && reg.every(x => x.origine && x.origine.tipo === 'registrazione' && x.origine.titolo === 'Tagliando' && x.origine.il === x.lettoIl), reg.map(x => x.origine));
    v(`${gw}: le ${man.length} manuali no`, man.length > 0 && man.every(x => x.origine === null));
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
