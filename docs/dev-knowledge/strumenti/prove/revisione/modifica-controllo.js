// Modifica di un controllo: anteprima = esito vero, categorie tolte e rimesse (fuori ambito, stesse date), personalizzato; tutto torna com'era
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = o => jwt.sign({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, ...o }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const T = firma({ roleId: 2, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const TW = firma({ roleId: 3, accountId: 10, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.write', 'vigilo.costi'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 500) : ''}`); };
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
const g = async (gw, p, metodo = 'GET', corpo, tok = T) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
const aperte = async (gw, uuid) => (await g(gw, `/scadenze?controllo=${uuid}&righe=128`)).j.data
  .map(s => ({ uuid: s.uuid, soggetto: s.soggetto?.nome, date: JSON.stringify([s.scadeIl, s.limiteIl, s.stimataIl, s.urgenzaIl]) })).sort((a, b) => a.uuid.localeCompare(b.uuid));
const esito = d => ({ ricalcolate: d.scadenzeRicalcolate, chiuse: d.scadenzeChiuse, riaperte: d.scadenzeRiaperte, create: d.scadenzeCreate });
(async () => {
  const c = (await g(G1, '/controlli?righe=128')).j.data.find(x => x.nome === 'Assicurazione RCA');
  const prima = await aperte(G1, c.uuid);
  const catPrima = c.categorie.map(k => k.uuid);
  const togliere = c.categorie.find(k => /Autovetture/.test(k.nome)) ?? c.categorie[c.categorie.length - 1];
  const ridotte = catPrima.filter(u => u !== togliere.uuid);
  console.log(c.nome, 'categorie', c.categorie.map(k => k.nome).join(', '), '· aperte', prima.length, '· tolgo', togliere.nome, '· personalizzato', c.personalizzato);
  try {
    v('chi ha write ma non config non chiede l\'anteprima -> 403', (await g(G1, `/controlli/${c.uuid}/anteprima`, 'POST', { categorie: ridotte }, TW)).s === 403);
    const ant = await g(G1, `/controlli/${c.uuid}/anteprima`, 'POST', { categorie: ridotte });
    console.log('anteprima', JSON.stringify(esito(ant.j.data)), 'aperte', ant.j.data.scadenzeAperte);
    v('l\'anteprima non cambia niente (gw2)', JSON.stringify(await aperte(G2, c.uuid)) === JSON.stringify(prima) && (await g(G2, '/controlli?righe=128')).j.data.find(x => x.uuid === c.uuid).categorie.length === catPrima.length);
    const vera = await g(G2, `/controlli/${c.uuid}`, 'PATCH', { categorie: ridotte });
    console.log('esito vero', JSON.stringify(esito(vera.j.data)));
    v(`togliendo "${togliere.nome}": anteprima = esito vero, scadenze chiuse fuori ambito`, vera.s === 200 && JSON.stringify(esito(vera.j.data)) === JSON.stringify(esito(ant.j.data)) && vera.j.data.scadenzeChiuse > 0, { ant: esito(ant.j.data), vera: esito(vera.j.data) });
    const durante = await aperte(G1, c.uuid);
    v('restano aperte solo quelle delle altre categorie', durante.length === prima.length - vera.j.data.scadenzeChiuse);
    const chiuse = (await g(G1, `/scadenze?controllo=${c.uuid}&chiuse=true&righe=128`)).j;
    const fa = (chiuse.data ?? []).filter(s => s.motivoChiusura === 'fuori-ambito');
    console.log('chiuse fuori ambito nell\'elenco', fa.length, fa[0] ? JSON.stringify({ soggetto: fa[0].soggetto?.nome, motivo: fa[0].motivoChiusura }) : '');
    const rim = await g(G1, `/controlli/${c.uuid}`, 'PATCH', { categorie: catPrima });
    v(`rimettendo "${togliere.nome}": ${vera.j.data.scadenzeChiuse} riaperte, nessuna nuova`, rim.j.data.scadenzeRiaperte === vera.j.data.scadenzeChiuse && rim.j.data.scadenzeCreate === 0, esito(rim.j.data));
    v('le stesse scadenze, con le stesse date (gw2)', JSON.stringify(await aperte(G2, c.uuid)) === JSON.stringify(prima));
    // preavvisi: anteprima = vero
    const pre = { giorni: [32, 8], uso: c.preavvisi.uso };
    const antP = (await g(G2, `/controlli/${c.uuid}/anteprima`, 'POST', { preavvisi: pre })).j.data;
    const veraP = (await g(G1, `/controlli/${c.uuid}`, 'PATCH', { preavvisi: pre })).j.data;
    v('preavvisi: anteprima = esito vero', JSON.stringify(esito(antP)) === JSON.stringify(esito(veraP)), { ant: esito(antP), vera: esito(veraP) });
    v('cambiati i preavvisi, il controllo della libreria è personalizzato', veraP.personalizzato === true);
    const back = (await g(G1, `/controlli/${c.uuid}`, 'PATCH', { preavvisi: c.preavvisi })).j.data;
    v('rimessi i preavvisi com\'erano, non è più personalizzato', back.personalizzato === c.personalizzato);
  } finally {
    await g(G1, `/controlli/${c.uuid}`, 'PATCH', { categorie: catPrima, preavvisi: c.preavvisi });
    const fine = (await g(G1, '/controlli?righe=128')).j.data.find(x => x.uuid === c.uuid);
    console.log('alla fine: categorie', fine.categorie.length, 'aperte', fine.scadenzeAperte, 'preavvisi', JSON.stringify(fine.preavvisi), 'personalizzato', fine.personalizzato);
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
