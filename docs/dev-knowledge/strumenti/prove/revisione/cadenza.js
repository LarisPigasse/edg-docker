// Editor della cadenza: anteprima (frase e conteggi) = esito vero, date che tornano com'erano, rifiuti di coerenza; tutto torna com'era
const jwt = require('/app/node_modules/jsonwebtoken');
const T = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 500) : ''}`); };
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
const g = async (gw, p, metodo = 'GET', corpo) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
const aperte = async (gw, uuid) => (await g(gw, `/scadenze?controllo=${uuid}&righe=128`)).j.data.map(s => `${s.soggetto?.nome}:${s.scadeIl}`).sort();
const esito = d => ({ ricalcolate: d.scadenzeRicalcolate, chiuse: d.scadenzeChiuse, riaperte: d.scadenzeRiaperte, create: d.scadenzeCreate });
const norm = c => ({ tempo: c.tempo, uso: c.uso, ancoraggio: c.ancoraggio, fineMese: c.fineMese, prima: c.prima, finestra: c.finestra ?? null, fasce: c.fasce ?? null });
(async () => {
  const controlli = (await g(G1, '/controlli?righe=128')).j.data;
  const c = controlli.find(x => x.nome === 'Assicurazione RCA');
  const persona = controlli.find(x => x.tipoSoggetto === 'persona' && x.attivo && x.cadenza.tempo);
  const prima = await aperte(G1, c.uuid);
  console.log(c.nome, '·', c.frasi.cadenza, '· date', prima.slice(0, 3).join(' '));
  try {
    const sei = { ...norm(c.cadenza), tempo: { valore: 6, unita: 'mesi' } };
    const ant = (await g(G2, `/controlli/${c.uuid}/anteprima`, 'POST', { cadenza: sei })).j.data;
    console.log('anteprima', JSON.stringify(esito(ant)), '·', ant.frasi.cadenza);
    v('l\'anteprima scrive la frase nuova', /6 mesi/.test(ant.frasi.cadenza), ant.frasi);
    v('l\'anteprima non cambia niente', JSON.stringify(await aperte(G1, c.uuid)) === JSON.stringify(prima));
    const vera = (await g(G1, `/controlli/${c.uuid}`, 'PATCH', { cadenza: sei })).j.data;
    console.log('vera', JSON.stringify(esito(vera)), '·', vera.frasi.cadenza);
    v('ogni 6 mesi: anteprima = esito vero, stessa frase', JSON.stringify(esito(vera)) === JSON.stringify(esito(ant)) && vera.frasi.cadenza === ant.frasi.cadenza, { ant: esito(ant), vera: esito(vera) });
    v('il controllo della libreria è personalizzato', vera.personalizzato === true);
    const durante = await aperte(G2, c.uuid);
    console.log('date dopo', durante.slice(0, 3).join(' '));
    const torna = (await g(G2, `/controlli/${c.uuid}`, 'PATCH', { cadenza: norm(c.cadenza) })).j.data;
    v('rimessa la cadenza: frase e date com\'erano, non più personalizzato', torna.frasi.cadenza === c.frasi.cadenza && JSON.stringify(await aperte(G1, c.uuid)) === JSON.stringify(prima) && torna.personalizzato === c.personalizzato, { frase: torna.frasi.cadenza, pers: torna.personalizzato });
    // rifiuti di coerenza
    const km = await g(G1, `/controlli/${persona.uuid}/anteprima`, 'POST', { cadenza: { ...norm(persona.cadenza), uso: { valore: 1000, unita: 'km' } } });
    console.log(persona.nome, '· a km ->', km.s, km.j && km.j.message);
    v('una persona a km: rifiutata con il motivo', km.s === 400 && /contatore|km/.test(km.j.message || ''), km.j);
    const data = await g(G2, `/controlli/${c.uuid}/anteprima`, 'POST', { cadenza: { ...norm(c.cadenza), prima: { tempo: { valore: 4, unita: 'anni' }, da: 'nascita' } } });
    console.log('veicolo dalla nascita ->', data.s, data.j && data.j.message);
    v('una prima scadenza da una data che il veicolo non ha: rifiutata', data.s === 400 && /data del soggetto/.test(data.j.message || ''), data.j);
    const fin = await g(G1, `/controlli/${c.uuid}/anteprima`, 'POST', { cadenza: { ...norm(c.cadenza), ancoraggio: 'finestra', finestra: null } });
    v('finestra senza durata: rifiutata', fin.s === 400, fin.s);
  } finally {
    await g(G1, `/controlli/${c.uuid}`, 'PATCH', { cadenza: norm(c.cadenza) });
    const fine = (await g(G1, '/controlli?righe=128')).j.data.find(x => x.uuid === c.uuid);
    console.log('alla fine:', fine.frasi.cadenza, '· personalizzato', fine.personalizzato, '· date uguali', JSON.stringify(await aperte(G1, c.uuid)) === JSON.stringify(prima));
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
