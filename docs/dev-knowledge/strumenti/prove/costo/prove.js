// Prove dal vivo del costo dei mezzi (tappa 1), sui due gateway
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = p => jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, ...p }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const ADMIN = firma({ accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const UFFICIO = firma({ accountId: 10, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.write', 'vigilo.read'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' → ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const c = async (gw, t, m, p, b) => {
  const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: m, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, ...(b ? { body: JSON.stringify(b) } : {}) });
  let j = null; try { j = await r.json(); } catch {}
  return { s: r.status, j, d: j?.data };
};
const IVECO1 = '64d3f44d-81fb-48ca-bf6b-99074fe0b6ea', DAF = 'dfe34431-f501-41bb-a08e-cfd57918eede', UFF = '0e128676-220f-4dc9-bebe-32d6d018d1ba';
(async () => {
  try {
    for (const gw of ['api-gateway-1', 'api-gateway-2']) {
      const m = await c(gw, ADMIN, 'GET', '/resoconti/mezzi?periodo=12m');
      v(`${gw}: elenco 200 con soglia 32`, m.s === 200 && Array.isArray(m.d.mezzi) && m.d.sogliaScostamento === 32, m.j);
      const mezzi = m.d?.mezzi ?? [];
      v(`${gw}: ${mezzi.length} mezzi, solo veicoli/macchine/attrezzature, dal più caro`, mezzi.length >= 9 && mezzi.every(x => ['veicolo', 'macchina', 'attrezzatura'].includes(x.tipo)) && mezzi.every((x, i, l) => !i || l[i - 1].totale >= x.totale));
      v(`${gw}: totale = possesso + manutenzione, possesso = quote + obblighi`, mezzi.every(x => Math.abs(x.totale - x.possesso.totale - x.manutenzione.totale) < 0.02 && Math.abs(x.possesso.totale - x.possesso.quota - x.possesso.obblighi) < 0.02));
      const iveco = mezzi.find(x => x.uuid === IVECO1);
      v(`${gw}: Iveco S-Way 01 — quota 1.000 €/mese × ${iveco?.mesi} mesi, costo per km`, iveco && Math.abs(iveco.possesso.quota - 1000 * iveco.mesi) < 0.02 && iveco.base === 'km' && iveco.costoPerUnita > 0, iveco);
      const uff = mezzi.find(x => x.uuid === UFF);
      v(`${gw}: Furgone Ufficio senza possesso → parziale, niente confronto sul totale`, !uff || (uff.parziale && uff.confronto.totale === null), uff);
      const daf = mezzi.find(x => x.uuid === DAF);
      console.log(`    DAF XF 01: ${daf?.totale} €, ${daf?.costoPerUnita} per ${daf?.base}, confronto ${JSON.stringify(daf?.confronto)}`);
      const uno = await c(gw, ADMIN, 'GET', `/resoconti/mezzi?periodo=12m&soggetto=${IVECO1}`);
      v(`${gw}: un solo mezzo, stesso confronto`, uno.s === 200 && uno.d.mezzi.length === 1 && JSON.stringify(uno.d.mezzi[0].confronto) === JSON.stringify(iveco?.confronto), uno.d?.mezzi);
      v(`${gw}: senza vigilo.costi → 403`, (await c(gw, UFFICIO, 'GET', '/resoconti/mezzi')).s === 403);

      const a1 = await c(gw, ADMIN, 'GET', '/resoconti/possesso/anteprima?modo=acquisto&prezzo=150000&anni=8&valoreFinale=30000');
      v(`${gw}: anteprima acquisto → 1.250 €/mese`, a1.s === 200 && a1.d.mensile === 1250 && a1.d.errori.length === 0 && a1.d.avviso === null, a1.d);
      const a2 = await c(gw, ADMIN, 'GET', '/resoconti/possesso/anteprima?modo=noleggio&canone=0');
      v(`${gw}: anteprima canone 0 → errore, nessuna quota`, a2.s === 200 && a2.d.mensile === null && /canone/.test(a2.d.errori[0]), a2.d);
      const cat = (await c(gw, ADMIN, 'GET', `/soggetti/${IVECO1}`)).d?.categoria?.uuid;
      const a3 = await c(gw, ADMIN, 'GET', `/resoconti/possesso/anteprima?modo=acquisto&prezzo=1280000&anni=8&valoreFinale=320000&categoria=${cat}&escludi=${IVECO1}`);
      v(`${gw}: anteprima 10× gli autocarri → avviso morbido`, a3.s === 200 && a3.d.mensile === 10000 && /volte la media di Autocarri/.test(a3.d.avviso ?? ''), a3.d);
      const a4 = await c(gw, ADMIN, 'GET', `/resoconti/possesso/anteprima?modo=acquisto&prezzo=128000&anni=8&valoreFinale=32000&categoria=${cat}&escludi=${IVECO1}`);
      v(`${gw}: anteprima in linea → nessun avviso`, a4.s === 200 && a4.d.avviso === null, a4.d);
      v(`${gw}: anteprima senza vigilo.costi → 403`, (await c(gw, UFFICIO, 'GET', '/resoconti/possesso/anteprima?modo=leasing&canone=900')).s === 403);
    }
    // modifica del soggetto
    const s = await c('api-gateway-1', ADMIN, 'GET', `/soggetti/${IVECO1}`);
    v('scheda con vigilo.costi: possesso con modo e quota', s.d?.possesso?.modo === 'acquisto' && s.d.possesso.mensile === 1000, s.d?.possesso);
    const s2 = await c('api-gateway-2', UFFICIO, 'GET', `/soggetti/${IVECO1}`);
    v('scheda senza vigilo.costi: niente possesso', s2.s === 200 && !('possesso' in s2.d), s2.d && Object.keys(s2.d));
    v('modifica senza vigilo.costi → 403', (await c('api-gateway-1', UFFICIO, 'PATCH', `/soggetti/${IVECO1}`, { possesso: null })).s === 403);
    const anni0 = await c('api-gateway-2', ADMIN, 'PATCH', `/soggetti/${IVECO1}`, { possesso: { modo: 'acquisto', prezzo: 128000, anni: 0 } });
    v('anni 0 → 400 in italiano', anni0.s === 400 && /anni/.test(anni0.j?.message ?? ''), anni0.j);
    const persona = (await c('api-gateway-1', ADMIN, 'GET', '/soggetti?tipo=persona&righe=1')).d?.[0];
    const p = await c('api-gateway-1', ADMIN, 'PATCH', `/soggetti/${persona?.uuid}`, { possesso: { modo: 'leasing', canone: 300 } });
    v('possesso su una persona → 400', p.s === 400 && /veicoli, macchine e attrezzature/.test(p.j?.message ?? ''), p.j);
  } catch (e) { ko++; console.log('ERRORE', e.message); }
  console.log(`TOTALE: ${ok} ok, ${ko} ko`);
})();
