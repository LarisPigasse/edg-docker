// Nuovo controllo e Duplica: anteprima = creazione vera, copia con i destinatari e senza libreria, non automatico, rifiuti.
// Stampa gli uuid creati per la pulizia (pulisci-controlli.js nel container di vigilo-service).
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = o => jwt.sign({ accountType: 'cliente', modules: ['vigilo'], tenantId: 2, systemTenant: false, ...o }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const T = firma({ roleId: 2, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const TW = firma({ roleId: 3, accountId: 10, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.write', 'vigilo.costi'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 500) : ''}`); };
const [G1, G2] = ['api-gateway-1', 'api-gateway-2'];
const g = async (gw, p, metodo = 'GET', corpo, tok = T) => { const r = await fetch(`http://${gw}:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
const norm = c => ({ tempo: c.tempo, uso: c.uso, ancoraggio: c.ancoraggio, fineMese: c.fineMese, prima: c.prima, finestra: c.finestra ?? null, fasce: c.fasce ?? null });
const creati = [];
(async () => {
  const controlli = (await g(G1, '/controlli?righe=128')).j.data;
  const o = controlli.find(x => x.nome === 'Assicurazione RCA');
  const persona = controlli.find(x => x.tipoSoggetto === 'persona' && x.attivo && x.cadenza.tempo);
  const quanti = controlli.length;
  // come fa l'interfaccia con Duplica
  const copia = {
    nome: `${o.nome} (copia di prova)`, natura: o.natura, tipoSoggetto: o.tipoSoggetto, descrizione: o.descrizione, riferimentoNormativo: o.riferimentoNormativo,
    categorie: o.categorie.map(k => k.uuid), cadenza: norm(o.cadenza), preavvisi: o.preavvisi, tolleranza: o.tolleranza, avvisaAncheSeFermo: o.avvisaAncheSeFermo,
    registrazione: o.registrazione, rinnovo: o.rinnovo, rinviabile: o.rinviabile, automatico: true, ordine: o.ordine, destinatari: o.destinatari,
  };
  try {
    v('chi ha write ma non config non chiede l\'anteprima -> 403', (await g(G1, '/controlli/anteprima', 'POST', copia, TW)).s === 403);
    const ant = await g(G1, '/controlli/anteprima', 'POST', copia);
    console.log('anteprima', ant.s, JSON.stringify(ant.j.data));
    v('l\'anteprima non crea niente (gw2)', (await g(G2, '/controlli?righe=128')).j.data.length === quanti);
    const vera = await g(G2, '/controlli', 'POST', copia);
    if (vera.j?.data?.uuid) creati.push(vera.j.data.uuid);
    console.log('creato', vera.s, vera.j.data.nome, 'scadenze', vera.j.data.scadenzeCreate);
    v(`duplicato: anteprima = creazione vera (${ant.j.data.scadenzeCreate} scadenze) e stessa frase`, vera.s === 201 && vera.j.data.scadenzeCreate === ant.j.data.scadenzeCreate && vera.j.data.frasi.cadenza === ant.j.data.frasi.cadenza && vera.j.data.scadenzeCreate > 0, { ant: ant.j.data, vera: vera.j.data.scadenzeCreate });
    v('la copia ha i destinatari dell\'originale, nessun legame con la libreria', JSON.stringify(vera.j.data.destinatari) === JSON.stringify(o.destinatari) && vera.j.data.libreria === null && vera.j.data.personalizzato === false, { dest: vera.j.data.destinatari, lib: vera.j.data.libreria });
    const nuovo = { nome: 'Controllo di prova (non automatico)', natura: 'promemoria', tipoSoggetto: 'veicolo', categorie: [], cadenza: { tempo: { valore: 1, unita: 'anni' }, uso: null, ancoraggio: 'esecuzione', fineMese: false, prima: null, finestra: null, fasce: null }, automatico: false };
    const antN = (await g(G1, '/controlli/anteprima', 'POST', nuovo)).j.data;
    const n = await g(G1, '/controlli', 'POST', nuovo);
    if (n.j?.data?.uuid) creati.push(n.j.data.uuid);
    v('nuovo non automatico: nessuna scadenza, preavvisi predefiniti dell\'azienda', antN.scadenzeCreate === 0 && n.s === 201 && n.j.data.scadenzeCreate === 0 && n.j.data.preavvisi.giorni.length > 0, n.j.data && { preavvisi: n.j.data.preavvisi });
    const km = await g(G2, '/controlli/anteprima', 'POST', { nome: 'x', natura: 'adempimento', tipoSoggetto: 'persona', categorie: persona.categorie.map(k => k.uuid), cadenza: { ...norm(persona.cadenza), uso: { valore: 1000, unita: 'km' } } });
    v('una persona a km: anteprima rifiutata con il motivo', km.s === 400 && /contatore/.test(km.j.message || ''), km.j && km.j.message);
    v('senza nome: rifiutato', (await g(G1, '/controlli/anteprima', 'POST', { ...nuovo, nome: '' })).s === 400);
  } finally {
    console.log('DA_PULIRE ' + creati.join(','));
  }
  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
