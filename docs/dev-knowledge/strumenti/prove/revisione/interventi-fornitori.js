// Interventi e costi per fornitore (GET /resoconti/fornitori) sui due gateway, confrontati con Spese e consumi
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = o => jwt.sign({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, ...o }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const T = firma({ roleId: 2, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const TL = firma({ roleId: 3, accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.read'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const tondo = n => Math.round(n * 100) / 100;
(async () => {
  for (const gw of ['api-gateway-1', 'api-gateway-2']) {
    const g = async (p, tok = T) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { headers: { Authorization: `Bearer ${tok}` } }); return { s: r.status, j: await r.json().catch(() => null) }; };
    const tutti = await g('/resoconti/fornitori');
    const d = tutti.j.data;
    console.log(gw, 'periodo', JSON.stringify(d.periodo), 'fornitori', d.fornitori.length, 'interventi', d.interventi, 'totale', d.totale);
    v(`${gw}: tutti -> 200, ultimi 12 mesi`, tutti.s === 200 && d.fornitori.length > 0, tutti.j);
    v(`${gw}: totale = somma dei subtotali`, tondo(d.fornitori.reduce((t, f) => t + f.totale, 0)) === d.totale && d.fornitori.reduce((n, f) => n + f.interventi, 0) === d.interventi);
    v(`${gw}: dal più costoso`, d.fornitori.every((f, i, a) => !i || a[i - 1].totale >= f.totale));
    const sp = (await g('/resoconti/spese?periodo=12m')).j.data;
    const perF = new Map(sp.perFornitore.map(f => [f.uuid, f.importi]));
    const diversi = d.fornitori.filter(f => (perF.get(f.uuid) ?? 0) !== f.totale).map(f => [f.nome, f.totale, perF.get(f.uuid)]);
    v(`${gw}: ogni subtotale = "A chi vanno" di Spese e consumi`, diversi.length === 0 && sp.perFornitore.length <= 64, diversi);
    const tipo = d.fornitori.find(f => f.tipo).tipo;
    const t = (await g(`/resoconti/fornitori?tipoFornitore=${tipo.chiave}`)).j.data;
    const atteso = sp.perTipoFornitore.find(x => x.chiave === tipo.chiave);
    v(`${gw}: tipo "${tipo.nome}" -> solo quel tipo, totale come Spese e consumi`, t.fornitori.every(f => f.tipo && f.tipo.chiave === tipo.chiave) && t.totale === atteso.importi, [t.totale, atteso]);
    const uno = d.fornitori[0];
    const u = (await g(`/resoconti/fornitori?fornitore=${uno.uuid}&periodo=12m`)).j.data;
    v(`${gw}: un fornitore (${uno.nome}) -> solo lui, stesso totale`, u.fornitori.length === 1 && u.fornitori[0].uuid === uno.uuid && u.totale === uno.totale && u.fornitori[0].quota === 100, u.fornitori.map(f => [f.nome, f.totale]));
    const riga = u.fornitori[0].righe[0];
    console.log(gw, 'prima riga di', uno.nome, JSON.stringify(riga));
    v(`${gw}: righe dalla più vecchia`, u.fornitori[0].righe.every((r, i, a) => !i || a[i - 1].giorno <= r.giorno));
    const rif = d.fornitori.flatMap(f => f.righe).filter(r => r.natura === 'uso');
    v(`${gw}: rifornimenti inclusi ("Rifornimento: …")`, rif.length > 0 && rif.every(r => r.intervento.startsWith('Rifornimento: ')), rif[0]);
    const anno = (await g('/resoconti/fornitori?periodo=anno')).j.data;
    v(`${gw}: anno in corso dal 1° gennaio`, anno.periodo.dal.endsWith('-01-01'), anno.periodo);
    v(`${gw}: senza costi -> 403`, (await g('/resoconti/fornitori', TL)).s === 403);
    v(`${gw}: periodo sbagliato -> 400`, (await g('/resoconti/fornitori?periodo=x')).s === 400);
    v(`${gw}: personalizzato senza date -> 400`, (await g('/resoconti/fornitori?periodo=personalizzato')).s === 400);
    v(`${gw}: fornitore inesistente -> 404`, (await g('/resoconti/fornitori?fornitore=00000000-0000-4000-8000-000000000000')).s === 404);
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
