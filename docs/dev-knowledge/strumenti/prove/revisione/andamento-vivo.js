// Andamento dei costi del DAF XF 01 (GET /resoconti/mezzi/:id/andamento) sui due gateway, confrontato con la scheda
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = o => jwt.sign({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, ...o }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const T = firma({ roleId: 2, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const TL = firma({ roleId: 3, accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.read'] });
const DAF = 'dfe34431-f501-41bb-a08e-cfd57918eede';
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
(async () => {
  for (const gw of ['api-gateway-1', 'api-gateway-2']) {
    const g = async (p, tok = T) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { headers: { Authorization: `Bearer ${tok}` } }); return { s: r.status, j: await r.json().catch(() => null) }; };
    const a = (await g(`/resoconti/mezzi/${DAF}/andamento`)).j.data;
    // la scheda sugli stessi mesi chiusi del grafico
    const c = (await g(`/resoconti/mezzi?periodo=personalizzato&dal=${a.periodo.dal}&al=${a.periodo.al}&soggetto=${DAF}`)).j.data.mezzi[0];
    console.log(gw, 'periodo', JSON.stringify(a.periodo), 'mesi', a.mesi.length, 'totali', JSON.stringify(a.totali), 'quote', JSON.stringify(a.quote));
    console.log(gw, 'scheda', JSON.stringify({ quota: c.possesso.quota, obblighi: c.possesso.obblighi, manutenzione: c.manutenzione.totale, uso: c.rifornimenti.totale }));
    console.log(gw, 'possesso mese per mese', a.mesi.map(m => `${m.mese}:${Math.round(m.possesso)}`).join(' '));
    const oggi = new Date().toISOString().slice(0, 7);
    v(`${gw}: ultimi 12 mesi chiusi, senza il mese in corso`, a.mesi.length === 12 && a.periodo.dal.endsWith('-01') && !a.mesi.some(m => m.mese === oggi) && a.nessunMeseChiuso === false, [a.periodo, a.mesi.map(m => m.mese)]);
    v(`${gw}: quota come la scheda (entro 1 €)`, Math.abs(a.totali.quota - c.possesso.quota) <= 1, [a.totali.quota, c.possesso.quota]);
    v(`${gw}: manutenzione e guasti come la scheda`, Math.abs(a.totali.manutenzione - c.manutenzione.totale) < 0.01, [a.totali.manutenzione, c.manutenzione.totale]);
    v(`${gw}: rifornimenti e uso come la scheda`, Math.abs(a.totali.uso - c.rifornimenti.totale) < 0.01, [a.totali.uso, c.rifornimenti.totale]);
    const pieni = a.mesi.map(m => m.possesso);
    v(`${gw}: possesso quasi una retta nei mesi pieni (scarto < 40%)`, Math.max(...pieni) / Math.min(...pieni) < 1.4, pieni);
    v(`${gw}: somma dei mesi = totale`, Math.abs(a.mesi.reduce((t, m) => t + m.totale, 0) - a.totali.totale) < 0.05);
    const i = (await g(`/resoconti/mezzi/${DAF}/andamento?periodo=inizio`)).j.data;
    console.log(gw, 'da quando c\'è', JSON.stringify(i.periodo), 'troncato', i.troncato, 'mesi', i.mesi.length);
    v(`${gw}: da quando c'è, troncato agli ultimi 4 anni`, i.troncato === true && i.mesi.length >= 48 && i.mesi.length <= 49 && !i.mesi.some(m => m.mese === new Date().toISOString().slice(0, 7)), i.periodo);
    const sch = (await g(`/resoconti/mezzi/${DAF}/andamento?periodo=12m`)).j.data;
    const c12 = (await g(`/resoconti/mezzi?periodo=12m&soggetto=${DAF}`)).j.data.mezzi[0];
    v(`${gw}: "come la scheda" -> stesso periodo e stessi totali della scheda, mese in corso segnato`,
      sch.meseInCorso === oggi && sch.mesi.at(-1).mese === oggi && Math.abs(sch.totali.quota - c12.possesso.quota) <= 1 &&
      Math.abs(sch.totali.manutenzione - c12.manutenzione.totale) < 0.01 && Math.abs(sch.totali.uso - c12.rifornimenti.totale) < 0.01,
      // nessuna differenza: anche obblighi e totale come la scheda
      // (quota al centesimo come la scheda)

      [sch.periodo, sch.meseInCorso, sch.totali, { quota: c12.possesso.quota, man: c12.manutenzione.totale, uso: c12.rifornimenti.totale }]);
    v(`${gw}: "Ultimi 12 mesi" -> obblighi e totale identici alla scheda`, sch.obblighiRipartiti === false && Math.abs(sch.totali.obblighi - c12.possesso.obblighi) < 0.01 && Math.abs(sch.totali.totale - c12.totale) < 0.01,
      [sch.totali, { obblighi: c12.possesso.obblighi, totale: c12.totale }]);
    v(`${gw}: i mesi chiusi non hanno il mese in corso segnato e ripartiscono gli obblighi`, a.meseInCorso === null && a.obblighiRipartiti === true);
    const anno = (await g(`/resoconti/mezzi/${DAF}/andamento?periodo=anno`)).j.data;
    v(`${gw}: anno in corso senza il mese in corso`, anno.mesi.length > 0 && !anno.mesi.some(m => m.mese === oggi) && anno.periodo.dal.endsWith('-01-01'), anno.periodo);
    const sett = (await g(`/resoconti/mezzi/${DAF}/andamento?periodo=personalizzato&dal=${oggi}-02&al=${oggi}-10`)).j.data;
    v(`${gw}: solo il mese in corso -> nessun mese chiuso`, sett.nessunMeseChiuso === true && sett.mesi.length === 0, sett);
    v(`${gw}: senza costi -> 403`, (await g(`/resoconti/mezzi/${DAF}/andamento`, TL)).s === 403);
    v(`${gw}: periodo sbagliato -> 400`, (await g(`/resoconti/mezzi/${DAF}/andamento?periodo=x`)).s === 400);
    v(`${gw}: personalizzato senza date -> 400`, (await g(`/resoconti/mezzi/${DAF}/andamento?periodo=personalizzato`)).s === 400);
    v(`${gw}: mezzo inesistente -> 404`, (await g('/resoconti/mezzi/00000000-0000-4000-8000-000000000000/andamento')).s === 404);
    const persona = (await g('/soggetti?tipo=persona&pagina=1&righe=1')).j.data[0];
    v(`${gw}: una persona -> 400`, (await g(`/resoconti/mezzi/${persona.uuid}/andamento`)).s === 400);
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
