const jwt = require('/app/node_modules/jsonwebtoken');
const firma = p => jwt.sign({ accountType: 'cliente', roleId: 1, modules: ['*'], tenantId: 2, ...p }, process.env.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
const ADMIN = firma({ accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const UFF = firma({ accountId: 10, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.write'] });
const ADD = firma({ accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.own'] });
const COSTI = firma({ accountId: 10, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.costi'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' → ' + JSON.stringify(x).slice(0, 300) : ''}`); };
const c = async (gw, t, p) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { headers: { Authorization: `Bearer ${t}` } }); let j = null; try { j = await r.json(); } catch {} return { s: r.status, j, d: j?.data }; };
(async () => {
  for (const gw of ['api-gateway-1', 'api-gateway-2']) {
    const a = await c(gw, ADMIN, '/resoconti/spese');
    v(`${gw}: admin, anno in corso`, a.s === 200 && a.d.periodo.dal.endsWith('-01-01') && a.d.totale.spesa > 0 && a.d.soglie.km === 512, a.j);
    v(`${gw}: ufficio senza costi → 403`, (await c(gw, UFF, '/resoconti/spese')).s === 403);
    v(`${gw}: addetto → 403`, (await c(gw, ADD, '/resoconti/spese')).s === 403);
    v(`${gw}: solo costi senza lettura → 403`, (await c(gw, COSTI, '/resoconti/spese')).s === 403);
  }
  const p = await c('api-gateway-1', ADMIN, '/resoconti/spese?periodo=personalizzato&dal=2025-03-01&al=2025-08-31&tipo=veicolo');
  v('personalizzato marzo-agosto 2025, veicoli', p.s === 200 && p.d.perMese.length === 6 && p.d.confronto.dal === '2024-03-01', p.j);
  const e = await c('api-gateway-2', ADMIN, '/resoconti/spese?periodo=personalizzato&dal=2020-01-01&al=2026-01-01');
  v('oltre 4 anni → 400 in italiano', e.s === 400 && /4 anni/.test(e.j?.message), e.j);
  v('personalizzato senza date → 400', (await c('api-gateway-1', ADMIN, '/resoconti/spese?periodo=personalizzato')).s === 400);
  const t = await c('api-gateway-2', ADMIN, '/resoconti/spese?testo=s-way');
  v('ricerca "s-way": solo i due S-Way', t.s === 200 && t.d.perSoggetto.length === 2 && t.d.perSoggetto.every(s => s.nome.includes('S-Way')), t.d?.perSoggetto?.map(s => s.nome));
  console.log(`TOTALE: ${ok} ok, ${ko} ko`);
})();
