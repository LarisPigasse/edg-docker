// Stima costi, fase 3: stime salvate sui due gateway; alla fine elimina tutto ciò che ha creato
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = o => jwt.sign({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, ...o }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const T = firma({ roleId: 2, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const TL = firma({ roleId: 3, accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.read'] });
const TC = firma({ roleId: 3, accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.read', 'vigilo.costi'] });
const DAF = 'dfe34431-f501-41bb-a08e-cfd57918eede';
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
const g = async (gw, p, metodo = 'GET', corpo, tok = T) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
const create = [];
(async () => {
  try {
    const corpo = { tipo: 'km', mezzo: DAF, km: 512, ritornoAVuoto: true, kmAutostrada: 400, oreAggiuntive: 2 };
    const calc = (await g(G1, '/stima/calcola', 'POST', corpo)).j.data;
    const s1 = await g(G1, '/stima/stime', 'POST', { ...corpo, descrizione: 'Prova Nereto → Milano' });
    if (s1.j?.data?.uuid) create.push(s1.j.data.uuid);
    v('salva (gw1) -> 201, totale ricalcolato come il calcolo, con la fotografia', s1.s === 201 && s1.j.data.totale === calc.risultato.totale && s1.j.data.usati.costoMezzo === calc.usati.costoMezzo && s1.j.data.salvataDa === 'Demo Admin' && s1.j.data.scostamento === null, s1.j);
    const s2 = await g(G2, '/stima/stime', 'POST', { tipo: 'km', km: 100, descrizione: '' });
    if (s2.j?.data?.uuid) create.push(s2.j.data.uuid);
    v('senza descrizione (gw2) -> "Trasporto di 100 km"', s2.s === 201 && s2.j.data.descrizione === 'Trasporto di 100 km', s2.j);
    const el = await g(G2, '/stima/stime');
    v('elenco (gw2): le più recenti per prime', el.s === 200 && el.j.data[0].uuid === s2.j.data.uuid && el.j.data[1].uuid === s1.j.data.uuid && el.j.meta.total >= 2, el.j.data.map(x => x.descrizione));
    const id = s1.j.data.uuid, tot = s1.j.data.totale;
    const r1 = await g(G1, `/stima/stime/${id}/reale`, 'PATCH', { costoReale: 1500, note: 'fattura carburante più alta' });
    const atteso = Math.round((1500 - tot) * 100) / 100;
    v('costo reale 1.500 €: scostamento in euro e percentuale, scritto da Demo Admin', r1.s === 200 && r1.j.data.scostamento.euro === atteso && r1.j.data.realeDa === 'Demo Admin' && r1.j.data.noteReale === 'fattura carburante più alta', r1.j.data);
    console.log('stimato', tot, 'reale 1500, scostamento', JSON.stringify(r1.j.data.scostamento));
    const det = await g(G2, `/stima/stime/${id}`);
    v('dettaglio (gw2) con dati, usati, risultato e costo reale', det.s === 200 && det.j.data.dati.km === 512 && det.j.data.risultato.kmTotali === 1024 && det.j.data.costoReale === 1500);
    const r0 = await g(G2, `/stima/stime/${id}/reale`, 'PATCH', { costoReale: null });
    v('togli il costo reale (gw2)', r0.s === 200 && r0.j.data.costoReale === null && r0.j.data.scostamento === null && r0.j.data.realeDa === null);
    v('costo reale negativo -> 400', (await g(G1, `/stima/stime/${id}/reale`, 'PATCH', { costoReale: -5 })).s === 400);
    // permessi
    v('senza costi -> 403', (await g(G1, '/stima/stime', 'GET', null, TL)).s === 403);
    const altra = (await g(G1, `/stima/stime`, 'GET', null, TC)).j.data.find(x => x.uuid === id);
    v('chi non l\'ha salvata e non ha write: non eliminabile', altra && altra.eliminabile === false && (await g(G1, `/stima/stime/${id}`, 'DELETE', null, TC)).s === 403);
    const s3 = await g(G2, '/stima/stime', 'POST', { tipo: 'ore', oreLavoro: 16, descrizione: 'Prova lavoro' }, TC);
    if (s3.j?.data?.uuid) create.push(s3.j.data.uuid);
    v('chi vede i costi salva (read e costi)', s3.s === 201 && s3.j.data.eliminabile === true, s3.j);
    v('e la elimina, perché è sua', (await g(G1, `/stima/stime/${s3.j.data.uuid}`, 'DELETE', null, TC)).s === 200);
    create.pop();
    v('eliminata -> 404', (await g(G2, `/stima/stime/${s3.j.data.uuid}`)).s === 404);
  } finally {
    for (const u of create) await g(G1, `/stima/stime/${u}`, 'DELETE');
    const resto = (await g(G1, '/stima/stime')).j;
    console.log('pulizia: stime rimaste', resto.meta.total);
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
