// Fase 2 autori: chi ha chiuso, nell'elenco delle chiuse e nel dettaglio, sui due gateway
const jwt = require('/app/node_modules/jsonwebtoken');
const T = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const g = async (gw, p) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { headers: { Authorization: `Bearer ${T}` } }); return { s: r.status, j: await r.json() }; };
(async () => {
  for (const gw of ['api-gateway-1', 'api-gateway-2']) {
    const l = await g(gw, '/scadenze?aperte=false&pagina=1&righe=128');
    v(`${gw}: elenco delle chiuse 200`, l.s === 200, l.j);
    const righe = l.j.data;
    const motivi = {};
    for (const s of righe) { const k = `${s.chiusa.motivo}|${s.chiusa.automatica ? 'automatica' : s.chiusa.da || 'senza nome'}`; motivi[k] = (motivi[k] || 0) + 1; }
    console.log(gw, righe.length, 'chiuse su', l.j.meta.total, JSON.stringify(motivi));
    v(`${gw}: ogni chiusa ha "da" e "automatica"`, righe.every(s => 'da' in s.chiusa && 'automatica' in s.chiusa), righe[0]);
    v(`${gw}: le chiuse con una registrazione hanno il nome`, righe.filter(s => ['rinnovata', 'completata', 'fine-ricorrenza'].includes(s.chiusa.motivo)).every(s => s.chiusa.da || s.chiusa.automatica), Object.keys(motivi));
    const bollo = righe.find(s => /bollo/i.test(s.titolo));
    if (bollo) {
      const d = (await g(gw, `/scadenze/${bollo.uuid}`)).j.data;
      console.log(gw, 'bollo chiuso', bollo.soggetto && bollo.soggetto.nome, JSON.stringify(d.chiusa));
      v(`${gw}: il dettaglio di una chiusa dice chi l'ha chiusa`, !!d.chiusa && (d.chiusa.da === bollo.chiusa.da) && d.chiusa.automatica === bollo.chiusa.automatica, [d.chiusa, bollo.chiusa]);
    }
    const aperte = (await g(gw, '/scadenze?stati=in-scadenza&pagina=1&righe=8')).j.data;
    v(`${gw}: le aperte restano senza "chiusa"`, aperte.every(s => s.chiusa === null));
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
