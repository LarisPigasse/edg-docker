// Prove dal vivo di F0: tipi di fornitore comuni, fornitori per chiave, storico per fornitore; poi tutto come prima
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = p => jwt.sign({ accountType: 'operatore', roleId: 1, modules: ['*'], ...p }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const ROOT = firma({ accountId: 1, tenantId: 1, email: 'root@expressdeliverygroup.com', permissions: ['*'] });
const ADMIN = firma({ accountId: 9, tenantId: 2, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const UFF = firma({ accountId: 10, tenantId: 2, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.write'] });
const ADD = firma({ accountId: 4, tenantId: 2, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.own'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' → ' + JSON.stringify(x).slice(0, 400) : ''}`); };
(async () => {
  const c = async (gw, t, m, p, b) => {
    const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: m, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, ...(b ? { body: JSON.stringify(b) } : {}) });
    let j = null; try { j = await r.json(); } catch {}
    return { s: r.status, j, d: j?.data };
  };
  const G1 = 'api-gateway-1', G2 = 'api-gateway-2';
  let fornitore = null, tipoNuovo = null;
  try {
    for (const gw of [G1, G2]) {
      const l = await c(gw, UFF, 'GET', '/fornitori/tipi');
      v(`${gw}: tipi per il cliente, 9 attivi, Altro in fondo, senza conteggi`, l.s === 200 && l.d.length === 9 && l.d[8].chiave === 'altro' && !('fornitori' in l.d[0]), l.d?.map(t => t.chiave));
      const r = await c(gw, ROOT, 'GET', '/fornitori/tipi');
      v(`${gw}: per root con quanti fornitori li usano`, r.s === 200 && typeof r.d?.[0]?.fornitori === 'number', r.j);
    }
    v('amministratore cliente (vigilo.*) non crea tipi: 403', (await c(G1, ADMIN, 'POST', '/fornitori/tipi', { nome: 'Elettrauto' })).s === 403);
    const nt = await c(G2, ROOT, 'POST', '/fornitori/tipi', { nome: 'Elettrauto' });
    tipoNuovo = nt.d?.chiave;
    v('root crea "Elettrauto": chiave elettrauto', nt.s === 201 && tipoNuovo === 'elettrauto', nt.j);
    const dop = await c(G1, ROOT, 'POST', '/fornitori/tipi', { nome: ' elettrauto ' });
    v('nome doppio: 400 in italiano', dop.s === 400 && JSON.stringify(dop.j).includes('Esiste già'), dop.j);
    const ren = await c(G1, ROOT, 'PATCH', '/fornitori/tipi/elettrauto', { nome: 'Elettrauto e climatizzazione' });
    v('rinomina: la chiave resta', ren.s === 200 && ren.d.chiave === 'elettrauto' && ren.d.nome === 'Elettrauto e climatizzazione', ren.j);
    v('"Altro" non si disattiva: 409', (await c(G2, ROOT, 'PATCH', '/fornitori/tipi/altro', { attivo: false })).s === 409);
    v('"Altro" non si elimina: 409', (await c(G2, ROOT, 'DELETE', '/fornitori/tipi/altro')).s === 409);

    v('fornitore senza tipo: 400', (await c(G1, UFF, 'POST', '/fornitori', { nome: 'PROVA F0 Officina' })).s === 400);
    v('fornitore con tipo sconosciuto: 400', (await c(G1, UFF, 'POST', '/fornitori', { nome: 'PROVA F0 Officina', tipo: 'astronave' })).s === 400);
    const f = await c(G1, UFF, 'POST', '/fornitori', { nome: 'PROVA F0 Officina', tipo: 'elettrauto', telefono: '0861 000000' });
    fornitore = f.d?.uuid;
    v('fornitore creato con il tipo per chiave', f.s === 201 && f.d.tipo?.chiave === 'elettrauto' && f.d.tipo.nome === 'Elettrauto e climatizzazione' && f.d.registrazioni === 0 && f.d.ultimaIl === null, f.j);
    const per = await c(G2, UFF, 'GET', '/fornitori?tipo=elettrauto');
    v('elenco filtrato per tipo', per.s === 200 && per.d.length === 1 && per.d[0].uuid === fornitore, per.d?.map(x => x.nome));
    v('tipo sconosciuto nel filtro: nessuno', (await c(G2, UFF, 'GET', '/fornitori?tipo=astronave')).d?.length === 0);
    const ord = await c(G1, UFF, 'GET', '/fornitori?ordina=tipo');
    v('ordine per tipo: 200', ord.s === 200, ord.j);
    const mod = await c(G1, UFF, 'PATCH', `/fornitori/${fornitore}`, { tipo: 'officina' });
    v('cambio di tipo', mod.s === 200 && mod.d.tipo?.chiave === 'officina', mod.j);
    await c(G1, UFF, 'PATCH', `/fornitori/${fornitore}`, { tipo: 'elettrauto' });

    const dis = await c(G2, ROOT, 'PATCH', '/fornitori/tipi/elettrauto', { attivo: false });
    v('root disattiva il tipo', dis.s === 200 && dis.d.attivo === false && dis.d.fornitori === 1, dis.j);
    v('tipo disattivato non si assegna a un fornitore nuovo: 400', (await c(G1, UFF, 'POST', '/fornitori', { nome: 'PROVA F0 bis', tipo: 'elettrauto' })).s === 400);
    v('chi ce l’ha lo tiene (modifica di altri campi)', (await c(G1, UFF, 'PATCH', `/fornitori/${fornitore}`, { note: 'ok', tipo: 'elettrauto' })).s === 200);
    v('il cliente non vede il tipo disattivato', !(await c(G1, UFF, 'GET', '/fornitori/tipi')).d?.some(t => t.chiave === 'elettrauto'));
    v('tipo in uso non si elimina: 409', (await c(G2, ROOT, 'DELETE', '/fornitori/tipi/elettrauto')).s === 409);

    const st = await c(G1, UFF, 'GET', `/registrazioni?fornitore=${fornitore}`);
    v('storico di un fornitore: 200, vuoto', st.s === 200 && Array.isArray(st.d) && st.d.length === 0, st.j);
    const ent = await c(G2, UFF, 'GET', `/registrazioni?fornitore=${fornitore}&soggetto=${fornitore}`);
    v('soggetto e fornitore insieme: 400', ent.s === 400, ent.j);
    v('storico di un fornitore per l’addetto: 403', (await c(G2, ADD, 'GET', `/registrazioni?fornitore=${fornitore}`)).s === 403);
  } catch (e) {
    console.log('ERRORE', e.message);
    ko++;
  } finally {
    if (fornitore) v('pulizia: fornitore eliminato', (await c(G1, UFF, 'DELETE', `/fornitori/${fornitore}`)).s === 204);
    if (tipoNuovo) v('pulizia: tipo eliminato', (await c(G1, ROOT, 'DELETE', `/fornitori/tipi/${tipoNuovo}`)).s === 204);
    console.log(`TOTALE: ${ok} ok, ${ko} ko`);
  }
})();
