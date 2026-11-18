// Stima costi, fase 2: POST /stima/calcola sui due gateway (DAF XF 01, una persona), parametri vuoti
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = o => jwt.sign({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, ...o }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const T = firma({ roleId: 2, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const TL = firma({ roleId: 3, accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.read'] });
const TC = firma({ roleId: 3, accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.read', 'vigilo.costi'] });
const DAF = 'dfe34431-f501-41bb-a08e-cfd57918eede';
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 500) : ''}`); };
const tondo = n => Math.round(n * 100) / 100;
(async () => {
  for (const gw of ['api-gateway-1', 'api-gateway-2']) {
    const g = async (p, metodo = 'GET', corpo, tok = T) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
    const c12 = (await g(`/resoconti/mezzi?periodo=12m&soggetto=${DAF}`)).j.data.mezzi[0];
    const persona = (await g('/soggetti?tipo=persona&pagina=1&righe=64')).j.data.find(p => p.costoOrario != null) ?? (await g('/soggetti?tipo=persona&pagina=1&righe=1')).j.data[0];
    const det = (await g(`/soggetti/${persona.uuid}`)).j.data;
    const corpo = { tipo: 'km', mezzo: DAF, km: 512, ritornoAVuoto: true, kmAutostrada: 400, oreAggiuntive: 2, persona: persona.uuid, extra: [{ descrizione: 'Traghetto', importo: 320 }] };
    const r = await g('/stima/calcola', 'POST', corpo);
    const d = r.j.data;
    console.log(gw, 'usati', JSON.stringify({ mezzo: d.usati.mezzo, costoMezzo: d.usati.costoMezzo, fonte: d.usati.fonteMezzo, persona: d.usati.persona, costoOrario: d.usati.costoOrario, fonteCO: d.usati.fonteCostoOrario, anno: d.usati.anno }));
    console.log(gw, 'risultato', JSON.stringify({ km: d.risultato.kmTotali, guida: d.risultato.oreGuida, giorni: d.risultato.giorni, servizio: d.risultato.oreServizio, voci: Object.fromEntries(Object.entries(d.risultato.voci).map(([k, x]) => [k, x.totale])), totale: d.risultato.totale, avvisi: d.risultato.avvisi }));
    v(`${gw}: costo del mezzo dal DAF (ultimi 12 mesi, base km)`, r.s === 200 && d.usati.fonteMezzo === 'mezzo' && d.usati.costoMezzo === c12.costoPerUnita && c12.base === 'km', [d.usati, c12.base, c12.costoPerUnita]);
    v(`${gw}: km totali 1.024, 16 h di guida, 2 giorni, 18 h di servizio`, d.risultato.kmTotali === 1024 && d.risultato.oreGuida === 16 && d.risultato.giorni === 2 && d.risultato.oreServizio === 18);
    v(`${gw}: mezzo = 1.024 × €/km`, d.risultato.voci.mezzo.totale === tondo(1024 * c12.costoPerUnita));
    v(`${gw}: costo orario dalla persona (${det.nome}) o mancante`, det.costoOrario != null ? d.usati.fonteCostoOrario === 'persona' && d.usati.costoOrario === det.costoOrario : d.usati.fonteCostoOrario === 'mancante', [d.usati.fonteCostoOrario, det.costoOrario]);
    v(`${gw}: parametri vuoti -> avvisi (diaria, pedaggio, costi aziendali)`, ['diaria', 'pedaggio', 'costi aziendali'].every(p => d.risultato.avvisi.some(a => a.toLowerCase().includes(p))), d.risultato.avvisi);
    v(`${gw}: totale = somma delle voci`, d.risultato.totale === tondo(Object.values(d.risultato.voci).reduce((t, x) => t + x.totale, 0)));
    const man = (await g('/stima/calcola', 'POST', { ...corpo, costoMezzo: 0.75, costoOrario: 28 })).j.data;
    v(`${gw}: valori scritti a mano vincono`, man.usati.fonteMezzo === 'manuale' && man.usati.costoMezzo === 0.75 && man.usati.fonteCostoOrario === 'manuale' && man.risultato.voci.mezzo.totale === 768);
    const ore = (await g('/stima/calcola', 'POST', { tipo: 'ore', mezzo: DAF, oreLavoro: 16, oreAggiuntive: 2, pernottamenti: 1 })).j.data;
    v(`${gw}: a ore col DAF (base km) -> avviso e costo del mezzo mancante`, ore.usati.fonteMezzo === 'mancante' && ore.risultato.avvisi[0].includes('costo per ora') && ore.risultato.oreServizio === 18, ore.risultato.avvisi);
    v(`${gw}: persona che non è una persona -> 400`, (await g('/stima/calcola', 'POST', { tipo: 'km', km: 10, persona: DAF })).s === 400);
    v(`${gw}: tipo sbagliato -> 400`, (await g('/stima/calcola', 'POST', { tipo: 'giorni', km: 10 })).s === 400);
    v(`${gw}: km oltre il limite -> 400`, (await g('/stima/calcola', 'POST', { tipo: 'km', km: 100000 })).s === 400);
    v(`${gw}: 17 voci extra -> 400`, (await g('/stima/calcola', 'POST', { tipo: 'km', km: 10, extra: Array.from({ length: 17 }, () => ({ descrizione: 'x', importo: 1 })) })).s === 400);
    v(`${gw}: senza costi -> 403`, (await g('/stima/calcola', 'POST', { tipo: 'km', km: 10 }, TL)).s === 403);
    v(`${gw}: read e costi -> calcola`, (await g('/stima/calcola', 'POST', { tipo: 'km', km: 10 }, TC)).s === 200);
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
