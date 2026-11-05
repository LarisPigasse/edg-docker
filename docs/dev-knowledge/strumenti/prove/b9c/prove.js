// Prove dal vivo di B9c: segnalazioni dell'addetto, sui due gateway
const jwt = require('/app/node_modules/jsonwebtoken');
const SEGRETO = process.env.JWT_SECRET;
const firma = p => jwt.sign({ accountType: 'operatore', tenantId: 2, roleId: 1, modules: ['*'], ...p }, SEGRETO, { expiresIn: '10m', issuer: 'edg-auth-service' });
const ADDETTO = firma({ accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.own'] });
const UFFICIO = firma({ accountId: 10, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.write'] });
const ESTRANEO = firma({ accountId: 900007, email: 'estraneo@example.com', permissions: ['vigilo.own'] });
const LETTORE = firma({ accountId: 900008, email: 'lettore@example.com', permissions: ['vigilo.read'] });
const FURGONE = '01c2d7bd-1516-45f3-adff-319222efd630';
const oggi = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date());
const domani = new Date(Date.parse(oggi) + 864e5).toISOString().slice(0, 10);
const tra8 = new Date(Date.parse(oggi) + 8 * 864e5).toISOString().slice(0, 10);
const PNG = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D4944415478DA63F8FFFF3F0005FE02FEA7A6A0A40000000049454E44AE426082', 'hex');

let ok = 0, ko = 0;
const verifica = (nome, cond, extra) => {
  cond ? ok++ : ko++;
  console.log(`${cond ? 'OK ' : 'KO '} ${nome}${!cond && extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 500) : ''}`);
};
const pausa = ms => new Promise(r => setTimeout(r, ms));

async function giro(gw) {
  console.log(`\n=== ${gw} ===`);
  const c = async (token, metodo, percorso, corpo) => {
    const r = await fetch(`http://${gw}:8080/api/vigilo${percorso}`, {
      method: metodo,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(corpo !== undefined ? { body: JSON.stringify(corpo) } : {}),
    });
    let j = null;
    try { j = await r.json(); } catch {}
    return { s: r.status, j, d: j?.data };
  };
  const carica = async (token, idScadenza) => {
    const f = new FormData();
    f.append('entita', 'scadenza');
    f.append('id', idScadenza);
    f.append('file', new Blob([PNG], { type: 'image/png' }), 'Ricevuta officina.png');
    const r = await fetch(`http://${gw}:8080/api/vigilo/allegati`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: f });
    const j = await r.json().catch(() => null);
    return { s: r.status, d: j?.data, j };
  };
  const avvisoDi = async (token, S) => (await c(token, 'GET', '/avvisi')).d?.voci?.filter(v => v.scadenza?.uuid === S) ?? [];

  const nuova = await c(UFFICIO, 'POST', '/scadenze', { soggetto: FURGONE, titolo: `Prova B9c ${gw}`, scadeIl: tra8 });
  verifica('ufficio: promemoria di prova sul Furgone Demo', nuova.s === 201, nuova);
  const S = nuova.d?.uuid;
  if (!S) return;
  try {
    const elenco = await c(ADDETTO, 'GET', `/scadenze?soggetto=${FURGONE}`);
    verifica('addetto: la vede, non segnalata', elenco.d?.some(s => s.uuid === S && s.segnalata === false), elenco.s);

    const futura = await c(ADDETTO, 'POST', `/scadenze/${S}/segnalazioni`, { eseguitaIl: domani });
    verifica('data nel futuro: 400', futura.s === 400, futura);
    const lettura = await c(ADDETTO, 'POST', `/scadenze/${S}/segnalazioni`, { eseguitaIl: oggi, lettura: 1000 });
    verifica('lettura senza contatore: 400', lettura.s === 400 && JSON.stringify(lettura.j).includes('contatore'), lettura);
    const estranea = await c(ESTRANEO, 'POST', `/scadenze/${S}/segnalazioni`, { eseguitaIl: oggi });
    verifica('addetto senza persona collegata: 404', estranea.s === 404, estranea);
    const ufficioSegnala = await c(UFFICIO, 'POST', `/scadenze/${S}/segnalazioni`, { eseguitaIl: oggi });
    verifica('ufficio senza own: 403 sulla segnalazione', ufficioSegnala.s === 403, ufficioSegnala.s);

    const doc = await carica(ADDETTO, S);
    verifica('addetto: documento caricato sulla scadenza', doc.s === 201 && doc.d?.uuid, doc);
    const A = doc.d?.uuid;

    const seg = await c(ADDETTO, 'POST', `/scadenze/${S}/segnalazioni`, { eseguitaIl: oggi, note: 'Fatto in officina', allegati: [A] });
    verifica('segnalazione 201: da-confermare, tua', seg.s === 201 && seg.d?.stato === 'da-confermare' && seg.d?.tua === true, seg);
    const R1 = seg.d?.uuid;
    const doppia = await c(ADDETTO, 'POST', `/scadenze/${S}/segnalazioni`, { eseguitaIl: oggi });
    verifica('seconda segnalazione: 409', doppia.s === 409, doppia);
    const registra = await c(UFFICIO, 'POST', `/scadenze/${S}/registrazioni`, { eseguitaIl: oggi });
    verifica('registra con segnalazione in attesa: 409', registra.s === 409 && JSON.stringify(registra.j).includes('confermala o respingila'), registra);

    const dA = (await c(ADDETTO, 'GET', `/scadenze/${S}`)).d;
    verifica('dettaglio addetto: segnalata, da Demo Utente, 1 documento, tua', dA?.segnalata && dA.segnalazione?.da === 'Demo Utente' && dA.segnalazione.documenti === 1 && dA.segnalazione.tua === true && !dA.chiusa, dA?.segnalazione);
    const dU = (await c(UFFICIO, 'GET', `/scadenze/${S}`)).d;
    verifica('dettaglio ufficio: non sua', dU?.segnalazione && dU.segnalazione.tua === false, dU?.segnalazione);
    const segnalate = await c(UFFICIO, 'GET', '/scadenze?segnalate=true&righe=64');
    verifica('elenco ?segnalate=true: c e, e solo segnalate', segnalate.d?.some(s => s.uuid === S) && segnalate.d.every(s => s.segnalata), segnalate.s);
    const dash = await c(UFFICIO, 'GET', '/dashboard');
    verifica('dashboard: daConfermare >= 1', dash.d?.daConfermare >= 1, dash.d?.daConfermare);

    await pausa(1500);
    const av1 = await avvisoDi(UFFICIO, S);
    verifica('ufficio: avviso "segnalata fatta … da Demo Utente"', av1.some(v => v.tipo === 'segnalazione' && v.stato.includes('da Demo Utente') && v.consegna === 'inviato'), av1);
    const avAdd = await avvisoDi(ADDETTO, S);
    verifica('chi segnala non riceve l avviso all ufficio', !avAdd.some(v => v.tipo === 'segnalazione'), avAdd);

    const ritEstraneo = await c(ESTRANEO, 'DELETE', `/segnalazioni/${R1}`);
    verifica('ritiro da addetto estraneo: 404', ritEstraneo.s === 404, ritEstraneo);
    const ritUfficio = await c(UFFICIO, 'DELETE', `/segnalazioni/${R1}`);
    verifica('ritiro da ufficio (senza own): 403', ritUfficio.s === 403, ritUfficio.s);
    const confLettore = await c(LETTORE, 'POST', `/segnalazioni/${R1}/conferma`, {});
    verifica('conferma con sola lettura: 403', confLettore.s === 403, confLettore.s);
    const confAddetto = await c(ADDETTO, 'POST', `/segnalazioni/${R1}/conferma`, {});
    verifica('conferma da addetto: 403', confAddetto.s === 403, confAddetto.s);

    const rit = await c(ADDETTO, 'DELETE', `/segnalazioni/${R1}`);
    verifica('ritiro: 204', rit.s === 204, rit);
    const dopoRit = (await c(ADDETTO, 'GET', `/scadenze/${S}`)).d;
    verifica('dopo il ritiro: nessuna segnalazione, nessuna registrazione', !dopoRit?.segnalata && !dopoRit?.segnalazione && dopoRit?.registrazioni.length === 0, dopoRit);
    const docs = (await c(ADDETTO, 'GET', `/allegati?entita=scadenza&id=${S}`)).d;
    verifica('il documento è tornato sulla scadenza', docs?.voci?.some(v => v.uuid === A && v.di?.entita === 'scadenza'), docs);
    await pausa(1500);
    const av2 = await avvisoDi(UFFICIO, S);
    verifica('avviso all ufficio risolto', av2.length > 0 && av2.every(v => v.tipo !== 'segnalazione' || v.consegna === 'risolto'), av2);

    // due segnalazioni nello stesso istante: ne passa una
    const [x, y] = await Promise.all([
      c(ADDETTO, 'POST', `/scadenze/${S}/segnalazioni`, { eseguitaIl: oggi, allegati: [A] }),
      c(ADDETTO, 'POST', `/scadenze/${S}/segnalazioni`, { eseguitaIl: oggi }),
    ]);
    verifica('due insieme: una 201 e una 409', [x.s, y.s].sort().join() === '201,409', [x.s, y.s, x.j?.message, y.j?.message]);
    const R2 = (x.s === 201 ? x : y).d?.uuid;

    const vuoto = await c(UFFICIO, 'POST', `/segnalazioni/${R2}/rifiuto`, { motivo: '  ' });
    verifica('rifiuto senza motivo: 400', vuoto.s === 400, vuoto.s);
    const rif = await c(UFFICIO, 'POST', `/segnalazioni/${R2}/rifiuto`, { motivo: 'Manca il timbro' });
    verifica('rifiuto: respinta col motivo', rif.s === 200 && rif.d?.stato === 'respinta' && rif.d?.motivoRifiuto === 'Manca il timbro', rif);
    const rif2 = await c(UFFICIO, 'POST', `/segnalazioni/${R2}/rifiuto`, { motivo: 'ancora' });
    verifica('rifiuto di nuovo: 409', rif2.s === 409, rif2.s);
    const ritRespinta = await c(ADDETTO, 'DELETE', `/segnalazioni/${R2}`);
    verifica('ritiro di una respinta: 409', ritRespinta.s === 409, ritRespinta);
    const dopoRif = (await c(UFFICIO, 'GET', `/scadenze/${S}`)).d;
    verifica('dopo il rifiuto: aperta, non segnalata, respinta nello storico', !dopoRif?.chiusa && !dopoRif?.segnalata && dopoRif?.registrazioni.some(r => r.stato === 'respinta' && r.motivoRifiuto === 'Manca il timbro'), dopoRif);
    await pausa(1500);
    const av3 = await avvisoDi(ADDETTO, S);
    verifica('addetto: avviso "respinta: Manca il timbro", tono attenzione', av3.some(v => v.tipo === 'esito' && v.stato === 'segnalazione respinta: Manca il timbro' && v.tono === 'attenzione'), av3);

    const seg3 = await c(ADDETTO, 'POST', `/scadenze/${S}/segnalazioni`, { eseguitaIl: oggi, note: 'Rifatto col timbro' });
    verifica('nuova segnalazione dopo il rifiuto: 201', seg3.s === 201, seg3);
    const R3 = seg3.d?.uuid;
    const conf = await c(UFFICIO, 'POST', `/segnalazioni/${R3}/conferma`, { riferimento: 'FT 7', note: 'Confermata con correzione' });
    verifica('conferma: scadenza chiusa (completata), registrazione confermata e corretta', conf.s === 200 && conf.d?.scadenza?.chiusa?.motivo === 'completata' && conf.d?.registrazione?.stato === 'confermata' && conf.d.registrazione.riferimento === 'FT 7' && conf.d.registrazione.note === 'Confermata con correzione', conf);
    const conf2 = await c(UFFICIO, 'POST', `/segnalazioni/${R3}/conferma`, {});
    verifica('conferma di nuovo: 409', conf2.s === 409, conf2.s);
    await pausa(1500);
    const av4 = await avvisoDi(ADDETTO, S);
    verifica('addetto: avviso "confermata", ancora da leggere a scadenza chiusa', av4.some(v => v.tipo === 'esito' && v.stato.startsWith('segnalazione confermata') && v.consegna === 'inviato'), av4);
    const av5 = await avvisoDi(UFFICIO, S);
    verifica('ufficio: nessun avviso di segnalazione ancora aperto', av5.every(v => v.tipo !== 'segnalazione' || v.consegna === 'risolto'), av5);

    const del = await c(UFFICIO, 'DELETE', `/allegati/${A}`);
    verifica('pulizia: documento eliminato', del.s === 204, del.s);
  } finally {
    console.log(`DA PULIRE ${S}`);
  }
}

(async () => {
  for (const gw of ['api-gateway-1', 'api-gateway-2']) await giro(gw);
  console.log(`\nTOTALE: ${ok} ok, ${ko} ko`);
})().catch(e => console.log('ERRORE', e));
