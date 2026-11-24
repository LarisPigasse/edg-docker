// Disattiva / riattiva un controllo e una categoria sui due gateway: le scadenze si riaprono con le loro date; tutto torna com'era
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = o => jwt.sign({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, ...o }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const T = firma({ roleId: 2, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const TW = firma({ roleId: 3, accountId: 10, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.write', 'vigilo.costi'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 500) : ''}`); };
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
const g = async (gw, p, metodo = 'GET', corpo, tok = T) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
const aperte = async (gw, uuid) => {
  const d = (await g(gw, `/scadenze?controllo=${uuid}&righe=128`)).j.data;
  return d.map(s => ({ uuid: s.uuid, soggetto: s.soggetto?.nome, date: JSON.stringify(Object.fromEntries(Object.entries(s).filter(([k]) => /(^data|Il$|^scade|^entro|^prossim)/i.test(k)))) })).sort((a, b) => a.uuid.localeCompare(b.uuid));
};
(async () => {
  const controlli = (await g(G1, '/controlli?righe=128')).j.data;
  const c = controlli.filter(x => x.attivo && x.automatico && (x.scadenzeAperte ?? 0) >= 3).sort((a, b) => b.scadenzeAperte - a.scadenzeAperte)[0];
  const categorie = (await g(G1, '/categorie?righe=128')).j.data;
  const k = categorie.filter(x => x.attiva && (x.soggetti ?? 0) >= 2)[0];
  console.log('controllo', c.nome, c.uuid, 'aperte', c.scadenzeAperte, '· categoria', k.nome, 'soggetti', k.soggetti);
  const prima = await aperte(G1, c.uuid);
  console.log('esempio di scadenza', JSON.stringify(prima[0]));
  try {
    v('chi ha write ma non config non disattiva -> 403', (await g(G1, `/controlli/${c.uuid}`, 'PATCH', { attivo: false }, TW)).s === 403);
    const dis = await g(G1, `/controlli/${c.uuid}`, 'PATCH', { attivo: false });
    v(`disattivato (gw1): ${prima.length} scadenze chiuse`, dis.s === 200 && dis.j.data.attivo === false && dis.j.data.scadenzeChiuse === prima.length, dis.j && { s: dis.s, chiuse: dis.j.data?.scadenzeChiuse });
    v('nessuna scadenza aperta del controllo (gw2)', (await aperte(G2, c.uuid)).length === 0);
    const ria = await g(G2, `/controlli/${c.uuid}`, 'PATCH', { attivo: true });
    v(`riattivato (gw2): ${prima.length} riaperte, nessuna nuova`, ria.s === 200 && ria.j.data.scadenzeRiaperte === prima.length && ria.j.data.scadenzeCreate === 0, ria.j && { riaperte: ria.j.data?.scadenzeRiaperte, create: ria.j.data?.scadenzeCreate });
    const dopo = await aperte(G1, c.uuid);
    v('le stesse scadenze, con le stesse date (gw1)', JSON.stringify(dopo) === JSON.stringify(prima), { prima: prima.slice(0, 2), dopo: dopo.slice(0, 2) });
    const di_nuovo = await g(G1, `/controlli/${c.uuid}`, 'PATCH', { attivo: true });
    v('riattivarlo di nuovo non cambia niente', di_nuovo.s === 200 && di_nuovo.j.data.scadenzeRiaperte === 0 && di_nuovo.j.data.scadenzeCreate === 0);
    // categoria
    v('chi ha write ma non config non disattiva la categoria -> 403', (await g(G2, `/categorie/${k.uuid}`, 'PATCH', { attiva: false }, TW)).s === 403);
    const kd = await g(G2, `/categorie/${k.uuid}`, 'PATCH', { attiva: false });
    const kLetta = (await g(G1, '/categorie?righe=128')).j.data.find(x => x.uuid === k.uuid);
    v(`categoria disattivata (gw2): i ${k.soggetti} soggetti restano`, kd.s === 200 && kLetta.attiva === false && kLetta.soggetti === k.soggetti, kLetta);
    const kr = await g(G1, `/categorie/${k.uuid}`, 'PATCH', { attiva: true });
    v('categoria riattivata (gw1)', kr.s === 200 && kr.j.data.attiva === true);
  } finally {
    await g(G1, `/controlli/${c.uuid}`, 'PATCH', { attivo: true });
    await g(G1, `/categorie/${k.uuid}`, 'PATCH', { attiva: true });
    const fine = (await g(G1, '/controlli?righe=128')).j.data.find(x => x.uuid === c.uuid);
    console.log('alla fine:', c.nome, 'attivo', fine.attivo, 'aperte', fine.scadenzeAperte, '·', k.nome, 'attiva', (await g(G1, '/categorie?righe=128')).j.data.find(x => x.uuid === k.uuid).attiva);
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
