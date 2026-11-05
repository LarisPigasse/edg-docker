// Prove dal vivo dei rifornimenti (tappa 2), sui due gateway. Le righe di prova si eliminano alla fine.
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = p => jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, ...p }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const ADMIN = firma({ accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const UFFICIO = firma({ accountId: 10, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.write', 'vigilo.read'] });
const ADDETTO = firma({ accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.own'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' → ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const c = async (gw, t, m, p, b) => {
  const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: m, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, ...(b ? { body: JSON.stringify(b) } : {}) });
  let j = null; try { j = await r.json(); } catch {}
  return { s: r.status, j, d: j?.data };
};
const FURGONE = '01c2d7bd-1516-45f3-adff-319222efd630', DAF = 'dfe34431-f501-41bb-a08e-cfd57918eede';
const OGGI = new Date().toISOString().slice(0, 10);
(async () => {
  const creati = [];
  try {
    for (const gw of ['api-gateway-1', 'api-gateway-2']) {
      const furg = (await c(gw, ADMIN, 'GET', `/soggetti/${FURGONE}`)).d;
      const s = furg.soggetto ?? furg;
      const cont = [...s.contatori].sort((a, b) => Number(!!a.nome) - Number(!!b.nome) || Number(a.unita !== 'km') - Number(b.unita !== 'km'))[0];
      const prima = cont.valore;
      // nuovo dall'ufficio con km
      const n1 = await c(gw, ADMIN, 'POST', '/rifornimenti', { soggetto: FURGONE, fattoIl: OGGI, voce: 'carburante', litri: 42.5, importo: 74.38, lettura: prima + 128, riferimento: 'PROVA' });
      v(`${gw}: ufficio registra carburante con km → 201, prezzo al litro`, n1.s === 201 && n1.d.prezzoAlLitro === 1.75 && n1.d.lettura?.valore === prima + 128 && n1.d.nomeVoce === 'Carburante', n1.j);
      if (n1.d?.uuid) creati.push(n1.d.uuid);
      const dopo = (await c(gw, ADMIN, 'GET', `/soggetti/${FURGONE}`)).d;
      const c2 = (dopo.soggetto ?? dopo).contatori.find(x => x.uuid === cont.uuid);
      v(`${gw}: il contatore ora segna ${prima + 128}`, c2.valore === prima + 128, c2);
      const lett = await c(gw, ADMIN, 'GET', `/contatori/${cont.uuid}/letture?righe=4`);
      const lr = lett.d?.find(l => l.valore === prima + 128);
      v(`${gw}: lettura con fonte rifornimento`, lr && lr.fonte === 'rifornimento', lett.d?.slice(0, 2));
      if (lr) v(`${gw}: quella lettura non si elimina da sola → 409`, [409, 400].includes((await c(gw, ADMIN, 'DELETE', `/letture/${lr.uuid}`)).s));
      // errori
      v(`${gw}: litri sui pedaggi → 400`, (await c(gw, ADMIN, 'POST', '/rifornimenti', { soggetto: FURGONE, fattoIl: OGGI, voce: 'pedaggi', litri: 3, importo: 10 })).s === 400);
      v(`${gw}: data nel futuro → 400`, (await c(gw, ADMIN, 'POST', '/rifornimenti', { soggetto: FURGONE, fattoIl: '2099-01-01', voce: 'altro', importo: 10 })).s === 400);
      v(`${gw}: importo 0 → 400`, (await c(gw, ADMIN, 'POST', '/rifornimenti', { soggetto: FURGONE, fattoIl: OGGI, voce: 'altro', importo: 0 })).s === 400);
      const pers = (await c(gw, ADMIN, 'GET', '/soggetti?tipo=persona&righe=1')).d[0];
      v(`${gw}: su una persona → 400`, (await c(gw, ADMIN, 'POST', '/rifornimenti', { soggetto: pers.uuid, fattoIl: OGGI, voce: 'altro', importo: 10 })).s === 400);
      // addetto
      const a1 = await c(gw, ADDETTO, 'POST', '/rifornimenti', { soggetto: FURGONE, fattoIl: OGGI, voce: 'adblue', litri: 10, importo: 7.9 });
      v(`${gw}: addetto registra sul suo mezzo → 201, vede l'importo`, a1.s === 201 && a1.d.mio === true && a1.d.importo === 7.9, a1.j);
      if (a1.d?.uuid) creati.push(a1.d.uuid);
      const fn = (await c(gw, ADMIN, 'GET', '/fornitori?righe=1')).d[0];
      v(`${gw}: addetto con fornitore → 403`, (await c(gw, ADDETTO, 'POST', '/rifornimenti', { soggetto: FURGONE, fattoIl: OGGI, voce: 'altro', importo: 5, fornitore: fn.uuid })).s === 403);
      v(`${gw}: addetto su un mezzo non suo → 403/404`, [403, 404].includes((await c(gw, ADDETTO, 'POST', '/rifornimenti', { soggetto: DAF, fattoIl: OGGI, voce: 'altro', importo: 5 })).s));
      v(`${gw}: addetto legge i rifornimenti del DAF → 403/404`, [403, 404].includes((await c(gw, ADDETTO, 'GET', `/rifornimenti?soggetto=${DAF}`)).s));
      const la = await c(gw, ADDETTO, 'GET', '/rifornimenti?righe=128');
      v(`${gw}: elenco dell'addetto solo nei suoi mezzi; importo solo sui suoi`, la.s === 200 && la.d.every(r => r.soggetto.uuid === FURGONE) && la.d.every(r => (r.mio ? r.importo !== undefined : r.importo === undefined)), la.d?.slice(0, 2));
      v(`${gw}: addetto corregge quello dell'ufficio → 409`, (await c(gw, ADDETTO, 'PATCH', `/rifornimenti/${n1.d.uuid}`, { note: 'x' })).s === 409);
      const p1 = await c(gw, ADDETTO, 'PATCH', `/rifornimenti/${a1.d.uuid}`, { litri: 12, importo: 9.48 });
      v(`${gw}: addetto corregge il suo → 200`, p1.s === 200 && p1.d.litri === 12 && p1.d.prezzoAlLitro === 0.79, p1.j);
      // ufficio senza costi
      const lu = await c(gw, UFFICIO, 'GET', `/rifornimenti?soggetto=${FURGONE}&righe=4`);
      v(`${gw}: chi non ha vigilo.costi non vede gli importi degli altri`, lu.s === 200 && lu.d.length > 0 && lu.d.every(r => r.importo === undefined && r.prezzoAlLitro === undefined), lu.d?.[0]);
      // lettura tolta
      const p2 = await c(gw, ADMIN, 'PATCH', `/rifornimenti/${n1.d.uuid}`, { lettura: null });
      const d3 = (await c(gw, ADMIN, 'GET', `/soggetti/${FURGONE}`)).d;
      v(`${gw}: togliere i km riporta il contatore a ${prima}`, p2.s === 200 && p2.d.lettura === null && (d3.soggetto ?? d3).contatori.find(x => x.uuid === cont.uuid).valore === prima, p2.d);
      // resoconti
      const sp = await c(gw, ADMIN, 'GET', '/resoconti/spese?periodo=12m');
      const uso = sp.d?.perNatura.find(n => n.natura === 'uso');
      v(`${gw}: Spese: natura uso e dettaglio per voce coerenti`, uso && Math.abs(uso.spesa - sp.d.perVoce.reduce((t, x) => t + x.spesa, 0)) < 0.05 && sp.d.perVoce.some(x => x.voce === 'carburante' && x.litri > 0), { uso, perVoce: sp.d?.perVoce });
      const mz = await c(gw, ADMIN, 'GET', `/resoconti/mezzi?periodo=12m&soggetto=${DAF}`);
      const m0 = mz.d?.mezzi[0];
      v(`${gw}: Costo DAF: blocco rifornimenti nel totale, consumo l/100 km`, m0 && m0.rifornimenti.totale > 0 && m0.rifornimenti.consumo > 20 && Math.abs(m0.totale - m0.possesso.totale - m0.manutenzione.totale - m0.rifornimenti.totale) < 0.05, m0);
      console.log(`    DAF: ${m0?.rifornimenti.consumo} l/100 km, confronto ${JSON.stringify(m0?.confronto)}`);
      const csv = await fetch(`http://${gw}:8080/api/vigilo/resoconti/spese/righe.csv?periodo=12m&testo=Furgone%20Demo`, { headers: { Authorization: `Bearer ${ADMIN}` } });
      const testo = await csv.text();
      v(`${gw}: CSV con colonna Litri e righe Uso (rifornimenti)`, csv.status === 200 && /;Litri;Importo/.test(testo.split('\n')[0]) && /Uso \(rifornimenti\)/.test(testo), testo.slice(0, 300));
      // allegati
      const fd = new FormData();
      fd.append('entita', 'rifornimento');
      fd.append('id', a1.d.uuid);
      fd.append('file', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')], { type: 'image/png' }), 'scontrino.png');
      const up = await fetch(`http://${gw}:8080/api/vigilo/allegati`, { method: 'POST', headers: { Authorization: `Bearer ${ADDETTO}` }, body: fd });
      v(`${gw}: l'addetto allega lo scontrino al suo rifornimento → 201`, up.status === 201, await up.text());
      const al = await c(gw, ADMIN, 'GET', `/allegati?entita=soggetto&id=${FURGONE}`);
      v(`${gw}: nei documenti del mezzo, «AdBlue» del giorno`, al.d?.voci.some(x => x.di.entita === 'rifornimento' && x.di.titolo === 'AdBlue' && x.di.eseguitaIl === OGGI), al.d?.voci?.slice(-1));
      // eliminazione
      for (const u of creati.splice(0)) v(`${gw}: elimina ${u.slice(0, 8)} → 200`, (await c(gw, u === a1.d.uuid ? ADDETTO : ADMIN, 'DELETE', `/rifornimenti/${u}`)).s === 200);
      const al2 = await c(gw, ADMIN, 'GET', `/allegati?entita=soggetto&id=${FURGONE}`);
      v(`${gw}: lo scontrino se ne va con il rifornimento`, !al2.d.voci.some(x => x.di.uuid === a1.d.uuid));
    }
  } catch (e) {
    v('eccezione', false, e.message);
  } finally {
    for (const u of creati) await c('api-gateway-1', ADMIN, 'DELETE', `/rifornimenti/${u}`);
    console.log(`\n${ok}/${ok + ko}`);
  }
})();
