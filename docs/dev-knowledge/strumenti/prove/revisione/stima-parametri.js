// Stima costi, fase 1: parametri generali e costi aziendali per anno sui due gateway; alla fine tutto come prima
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = o => jwt.sign({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, ...o }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const T = firma({ roleId: 2, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const TL = firma({ roleId: 3, accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.read'] });
const TW = firma({ roleId: 3, accountId: 10, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.write'] });
const TC = firma({ roleId: 3, accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.read', 'vigilo.costi'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
const g = async (gw, p, metodo = 'GET', corpo, tok = T) => {
  const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined });
  return { s: r.status, j: await r.json().catch(() => null) };
};
(async () => {
  const p0 = (await g(G1, '/stima/parametri')).j.data;
  console.log('all\'inizio', JSON.stringify(p0.generali), 'anni', p0.anni.length, 'riferimento', p0.annoDiRiferimento);
  v('valori iniziali: 64 km/h, 9 ore, il resto vuoto', p0.generali.velocitaMedia === 64 && p0.generali.oreGuidaGiorno === 9 && p0.generali.diaria === null && p0.voci.length === 6, p0.generali);
  for (const gw of [G1, G2]) {
    v(`${gw}: senza costi (read) -> 403`, (await g(gw, '/stima/parametri', 'GET', null, TL)).s === 403);
    v(`${gw}: read e costi -> legge, ma non modifica`, (await g(gw, '/stima/parametri', 'GET', null, TC)).j.data.modificabili === false && (await g(gw, '/stima/parametri', 'PATCH', { diaria: 10 }, TC)).s === 403);
    v(`${gw}: write senza costi -> 403`, (await g(gw, '/stima/parametri', 'PATCH', { diaria: 10 }, TW)).s === 403);
  }
  v('velocità fuori limite -> 400', (await g(G1, '/stima/parametri', 'PATCH', { velocitaMedia: 8 })).s === 400);
  v('pedaggio con 3 decimali -> 400', (await g(G1, '/stima/parametri', 'PATCH', { pedaggioKm: 0.123 })).s === 400);
  const p1 = (await g(G1, '/stima/parametri', 'PATCH', { costoOrarioConducente: 28.5, diaria: 46.48, pedaggioKm: 0.16, velocitaMedia: 72 })).j.data;
  v('parametri modificati (gw1)', p1.generali.costoOrarioConducente === 28.5 && p1.generali.velocitaMedia === 72 && p1.generali.pedaggioKm === 0.16, p1.generali);
  v('gw2 li legge', (await g(G2, '/stima/parametri')).j.data.generali.diaria === 46.48);
  const a25 = await g(G1, '/stima/anni/2025', 'PUT', { stato: 'consuntivo', voci: { personale: 120000, struttura: 48000, consulenze: 12000.5 }, oreServizio: 16384, note: 'prova' });
  const r25 = a25.j.data.anni.find(a => a.anno === 2025);
  v('2025 a consuntivo: totale e costo per ora', a25.s === 200 && r25.totale === 180000.5 && r25.costoPerOra === 10.99 && r25.aggiornatoDa === 'Demo Admin' && a25.j.data.annoDiRiferimento === 2025, r25);
  const a26 = await g(G2, '/stima/anni/2026', 'PUT', { stato: 'preventivo', voci: { personale: 128000, altro: 4096 }, oreServizio: null });
  const r26 = a26.j.data.anni.find(a => a.anno === 2026);
  v('2026 a preventivo (gw2) senza ore: costo per ora vuoto, ora è il riferimento', r26 && r26.costoPerOra === null && a26.j.data.annoDiRiferimento === 2026 && a26.j.data.anni[0].anno === 2026, a26.j.data);
  const mod = (await g(G1, '/stima/anni/2026', 'PUT', { stato: 'preventivo', voci: { personale: 128000, altro: 4096 }, oreServizio: 8192 })).j.data.anni.find(a => a.anno === 2026);
  v('2026 aggiornato con le ore: 132.096 / 8.192 = 16,125 -> 16,13 €/h', mod.costoPerOra === 16.13, mod);
  const ign = await g(G1, '/stima/anni/2026', 'PUT', { stato: 'preventivo', voci: { personale: 128000, mensa: 10 }, oreServizio: 8192 });
  v('voce sconosciuta: tolta dal validatore comune (stripUnknown), non salvata', ign.s === 200 && !('mensa' in ign.j.data.anni.find(a => a.anno === 2026).voci), ign.j);
  v('anno 1999 -> 400', (await g(G1, '/stima/anni/1999', 'PUT', { stato: 'consuntivo' })).s === 400);
  v('stato mancante -> 400', (await g(G1, '/stima/anni/2024', 'PUT', { voci: {} })).s === 400);
  const del = await g(G2, '/stima/anni/2026', 'DELETE');
  v('2026 eliminato (gw2): il riferimento torna al 2025', del.s === 200 && del.j.data.annoDiRiferimento === 2025, del.j);
  v('di nuovo -> 404', (await g(G1, '/stima/anni/2026', 'DELETE')).s === 404);
  // tutto come prima
  await g(G1, '/stima/anni/2025', 'DELETE');
  const fine = (await g(G1, '/stima/parametri', 'PATCH', { costoOrarioConducente: null, diaria: null, pedaggioKm: null, velocitaMedia: 64, oreGuidaGiorno: 9 })).j.data;
  v('pulizia: valori iniziali e nessun anno', fine.anni.length === 0 && JSON.stringify(fine.generali) === JSON.stringify(fine.iniziali), fine);
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
