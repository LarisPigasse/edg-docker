// Prove dal vivo di F1: filtro per stato e nome già usato; poi tutto come prima
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = p => jwt.sign({ accountType: 'operatore', roleId: 1, modules: ['*'], ...p }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const UFF = firma({ accountId: 10, tenantId: 2, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.write'] });
const ROOT = firma({ accountId: 1, tenantId: 1, email: 'root@expressdeliverygroup.com', permissions: ['*'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' → ' + JSON.stringify(x).slice(0, 400) : ''}`); };
(async () => {
  const c = async (gw, t, m, p, b) => {
    const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: m, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, ...(b ? { body: JSON.stringify(b) } : {}) });
    let j = null; try { j = await r.json(); } catch {}
    return { s: r.status, j, d: j?.data };
  };
  const G1 = 'api-gateway-1', G2 = 'api-gateway-2';
  const creati = [];
  const nomi = l => (l.d || []).map(x => x.nome);
  try {
    for (const gw of [G1, G2]) v(`${gw}: elenco con stato=tutti`, (await c(gw, UFF, 'GET', '/fornitori?stato=tutti')).s === 200);
    v('stato sconosciuto: 400', (await c(G1, UFF, 'GET', '/fornitori?stato=boh')).s === 400);
    const a = await c(G1, UFF, 'POST', '/fornitori', { nome: 'PROVA F1 Officina', tipo: 'officina' });
    if (a.d?.uuid) creati.push(a.d.uuid);
    v('creato "PROVA F1 Officina"', a.s === 201, a.j);
    const dop = await c(G2, UFF, 'POST', '/fornitori', { nome: '  prova f1 OFFICINA ', tipo: 'gommista' });
    if (dop.d?.uuid) creati.push(dop.d.uuid);
    v('stesso nome (maiuscole e spazi diversi): 409 in italiano', dop.s === 409 && /Esiste già un fornitore con questo nome: "PROVA F1 Officina"/.test(dop.j?.message ?? JSON.stringify(dop.j)), dop.j);
    v('stesso nome in un altro tenant: permesso', await (async () => {
      const r = await c(G1, ROOT, 'POST', '/fornitori', { nome: 'PROVA F1 Officina', tipo: 'officina' });
      if (r.d?.uuid) await c(G1, ROOT, 'DELETE', `/fornitori/${r.d.uuid}`);
      return r.s === 201;
    })());
    const b = await c(G1, UFF, 'POST', '/fornitori', { nome: 'PROVA F1 Gommista', tipo: 'gommista' });
    if (b.d?.uuid) creati.push(b.d.uuid);
    v('creato "PROVA F1 Gommista"', b.s === 201, b.j);
    v('rinomina con il nome di un altro: 409', (await c(G2, UFF, 'PATCH', `/fornitori/${b.d.uuid}`, { nome: 'Prova F1 officina' })).s === 409);
    const self = await c(G2, UFF, 'PATCH', `/fornitori/${b.d.uuid}`, { nome: 'PROVA F1 GOMMISTA' });
    v('cambio di maiuscole sul proprio nome: permesso', self.s === 200 && self.d.nome === 'PROVA F1 GOMMISTA', self.j);
    v('modifica senza nome: nessun controllo, 200', (await c(G1, UFF, 'PATCH', `/fornitori/${b.d.uuid}`, { telefono: '0861 111111' })).s === 200);

    v('disattiva "PROVA F1 Officina"', (await c(G1, UFF, 'PATCH', `/fornitori/${a.d.uuid}`, { attivo: false })).s === 200);
    const t = '&testo=PROVA%20F1';
    v('predefinito: solo attivi', JSON.stringify(nomi(await c(G1, UFF, 'GET', `/fornitori?ordina=nome${t}`))) === '["PROVA F1 GOMMISTA"]');
    v('stato=attivi: solo attivi', JSON.stringify(nomi(await c(G2, UFF, 'GET', `/fornitori?stato=attivi${t}`))) === '["PROVA F1 GOMMISTA"]');
    v('stato=disattivati', JSON.stringify(nomi(await c(G1, UFF, 'GET', `/fornitori?stato=disattivati${t}`))) === '["PROVA F1 Officina"]');
    const tu = await c(G2, UFF, 'GET', `/fornitori?stato=tutti${t}`);
    v('stato=tutti: entrambi, con attivo', tu.d?.length === 2 && tu.d.some(x => !x.attivo) && tu.d.some(x => x.attivo), nomi(tu));
    v('vecchio attivo=false ancora valido', JSON.stringify(nomi(await c(G1, UFF, 'GET', `/fornitori?attivo=false${t}`))) === '["PROVA F1 Officina"]');
    v('stato vince su attivo', (await c(G1, UFF, 'GET', `/fornitori?stato=tutti&attivo=false${t}`)).d?.length === 2);
    v('stato + tipo', JSON.stringify(nomi(await c(G2, UFF, 'GET', `/fornitori?stato=tutti&tipo=gommista${t}`))) === '["PROVA F1 GOMMISTA"]');
    const dis = await c(G1, UFF, 'POST', '/fornitori', { nome: 'prova f1 officina', tipo: 'officina' });
    if (dis.d?.uuid) creati.push(dis.d.uuid);
    v('nome di un disattivato: 409 che dice di riattivarlo', dis.s === 409 && /disattivato.*Riattivalo/.test(dis.j?.message ?? ''), dis.j);
  } catch (e) {
    console.log('ERRORE', e.message);
    ko++;
  } finally {
    for (const u of creati) v(`pulizia ${u.slice(0, 8)}`, (await c(G1, UFF, 'DELETE', `/fornitori/${u}`)).s === 204);
    console.log(`TOTALE: ${ok} ok, ${ko} ko`);
  }
})();
