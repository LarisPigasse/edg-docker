// Fase 1 autori: nomi nel dettaglio di un guasto e nello storico, sui due gateway
const jwt = require('/app/node_modules/jsonwebtoken');
const T = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const g = async (gw, p) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { headers: { Authorization: `Bearer ${T}` } }); return { s: r.status, j: await r.json() }; };
(async () => {
  for (const gw of ['api-gateway-1', 'api-gateway-2']) {
    const l = (await g(gw, '/scadenze?testo=Centralina&stati=scaduta,in-tolleranza,in-scadenza&pagina=1&righe=8')).j.data;
    const guasto = l.find(s => s.natura === 'riparazione');
    const d = (await g(gw, `/scadenze/${guasto.uuid}`)).j.data;
    console.log(gw, 'guasto', d.titolo, 'aggiunta', JSON.stringify(d.aggiunta));
    v(`${gw}: guasto con chi l'ha segnalato`, d.aggiunta && d.aggiunta.da === 'Demo Admin' && !!d.aggiunta.il, d.aggiunta);
    // una scadenza di un controllo: nessuna "aggiunta"
    const c = (await g(gw, '/scadenze?stati=in-scadenza&pagina=1&righe=32')).j.data.find(s => s.controllo);
    const dc = (await g(gw, `/scadenze/${c.uuid}`)).j.data;
    v(`${gw}: scadenza di un controllo senza "aggiunta"`, dc.aggiunta === null, dc.aggiunta);
    const conReg = dc.registrazioni.length ? dc : null;
    if (conReg) v(`${gw}: registrazioni del dettaglio con l'autore`, conReg.registrazioni.every(r => 'registrataDa' in r && 'automatica' in r && 'confermataDa' in r), conReg.registrazioni[0]);
    const s = (await g(gw, `/registrazioni?soggetto=${guasto.soggetto.uuid}&pagina=1&righe=32`)).j;
    const autori = [...new Set(s.data.map(r => r.registrataDa))];
    console.log(gw, 'storico', s.data.length, 'righe, autori', JSON.stringify(autori), 'esempio', JSON.stringify(s.data[0] && { tipo: s.data[0].tipo, registrataDa: s.data[0].registrataDa, automatica: s.data[0].automatica }));
    v(`${gw}: storico del soggetto con i nomi`, s.data.length > 0 && s.data.every(r => r.automatica || r.registrataDa), autori);
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
