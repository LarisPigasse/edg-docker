// Prove dal vivo del CSV delle spese, sui due gateway
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = p => jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, ...p }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const ADMIN = firma({ accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const GUEST = firma({ accountId: 10, email: 'demo.operatore@expressdeliverygroup.com', permissions: ['vigilo.read'] });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' → ' + JSON.stringify(x).slice(0, 300) : ''}`); };
const get = async (gw, t, p) => fetch(`http://${gw}:8080/api/vigilo${p}`, { headers: { Authorization: `Bearer ${t}` } });
const num = s => (s ? Number(s.replace(',', '.')) : 0);
(async () => {
  try {
    for (const gw of ['api-gateway-1', 'api-gateway-2']) {
      const r = await get(gw, ADMIN, '/resoconti/spese/righe.csv');
      const testo = await r.text();
      v(`${gw}: 200, text/csv, nome del file`, r.status === 200 && /text\/csv/.test(r.headers.get('content-type')) && /spese-vigilo-2026-01-01-2026-11-04\.csv/.test(r.headers.get('content-disposition') ?? ''), [r.status, r.headers.get('content-type'), r.headers.get('content-disposition')]);
      v(`${gw}: BOM e intestazioni`, testo.startsWith('﻿Data;Soggetto;Targa o codice;Tipo;Sede;Scadenza;Natura;Eseguita;Fornitore;Tipo di fornitore;Riferimento;Importo (€);Ore di manodopera;Costo della manodopera (€);Totale (€)\r\n'), testo.slice(0, 200));
      const righe = testo.slice(1).split('\r\n').slice(1, -1).map(l => l.split(';'));
      const json = (await (await get(gw, ADMIN, '/resoconti/spese')).json()).data;
      v(`${gw}: tante righe quante registrazioni (${righe.length})`, righe.length === json.totale.registrazioni, [righe.length, json.totale.registrazioni]);
      const somma = righe.reduce((t, c) => t + num(c[14]), 0);
      v(`${gw}: la somma della colonna Totale è il totale speso`, Math.abs(somma - json.totale.spesa) < 0.01, [somma, json.totale.spesa]);
      v(`${gw}: 15 colonne su ogni riga, date gg/mm/aaaa, in ordine di data`, righe.every(c => c.length === 15 && /^\d\d\/\d\d\/\d{4}$/.test(c[0])) && righe.every((c, i, l) => !i || l[i - 1][0].split('/').reverse().join('') <= c[0].split('/').reverse().join('')), righe.find(c => c.length !== 15));
      const veicoli = (await (await get(gw, ADMIN, '/resoconti/spese/righe.csv?tipo=veicolo')).text()).slice(1).split('\r\n').slice(1, -1).map(l => l.split(';'));
      v(`${gw}: filtro tipo=veicolo (${veicoli.length} righe, tutte Veicolo)`, veicoli.length > 0 && veicoli.length < righe.length && veicoli.every(c => c[3] === 'Veicolo'));
      const prec = await get(gw, ADMIN, '/resoconti/spese/righe.csv?periodo=prec');
      v(`${gw}: anno precedente → altro nome del file`, prec.status === 200 && /2025-01-01-2025-12-31/.test(prec.headers.get('content-disposition') ?? ''));
      const g = await get(gw, GUEST, '/resoconti/spese/righe.csv');
      v(`${gw}: senza vigilo.costi → 403`, g.status === 403, g.status);
      const pers = await get(gw, ADMIN, '/resoconti/spese/righe.csv?periodo=personalizzato');
      v(`${gw}: personalizzato senza date → 400 in italiano`, pers.status === 400 && /date/.test(JSON.stringify(await pers.json())));
    }
  } catch (e) { ko++; console.log('ERRORE', e.message); }
  console.log(`TOTALE: ${ok} ok, ${ko} ko`);
})();
