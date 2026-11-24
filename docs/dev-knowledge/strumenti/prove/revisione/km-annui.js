// Km annui: suggerimento dai contatori, costo per km e secondo valore della stima; rimette l'anno com'era
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = o => jwt.sign({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, ...o }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const T = firma({ roleId: 2, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const TL = firma({ roleId: 3, accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.read'] });
const DAF = 'dfe34431-f501-41bb-a08e-cfd57918eede';
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
const g = async (gw, p, metodo = 'GET', corpo, tok = T) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
(async () => {
  const p0 = (await g(G1, '/stima/parametri')).j.data;
  const anno = p0.annoCorrente;
  const prima = p0.anni.find(a => a.anno === anno) ?? null;
  console.log('anni presenti', JSON.stringify(p0.anni.map(a => [a.anno, a.stato, a.totale, a.oreServizio, a.kmAnnui])));
  try {
    for (const gw of [G1, G2]) {
      for (const a of [anno - 1, anno]) {
        const s = await g(gw, `/stima/anni/${a}/km-suggeriti`);
        const al = a === anno ? new Date().toISOString().slice(0, 10) : `${a}-12-31`;
        const m = (await g(gw, `/resoconti/mezzi?periodo=personalizzato&dal=${a}-01-01&al=${s.j.data.al}&tipo=veicolo`)).j.data.mezzi.filter(x => x.uso && x.uso.unita === 'km' && x.uso.valore > 0);
        const somma = Math.round(m.reduce((t, x) => t + x.uso.valore, 0));
        console.log(gw, a, JSON.stringify(s.j.data));
        v(`${gw}: km suggeriti ${a} = somma dei km dei veicoli (${m.length})`, s.s === 200 && (s.j.data.km ?? 0) === somma && s.j.data.veicoli === m.length && s.j.data.inCorso === (a === anno), [s.j.data, somma]);
      }
      v(`${gw}: anno futuro -> 400`, (await g(gw, `/stima/anni/${anno + 1}/km-suggeriti`)).s === 400);
      v(`${gw}: senza costi -> 403`, (await g(gw, `/stima/anni/${anno}/km-suggeriti`, 'GET', null, TL)).s === 403);
    }
    const sugg = (await g(G1, `/stima/anni/${anno - 1}/km-suggeriti`)).j.data.km ?? 1000000;
    const salva = await g(G1, `/stima/anni/${anno}`, 'PUT', { stato: 'preventivo', voci: { personale: 120000 }, oreServizio: 16384, kmAnnui: sugg });
    const r = salva.j.data.anni.find(a => a.anno === anno);
    const atteso = Math.round((120000 / sugg) * 1000) / 1000;
    v(`anno ${anno} con i km annui: costo per km ${atteso}`, salva.s === 200 && r.kmAnnui === sugg && r.costoPerKm === atteso && r.costoPerOra === 7.32, r);
    v('km annui a zero -> 400', (await g(G2, `/stima/anni/${anno}`, 'PUT', { stato: 'preventivo', kmAnnui: 0 })).s === 400);
    for (const gw of [G1, G2]) {
      const c = (await g(gw, '/stima/calcola', 'POST', { tipo: 'km', mezzo: DAF, km: 512, ritornoAVuoto: true, oreAggiuntive: 2 })).j.data;
      const az = c.risultato.voci.aziendali;
      console.log(gw, 'aziendali', JSON.stringify(az), 'totale', c.risultato.totale, 'con per km', c.risultato.totaleConAziendaliPerKm);
      v(`${gw}: stima a km con il secondo valore per km`, az.perKm === atteso && az.totaleSeKm === Math.round(1024 * atteso * 100) / 100 && c.usati.parametri.costoAziendalePerKm === atteso && c.risultato.totaleConAziendaliPerKm === Math.round((c.risultato.totale - az.totale + az.totaleSeKm) * 100) / 100, c.risultato);
      const o = (await g(gw, '/stima/calcola', 'POST', { tipo: 'ore', oreLavoro: 8 })).j.data;
      v(`${gw}: a ore niente valore per km`, o.risultato.voci.aziendali.perKm === null && o.risultato.totaleConAziendaliPerKm === null);
    }
  } finally {
    if (prima) await g(G1, `/stima/anni/${anno}`, 'PUT', { stato: prima.stato, voci: prima.voci, oreServizio: prima.oreServizio, kmAnnui: prima.kmAnnui, note: prima.note });
    else await g(G1, `/stima/anni/${anno}`, 'DELETE');
    const dopo = (await g(G1, '/stima/parametri')).j.data.anni;
    console.log('anni dopo la pulizia', JSON.stringify(dopo.map(a => [a.anno, a.stato, a.totale, a.oreServizio, a.kmAnnui])));
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
