// Costo del mezzo a due componenti: costo dei mezzi e stima sui due gateway; il parametro torna com'era
const jwt = require('/app/node_modules/jsonwebtoken');
const T = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const DAF = 'dfe34431-f501-41bb-a08e-cfd57918eede';
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
const g = async (gw, p, metodo = 'GET', corpo) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
const c2 = n => Math.round(n * 100) / 100, c3 = n => Math.round(n * 1000) / 1000;
(async () => {
  const p0 = (await g(G1, '/stima/parametri')).j.data.generali;
  console.log('parametri generali', JSON.stringify(p0));
  try {
    for (const gw of [G1, G2]) {
      const r = (await g(gw, `/resoconti/mezzi?periodo=12m&soggetto=${DAF}`)).j.data;
      const m = r.mezzi[0], k = m.componenti;
      console.log(gw, 'componenti', JSON.stringify(k), 'mesi', m.mesi, 'ore impiego annue', r.oreImpiegoAnnue);
      const ore = Math.round(((r.oreImpiegoAnnue * m.mesi) / 12) * 10) / 10;
      v(`${gw}: parte fissa = (possesso + manutenzione) ÷ ore di impiego del periodo`, k.fissoOra === c2((m.possesso.totale + m.manutenzione.totale) / ore) && k.oreImpiego === ore, k);
      v(`${gw}: parte variabile = rifornimenti ÷ km`, k.unita === 'km' && k.variabile === c3(m.rifornimenti.totale / m.uso.valore), k);
      const s = (await g(gw, '/stima/calcola', 'POST', { tipo: 'km', mezzo: DAF, km: 512, ritornoAVuoto: true, oreAggiuntive: 2 })).j.data;
      const mz = s.risultato.voci.mezzo;
      console.log(gw, 'mezzo nella stima', JSON.stringify(mz), 'fonti', s.usati.fonteMezzo, s.usati.fonteMezzoOra);
      v(`${gw}: stima = 1.024 km × variabile + 18 h × fissa, fonti "mezzo"`, mz.variabile === c2(1024 * k.variabile) && mz.fisso === c2(18 * k.fissoOra) && mz.totale === c2(mz.variabile + mz.fisso) && s.usati.fonteMezzo === 'mezzo' && s.usati.fonteMezzoOra === 'mezzo', mz);
      const at = (await g(gw, '/stima/calcola', 'POST', { tipo: 'km', mezzo: DAF, km: 64, oreAggiuntive: 23 })).j.data.risultato.voci.mezzo;
      v(`${gw}: 64 km con 23 h di attese: la parte fissa conta 24 h`, at.ore === 24 && at.fisso === c2(24 * k.fissoOra), at);
      const man = (await g(gw, '/stima/calcola', 'POST', { tipo: 'km', mezzo: DAF, km: 100, costoMezzo: 0.7, costoMezzoOra: 10 })).j.data;
      v(`${gw}: le due parti scritte a mano vincono`, man.usati.fonteMezzo === 'manuale' && man.usati.fonteMezzoOra === 'manuale' && man.risultato.voci.mezzo.variabile === 70, man.usati);
    }
    const mod = (await g(G1, '/stima/parametri', 'PATCH', { oreImpiegoAnnue: 1024 })).j.data.generali.oreImpiegoAnnue;
    const k2 = (await g(G2, `/resoconti/mezzi?periodo=12m&soggetto=${DAF}`)).j.data.mezzi[0].componenti;
    v('ore di impiego annue 1.024 (gw1): la parte fissa raddoppia circa (gw2)', mod === 1024 && k2.oreImpiego < 1100, k2);
    v('ore di impiego fuori limite -> 400', (await g(G1, '/stima/parametri', 'PATCH', { oreImpiegoAnnue: 64 })).s === 400);
  } finally {
    await g(G1, '/stima/parametri', 'PATCH', { oreImpiegoAnnue: p0.oreImpiegoAnnue ?? 2048 });
    console.log('parametro rimesso a', (await g(G1, '/stima/parametri')).j.data.generali.oreImpiegoAnnue);
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
