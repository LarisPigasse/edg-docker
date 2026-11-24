// Elimina: "eliminabile" negli elenchi, eliminazioni senza storico, rifiuti (storico, controllo che vale solo per la categoria); non resta niente
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = o => jwt.sign({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, ...o }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const T = firma({ roleId: 2, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const TW = firma({ roleId: 3, accountId: 10, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.write', 'vigilo.costi'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
const g = async (gw, p, metodo = 'GET', corpo, tok = T) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
const cadenza = { tempo: { valore: 1, unita: 'anni' }, uso: null, ancoraggio: 'esecuzione', fineMese: false, prima: null, finestra: null, fasce: null };
let cat = null, ctr = null;
(async () => {
  const controlli = (await g(G1, '/controlli?righe=128')).j.data;
  const categorie = (await g(G1, '/categorie?righe=128')).j.data;
  const rca = controlli.find(c => c.nome === 'Assicurazione RCA');
  const conSoggetti = categorie.find(c => (c.soggetti ?? 0) > 0);
  console.log('controlli eliminabili', controlli.filter(c => c.eliminabile).length, '/', controlli.length, '· categorie eliminabili', categorie.filter(c => c.eliminabile).map(c => c.nome).join(', ') || 'nessuna');
  try {
    v('un controllo con scadenze non è eliminabile, e il servizio rifiuta', rca.eliminabile === false && (await g(G2, `/controlli/${rca.uuid}`, 'DELETE')).s === 409);
    v(`una categoria con soggetti ("${conSoggetti.nome}") non è eliminabile, e il servizio rifiuta`, conSoggetti.eliminabile === false && (await g(G1, `/categorie/${conSoggetti.uuid}`, 'DELETE')).s === 409);
    cat = (await g(G1, '/categorie', 'POST', { tipoSoggetto: 'veicolo', nome: 'Categoria di prova (elimina)' })).j.data.uuid;
    ctr = (await g(G1, '/controlli', 'POST', { nome: 'Controllo di prova (elimina)', natura: 'promemoria', tipoSoggetto: 'veicolo', categorie: [cat], cadenza, automatico: false })).j.data.uuid;
    const cLetta = (await g(G2, '/categorie?righe=128')).j.data.find(c => c.uuid === cat);
    const kLetto = (await g(G2, '/controlli?righe=128')).j.data.find(c => c.uuid === ctr);
    v('la categoria con un controllo che vale solo per lei non è eliminabile; il controllo nuovo sì', cLetta.eliminabile === false && kLetto.eliminabile === true, { cat: cLetta.eliminabile, ctr: kLetto.eliminabile });
    v('chi ha write ma non config non elimina -> 403', (await g(G1, `/controlli/${ctr}`, 'DELETE', null, TW)).s === 403);
    const rif = await g(G1, `/categorie/${cat}`, 'DELETE');
    console.log('elimina categoria ->', rif.s, rif.j && rif.j.message);
    v('eliminare la categoria: rifiutato, il controllo varrebbe per tutti', rif.s === 409 && /valgono solo per questa categoria/.test(rif.j.message || ''), rif.j);
    v('il controllo senza scadenze si elimina (gw2)', (await g(G2, `/controlli/${ctr}`, 'DELETE')).s === 204);
    ctr = null;
    v('ora la categoria è eliminabile', (await g(G1, '/categorie?righe=128')).j.data.find(c => c.uuid === cat).eliminabile === true);
    v('la categoria si elimina (gw1)', (await g(G1, `/categorie/${cat}`, 'DELETE')).s === 204);
    cat = null;
  } finally {
    if (ctr) console.log('pulizia controllo', (await g(G1, `/controlli/${ctr}`, 'DELETE')).s);
    if (cat) console.log('pulizia categoria', (await g(G1, `/categorie/${cat}`, 'DELETE')).s);
    console.log('alla fine: controlli', (await g(G1, '/controlli?righe=128')).j.data.length, '· categorie', (await g(G1, '/categorie?righe=128')).j.data.length);
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
