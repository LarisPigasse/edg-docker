// Controlli non seguiti: giro completo sul bollo dell'Iveco S-Way 02 (non seguire su gw1, riprendere su gw2)
const jwt = require('/app/node_modules/jsonwebtoken');
const T = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const g = async (gw, p, metodo = 'GET', corpo) => {
  const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined });
  return { s: r.status, j: await r.json().catch(() => null) };
};
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
(async () => {
  const sog = (await g(G1, '/soggetti?testo=Iveco%20S-Way%2002&pagina=1&righe=8')).j.data.find(s => s.nome === 'Iveco S-Way 02');
  const c0 = (await g(G1, `/soggetti/${sog.uuid}/controlli`)).j.data;
  const bollo = c0.controlli.find(c => /bollo/i.test(c.nome));
  console.log('soggetto', sog.nome, '| controlli', c0.controlli.length, '| bollo', JSON.stringify(bollo));
  v('il bollo vale per il mezzo, si segue, ha una scadenza aperta', bollo && bollo.seguito && bollo.aperta, bollo);
  const aperte = (await g(G1, `/scadenze?soggetto=${sog.uuid}&controllo=${bollo.uuid}&pagina=1&righe=8`)).j.data;
  const prima = aperte[0];
  console.log('scadenza aperta', prima.uuid, prima.scadeIl, prima.stato);

  const base = `/soggetti/${sog.uuid}/controlli/${bollo.uuid}`;
  v('motivo vuoto -> 400', (await g(G1, `${base}/non-seguire`, 'POST', { motivo: '' })).s === 400);
  v('motivo di 1 carattere -> 400', (await g(G1, `${base}/non-seguire`, 'POST', { motivo: 'x' })).s === 400);
  const ns = await g(G1, `${base}/non-seguire`, 'POST', { motivo: 'prova della revisione: mezzo esente' });
  v('non seguire (gw1) -> 200, 1 scadenza chiusa', ns.s === 200 && ns.j.data.scadenzeChiuse === 1, ns.j);
  v('di nuovo non seguire -> 409', (await g(G2, `${base}/non-seguire`, 'POST', { motivo: 'ancora' })).s === 409);

  const c1 = (await g(G2, `/soggetti/${sog.uuid}/controlli`)).j.data;
  const b1 = c1.controlli.find(c => c.uuid === bollo.uuid);
  v('gw2: non si segue, con motivo e Demo Admin', !b1.seguito && b1.nonSeguito.da === 'Demo Admin' && /esente/.test(b1.nonSeguito.motivo) && !b1.aperta, b1);
  const chiusa = (await g(G2, `/scadenze/${prima.uuid}`)).j.data;
  v('la scadenza è chiusa: non più seguita, da Demo Admin', chiusa.chiusa && chiusa.chiusa.motivo === 'non-seguita' && chiusa.chiusa.da === 'Demo Admin', chiusa.chiusa);
  const nuova = await g(G1, '/scadenze', 'POST', { soggetto: sog.uuid, controllo: bollo.uuid });
  v('aggiungere il bollo a mano -> 409', nuova.s === 409, nuova.j);
  v('senza permesso di scrittura -> 403', (await (async () => {
    const T2 = jwt.sign({ accountType: 'cliente', roleId: 3, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.read'] }, process.env.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
    const r = await fetch(`http://${G1}:8080/api/vigilo${base}/riprendi`, { method: 'POST', headers: { Authorization: `Bearer ${T2}`, 'Content-Type': 'application/json' }, body: '{}' });
    return r.status;
  })()) === 403);

  const rp = await g(G2, `${base}/riprendi`, 'POST', { nota: 'fine della prova' });
  v('tornare a seguire (gw2) -> riapre la scadenza di prima', rp.s === 200 && rp.j.data.scadenza === 'riapri', rp.j);
  const riaperta = (await g(G1, `/scadenze/${prima.uuid}`)).j.data;
  v('stessa scadenza, aperta, stessa data', !riaperta.chiusa && riaperta.scadeIl === prima.scadeIl, { chiusa: riaperta.chiusa, scadeIl: riaperta.scadeIl, prima: prima.scadeIl });
  v('di nuovo riprendere -> 409', (await g(G1, `${base}/riprendi`, 'POST', {})).s === 409);
  const c2 = (await g(G1, `/soggetti/${sog.uuid}/controlli`)).j.data;
  const d = c2.decisioni[0];
  console.log('storico', JSON.stringify(d));
  v('storico: decisa e ripresa da Demo Admin, con la nota', d.decisaDa === 'Demo Admin' && d.ripresaDa === 'Demo Admin' && d.notaRipresa === 'fine della prova' && c2.controlli.find(c => c.uuid === bollo.uuid).seguito, d);
  console.log('DECISIONE_DI_PROVA', d.uuid);
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
