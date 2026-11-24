// Categorie: contatore che serve a controlli a uso (rifiuto), personalizzata, nuova categoria (creata, modificata, eliminata)
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = o => jwt.sign({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, ...o }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const T = firma({ roleId: 2, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const TW = firma({ roleId: 3, accountId: 10, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.write', 'vigilo.costi'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 500) : ''}`); };
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
const g = async (gw, p, metodo = 'GET', corpo, tok = T) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
let nuova = null;
(async () => {
  const categorie = (await g(G1, '/categorie?righe=128')).j.data;
  const controlli = (await g(G1, '/controlli?righe=128')).j.data;
  // una categoria con km e un controllo attivo a km che vale per lei
  const aKm = controlli.filter(c => c.attivo && c.cadenza.uso?.unita === 'km');
  const k = categorie.find(c => c.contatori.includes('km') && aKm.some(x => !x.categorie.length ? x.tipoSoggetto === c.tipoSoggetto : x.categorie.some(y => y.uuid === c.uuid)));
  console.log('categoria', k?.nome, '· controlli a km', aKm.map(c => c.nome).join(', '));
  try {
    const rif = await g(G1, `/categorie/${k.uuid}`, 'PATCH', { contatori: k.contatori.filter(u => u !== 'km') });
    console.log('togliere km ->', rif.s, rif.j && rif.j.message);
    v('togliere il contatore km che serve: rifiutato con i nomi dei controlli', rif.s === 409 && /serve ai controlli/.test(rif.j.message || ''), rif.j);
    v('la categoria tiene il contatore km (gw2)', (await g(G2, '/categorie?righe=128')).j.data.find(c => c.uuid === k.uuid).contatori.includes('km'));
    // personalizzata
    const lib = categorie.find(c => c.libreria && !c.personalizzata);
    const d = await g(G2, `/categorie/${lib.uuid}`, 'PATCH', { descrizione: 'Descrizione di prova' });
    v(`"${lib.nome}" con un'altra descrizione: personalizzata`, d.s === 200 && d.j.data.personalizzata === true, d.j.data && d.j.data.personalizzata);
    const r = await g(G1, `/categorie/${lib.uuid}`, 'PATCH', { descrizione: lib.descrizione });
    v('rimessa la descrizione: non più personalizzata', r.j.data.personalizzata === false, r.j.data.personalizzata);
    // nuova categoria
    v('chi ha write ma non config non crea categorie -> 403', (await g(G1, '/categorie', 'POST', { tipoSoggetto: 'veicolo', nome: 'x' }, TW)).s === 403);
    const n = await g(G1, '/categorie', 'POST', { tipoSoggetto: 'veicolo', nome: 'Categoria di prova', icona: 'Truck', ordine: 0, contatori: ['km'], campi: [{ chiave: 'portataMassimaKg', etichetta: 'Portata massima (kg)', tipo: 'numero', obbligatorio: false, ordine: 0 }] });
    nuova = n.j?.data?.uuid;
    v('nuova categoria creata, non della libreria', n.s === 201 && n.j.data.libreria === null && n.j.data.personalizzata === false && n.j.data.campi.length === 1, n.j);
    const dup = await g(G2, '/categorie', 'POST', { tipoSoggetto: 'veicolo', nome: 'Categoria di prova' });
    v('stesso nome per lo stesso tipo: rifiutato', dup.s === 409, dup.s);
    const m = await g(G2, `/categorie/${nuova}`, 'PATCH', { contatori: ['km', 'ore'], campi: [...n.j.data.campi, { chiave: 'allestimento', etichetta: 'Allestimento', tipo: 'elenco', opzioni: ['Cassone', 'Furgone'], obbligatorio: true, ordine: 1 }] });
    v('modificata: due contatori, due campi (uno a elenco)', m.s === 200 && m.j.data.contatori.length === 2 && m.j.data.campi[1].opzioni.length === 2, m.j);
    const vuoto = await g(G1, `/categorie/${nuova}`, 'PATCH', { campi: [{ chiave: 'x', etichetta: 'Elenco vuoto', tipo: 'elenco', opzioni: [], obbligatorio: false, ordine: 0 }] });
    v('un elenco senza opzioni: rifiutato', vuoto.s === 400, vuoto.s);
  } finally {
    if (nuova) console.log('eliminata la categoria di prova:', (await g(G1, `/categorie/${nuova}`, 'DELETE')).s);
    const fine = (await g(G1, '/categorie?righe=128')).j.data;
    console.log('alla fine: categorie', fine.length, '· personalizzate', fine.filter(c => c.personalizzata).map(c => c.nome).join(', ') || 'nessuna');
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
