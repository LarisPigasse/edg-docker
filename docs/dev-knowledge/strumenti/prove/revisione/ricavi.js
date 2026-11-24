// Fase A dell'Analisi: ricavi dell'anno e prezzo/margine delle stime salvate; tutto torna com'era
const jwt = require('/app/node_modules/jsonwebtoken');
const T = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
const g = async (gw, p, metodo = 'GET', corpo) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
let stima = null;
(async () => {
  const p0 = (await g(G1, '/stima/parametri')).j.data;
  const anno = p0.annoDiRiferimento;
  const a0 = p0.anni.find(a => a.anno === anno);
  const corpo = r => ({ stato: a0.stato, voci: a0.voci, oreServizio: a0.oreServizio, kmAnnui: a0.kmAnnui, quotaMezzi: a0.quotaMezzi, note: a0.note, ricavi: r });
  console.log('anno', anno, 'ricavi prima', a0.ricavi);
  try {
    const s1 = await g(G1, `/stima/anni/${anno}`, 'PUT', corpo(512000));
    v('ricavi salvati (gw1) e letti (gw2)', s1.s === 200 && (await g(G2, '/stima/parametri')).j.data.anni.find(a => a.anno === anno).ricavi === 512000, s1.j && s1.j.message);
    v('ricavi negativi -> 400', (await g(G2, `/stima/anni/${anno}`, 'PUT', corpo(-1))).s === 400);
    v('ricavi oltre il limite -> 400', (await g(G1, `/stima/anni/${anno}`, 'PUT', corpo(2 ** 31))).s === 400);
    // stima di prova
    const n = await g(G1, '/stima/stime', 'POST', { tipo: 'km', km: 100, descrizione: 'Prova margine' });
    stima = n.j.data.uuid;
    const tot = n.j.data.totale;
    console.log('stima di prova', tot, '€');
    const pz = await g(G2, `/stima/stime/${stima}/prezzo`, 'PATCH', { prezzo: tot + 200 });
    v('prezzo: margine +200 sulla stima', pz.s === 200 && pz.j.data.margine.euro === 200 && pz.j.data.margine.base === 'stimato', pz.j.data && pz.j.data.margine);
    const re = await g(G1, `/stima/stime/${stima}/reale`, 'PATCH', { costoReale: tot + 250, note: null });
    v('con il costo reale il margine è sul reale (-50)', re.j.data.margine.euro === -50 && re.j.data.margine.base === 'reale', re.j.data.margine);
    const riga = (await g(G2, '/stima/stime')).j.data.find(x => x.uuid === stima);
    v('l\'elenco ha prezzo e margine', riga.prezzo === tot + 200 && riga.margine.euro === -50, riga);
    v('prezzo negativo -> 400', (await g(G1, `/stima/stime/${stima}/prezzo`, 'PATCH', { prezzo: -5 })).s === 400);
    const tolto = await g(G2, `/stima/stime/${stima}/prezzo`, 'PATCH', { prezzo: null });
    v('tolto il prezzo: nessun margine', tolto.j.data.prezzo === null && tolto.j.data.margine === null);
  } finally {
    if (stima) console.log('stima di prova eliminata', (await g(G1, `/stima/stime/${stima}`, 'DELETE')).s);
    await g(G1, `/stima/anni/${anno}`, 'PUT', corpo(a0.ricavi ?? null));
    console.log('alla fine: ricavi', (await g(G1, '/stima/parametri')).j.data.anni.find(a => a.anno === anno).ricavi);
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
