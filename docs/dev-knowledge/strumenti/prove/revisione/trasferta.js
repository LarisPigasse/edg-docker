// Indennità di trasferta: parametri e quattro situazioni sui due gateway; i parametri tornano com'erano
const jwt = require('/app/node_modules/jsonwebtoken');
const T = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
const g = async (gw, p, metodo = 'GET', corpo) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
const c2 = n => Math.round(n * 100) / 100, d1 = n => Math.round(n * 10) / 10;
(async () => {
  const p0 = (await g(G1, '/stima/parametri')).j.data.generali;
  console.log('parametri', JSON.stringify(p0));
  try {
    const mod = await g(G1, '/stima/parametri', 'PATCH', { indennitaTrasferta: 46, sogliaOreTrasferta: 8, sogliaKmTrasferta: 128 });
    v('i tre parametri si salvano', mod.s === 200 && mod.j.data.generali.indennitaTrasferta === 46 && mod.j.data.generali.sogliaKmTrasferta === 128, mod.j);
    const p = mod.j.data.generali;
    const casi = [
      ['512 km, 1 h in più', { km: 512, oreAggiuntive: 1 }],
      ['64 km, 1 h in più', { km: 64, oreAggiuntive: 1 }],
      ['64 km, 9 h di attese', { km: 64, oreAggiuntive: 9 }],
      ['512 km con ritorno a vuoto', { km: 512, ritornoAVuoto: true, oreAggiuntive: 1 }],
    ];
    for (const gw of [G1, G2]) {
      for (const [nome, c] of casi) {
        const r = (await g(gw, '/stima/calcola', 'POST', { tipo: 'km', ...c })).j.data.risultato;
        const kmTot = c.km * (c.ritornoAVuoto ? 2 : 1);
        const guida = d1(kmTot / p.velocitaMedia);
        const giorni = Math.max(1, Math.ceil(guida / p.oreGuidaGiorno));
        const servizio = d1(guida + c.oreAggiuntive);
        const fuori = giorni > 1 || servizio > p.sogliaOreTrasferta || c.km > p.sogliaKmTrasferta;
        const attesi = fuori ? giorni : 0;
        const co = r.voci.conducente;
        console.log(gw, nome, JSON.stringify({ giorni: r.giorni, servizio: r.oreServizio, giorniTrasferta: co.giorniTrasferta, trasferta: co.trasferta, diarie: co.diarie }));
        v(`${gw}: ${nome} -> ${attesi} giorni di trasferta`, co.giorniTrasferta === attesi && co.trasferta === c2(attesi * 46) && co.totale === c2(co.oreTotale + co.diarie + co.trasferta), co);
      }
    }
    v('soglia di ore fuori limite -> 400', (await g(G2, '/stima/parametri', 'PATCH', { sogliaOreTrasferta: 48 })).s === 400);
  } finally {
    await g(G1, '/stima/parametri', 'PATCH', { indennitaTrasferta: p0.indennitaTrasferta ?? null, sogliaOreTrasferta: p0.sogliaOreTrasferta ?? 8, sogliaKmTrasferta: p0.sogliaKmTrasferta ?? 128 });
    console.log('rimessi:', JSON.stringify((await g(G1, '/stima/parametri')).j.data.generali));
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
