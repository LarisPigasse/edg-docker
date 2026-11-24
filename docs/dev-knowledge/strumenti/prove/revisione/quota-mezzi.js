// Quota dei costi aziendali sui servizi con i mezzi e ore di impiego annue, sui due gateway; tutto torna com'era
const jwt = require('/app/node_modules/jsonwebtoken');
const T = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const DAF = 'dfe34431-f501-41bb-a08e-cfd57918eede';
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
const g = async (gw, p, metodo = 'GET', corpo) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
const c2 = n => Math.round(n * 100) / 100;
(async () => {
  const p0 = (await g(G1, '/stima/parametri')).j.data;
  const anno = p0.annoDiRiferimento ?? p0.annoCorrente;
  const prima = p0.anni.find(a => a.anno === anno);
  const oreImpiego0 = p0.generali.oreImpiegoAnnue;
  console.log('anno', anno, JSON.stringify(prima && { stato: prima.stato, totale: prima.totale, quota: prima.quotaMezzi, attribuiti: prima.attribuiti, ore: prima.oreServizio, km: prima.kmAnnui, perOra: prima.costoPerOra, perKm: prima.costoPerKm }));
  try {
    v('dopo la migrazione la quota è 100% e i costi attribuiti sono il totale', prima && prima.quotaMezzi === 100 && prima.attribuiti === prima.totale, prima);
    const salva = await g(G1, `/stima/anni/${anno}`, 'PUT', { stato: prima.stato, voci: prima.voci, oreServizio: prima.oreServizio, kmAnnui: prima.kmAnnui ?? 480000, quotaMezzi: 64, note: prima.note });
    const r = salva.j.data.anni.find(a => a.anno === anno);
    const att = c2(prima.totale * 0.64);
    v(`quota 64% (gw1): attribuiti ${att}, coefficienti sulla quota`, salva.s === 200 && r.quotaMezzi === 64 && r.attribuiti === att && r.costoPerOra === c2(att / prima.oreServizio) && r.costoPerKm === Math.round((att / r.kmAnnui) * 1000) / 1000, r);
    for (const gw of [G1, G2]) {
      const s = (await g(gw, '/stima/calcola', 'POST', { tipo: 'km', mezzo: DAF, km: 512, oreAggiuntive: 2 })).j.data;
      const az = s.risultato.voci.aziendali;
      console.log(gw, 'aziendali', JSON.stringify(az), 'anno', JSON.stringify(s.usati.anno));
      v(`${gw}: la stima usa il costo per ora sulla quota e lo dice`, az.perOra === r.costoPerOra && az.totale === c2(az.ore * r.costoPerOra) && s.usati.anno.quotaMezzi === 64 && az.perKm === r.costoPerKm, az);
    }
    v('quota 120% -> 400', (await g(G2, `/stima/anni/${anno}`, 'PUT', { stato: prima.stato, quotaMezzi: 120 })).s === 400);
    const mod = await g(G1, '/stima/parametri', 'PATCH', { oreImpiegoAnnue: 1024 });
    const k = (await g(G2, `/resoconti/mezzi?periodo=12m&soggetto=${DAF}`)).j.data.mezzi[0].componenti;
    v('ore di impiego annue: si salvano dai Parametri (gw1) e la parte fissa cambia (gw2)', mod.s === 200 && mod.j.data.generali.oreImpiegoAnnue === 1024 && k.oreImpiego < 1100, [mod.s, mod.j && mod.j.message, k]);
  } finally {
    await g(G1, `/stima/anni/${anno}`, 'PUT', { stato: prima.stato, voci: prima.voci, oreServizio: prima.oreServizio, kmAnnui: prima.kmAnnui, quotaMezzi: prima.quotaMezzi, note: prima.note });
    await g(G1, '/stima/parametri', 'PATCH', { oreImpiegoAnnue: oreImpiego0 });
    const d = (await g(G1, '/stima/parametri')).j.data;
    const a = d.anni.find(x => x.anno === anno);
    console.log('rimesso:', JSON.stringify({ quota: a.quotaMezzi, km: a.kmAnnui, ore: a.oreServizio, totale: a.totale, oreImpiego: d.generali.oreImpiegoAnnue }));
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
