// Report "Controlli non seguiti" (GET /controlli-non-seguiti) sui due gateway; lascia 2 decisioni di prova
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = (o) => jwt.sign({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, ...o }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const T = firma({ roleId: 2, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const TA = firma({ roleId: 3, accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.own'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const g = async (gw, p, metodo = 'GET', corpo, tok = T) => {
  const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined });
  return { s: r.status, j: await r.json().catch(() => null) };
};
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
(async () => {
  for (const gw of [G1, G2]) {
    const r = await g(gw, '/controlli-non-seguiti');
    v(`${gw}: nessuna decisione all'inizio`, r.s === 200 && r.j.data.righe.length === 0 && r.j.data.troncate === false, r.j);
    v(`${gw}: quali sbagliato -> 400`, (await g(gw, '/controlli-non-seguiti?quali=altro')).s === 400);
    v(`${gw}: l'addetto non lo vede -> 403`, (await g(gw, '/controlli-non-seguiti', 'GET', null, TA)).s === 403);
  }
  const sog = (await g(G1, '/soggetti?testo=Iveco%20S-Way%2002&pagina=1&righe=8')).j.data.find(s => s.nome === 'Iveco S-Way 02');
  const c = (await g(G1, `/soggetti/${sog.uuid}/controlli`)).j.data.controlli;
  const bollo = c.find(x => /bollo/i.test(x.nome)), rca = c.find(x => /RCA/.test(x.nome));
  v('bollo non seguito (prova)', (await g(G1, `/soggetti/${sog.uuid}/controlli/${bollo.uuid}/non-seguire`, 'POST', { motivo: 'prova del report: mezzo esente' })).s === 200);
  v('RCA non seguita (prova)', (await g(G1, `/soggetti/${sog.uuid}/controlli/${rca.uuid}/non-seguire`, 'POST', { motivo: 'prova del report: assicurazione di flotta' })).s === 200);
  v('RCA ripresa (prova)', (await g(G2, `/soggetti/${sog.uuid}/controlli/${rca.uuid}/riprendi`, 'POST', { nota: 'fine della prova' })).s === 200);
  for (const gw of [G1, G2]) {
    const inc = (await g(gw, '/controlli-non-seguiti?quali=in-corso')).j.data.righe;
    const tut = (await g(gw, '/controlli-non-seguiti?quali=tutte')).j.data.righe;
    console.log(gw, 'in corso', JSON.stringify(inc[0]));
    v(`${gw}: in corso = il bollo, con soggetto, targa e Demo Admin`, inc.length === 1 && inc[0].controllo.nome === bollo.nome && inc[0].soggetto.identificativo === sog.identificativo && inc[0].decisaDa === 'Demo Admin' && !inc[0].ripresaIl, inc);
    const r = tut.find(x => x.controllo.nome === rca.nome);
    v(`${gw}: con lo storico = 2, la RCA ripresa da Demo Admin con la nota`, tut.length === 2 && r && r.ripresaDa === 'Demo Admin' && r.notaRipresa === 'fine della prova', tut);
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
