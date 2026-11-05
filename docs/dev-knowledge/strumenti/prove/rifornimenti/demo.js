// Rifornimenti storici sul Tenant Demo (tappa 2). MODO=piano stampa soltanto; MODO=scrivi registra.
// Carburante dai km (o ore) degli ultimi 12 mesi con un consumo realistico, più due mesi prima; AdBlue sui camion;
// pedaggi mensili sui camion e qualche volta sui furgoni; "Altro" (lavaggi) sui semirimorchi. Un camion consuma di più.
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = p => jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, ...p }, process.env.JWT_SECRET, { expiresIn: '20m', issuer: 'edg-auth-service' });
const ADMIN = firma({ accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
const ADDETTO = firma({ accountId: 4, email: 'demo.utente@expressdeliverygroup.com', permissions: ['vigilo.own'] });
const GW = 'http://api-gateway-1:8080/api/vigilo';
const MODO = process.env.MODO || 'piano';
const api = async (tok, path, metodo = 'GET', corpo) => {
  const r = await fetch(GW + path, { method: metodo, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${metodo} ${path} ${r.status} ${j.message || ''}`);
  return j;
};
// generatore ripetibile
let seme = 20261105;
const caso = () => ((seme = (seme * 1103515245 + 12345) % 2147483648) / 2147483648);
const varia = (x, p) => x * (1 + (caso() * 2 - 1) * p);
const cent = x => Math.round(x * 100) / 100;
const giorno = d => d.toISOString().slice(0, 10);
const OGGI = new Date('2026-11-05T12:00:00Z');
const meno = giorni => giorno(new Date(OGGI.getTime() - giorni * 86400000));

// profilo per nome: consumo (l/100 km o l/h), pieno, prezzo, adblue, pedaggi
function profilo(s) {
  const n = s.nome.toLowerCase();
  if (/s-way|daf|stralis|actros|scania|volvo fh/.test(n)) return { consumo: /daf/.test(n) ? 39 : 30, pieno: 420, prezzo: 1.72, adblue: true, pedaggi: [180, 320] };
  if (/ducato|daily|furgone|sprinter|transit/.test(n)) return { consumo: 9.5, pieno: 70, prezzo: 1.74, pedaggi: [24, 64], pedaggiOgni: 3 };
  if (/panda|auto/.test(n)) return { consumo: 6.2, pieno: 38, prezzo: 1.86 };
  if (/semirimorchio/.test(n)) return { lavaggi: true };
  if (s.tipo === 'macchina') return { consumo: /muletto|carrello|elevatore/.test(n) ? 3.2 : /trattore/.test(n) ? 8 : 4, pieno: 90, prezzo: 1.72 };
  return null;
}

(async () => {
  const fornitori = (await api(ADMIN, '/fornitori?righe=128')).data;
  const tipi = (await api(ADMIN, '/fornitori/tipi?righe=128')).data;
  console.log('tipi fornitore:', tipi.map(t => t.chiave).join(', '));
  const tipoDistributore = (tipi.find(t => /carbur|distrib|energ/i.test(t.chiave + ' ' + t.nome)) ?? tipi.find(t => /altro/i.test(t.chiave)) ?? tipi[0]).chiave;
  let distributore = fornitori.find(f => f.nome === 'Distributore Nereto');
  const mezzi = [];
  for (const tipo of ['veicolo', 'macchina', 'attrezzatura']) {
    const l = (await api(ADMIN, `/soggetti?tipo=${tipo}&righe=128&stato=attivi`)).data;
    for (const s of l) mezzi.push((await api(ADMIN, `/soggetti/${s.uuid}`)).data);
  }
  const suoi = new Set((await api(ADDETTO, '/soggetti?righe=128')).data.map(s => s.uuid));
  const piano = [];
  for (const m of mezzi) {
    const s = m.soggetto ?? m;
    const p = profilo(s);
    if (!p) continue;
    const costo = (await api(ADMIN, `/resoconti/mezzi?periodo=12m&soggetto=${s.uuid}`)).data.mezzi[0];
    const uso = costo?.uso?.valore ?? null;
    const unita = costo?.uso?.unita ?? (s.contatori?.[0]?.unita || 'km');
    const righe = [];
    if (p.consumo && uso) {
      const litri12 = unita === 'km' ? (uso * p.consumo) / 100 : uso * p.consumo;
      const litriTot = litri12 * (14 / 12); // anche due mesi prima del periodo
      const n = Math.max(2, Math.round(litriTot / (p.pieno * 0.85)));
      let adb = 0;
      for (let i = 0; i < n; i++) {
        const fattoIl = meno(Math.max(0, Math.round(((i + 0.5) / n) * 425 + (caso() * 2 - 1) * 4)));
        const litri = cent(Math.min(p.pieno, varia(litriTot / n, 0.15)));
        const prezzo = Math.round(varia(p.prezzo, 0.035) * 1000) / 1000;
        righe.push({ voce: 'carburante', fattoIl, litri, importo: cent(litri * prezzo), fornitore: caso() < 0.6 ? 'D' : null, riferimento: `SC ${100000 + Math.floor(caso() * 899999)}` });
        adb += litri * 0.05;
        if (p.adblue && i % 4 === 3) {
          const l = cent(adb);
          righe.push({ voce: 'adblue', fattoIl, litri: l, importo: cent(l * varia(0.72, 0.05)), fornitore: 'D' });
          adb = 0;
        }
      }
    }
    if (p.pedaggi) {
      for (let mese = 0; mese < 14; mese += p.pedaggiOgni ?? 1) {
        righe.push({ voce: 'pedaggi', fattoIl: meno(mese * 30.4 + 3), importo: cent(varia((p.pedaggi[0] + p.pedaggi[1]) / 2, 0.3)), riferimento: 'Estratto conto Telepedaggio', note: null });
      }
    }
    if (p.lavaggi) for (let mese = 1; mese < 14; mese += 4) righe.push({ voce: 'altro', fattoIl: meno(mese * 30.4 + 9), importo: cent(varia(85, 0.2)), note: 'Lavaggio cisterna e telaio' });
    // le ultime due del carburante sui mezzi dell'addetto le scrive lui
    const carb = righe.filter(r => r.voce === 'carburante').sort((a, b) => b.fattoIl.localeCompare(a.fattoIl));
    if (suoi.has(s.uuid)) carb.slice(0, 2).forEach(r => (r.addetto = true));
    piano.push({ s, uso, unita, righe });
  }
  for (const x of piano) {
    const spesa = cent(x.righe.reduce((t, r) => t + r.importo, 0));
    const litri = cent(x.righe.filter(r => r.voce === 'carburante').reduce((t, r) => t + r.litri, 0));
    console.log(`${x.s.nome} (${x.s.tipo}) uso ${x.uso ?? '-'} ${x.unita}: ${x.righe.length} righe, ${spesa} €, ${litri} l carburante${x.righe.some(r => r.addetto) ? ', 2 dell’addetto' : ''}`);
  }
  if (MODO !== 'scrivi') return;
  if (!distributore) distributore = (await api(ADMIN, '/fornitori', 'POST', { nome: 'Distributore Nereto', tipo: tipoDistributore, note: 'Stazione di servizio (dati di prova)' })).data;
  let fatti = 0;
  for (const x of piano)
    for (const r of x.righe) {
      const { addetto, fornitore, ...dati } = r;
      const corpo = { ...dati, soggetto: x.s.uuid, ...(addetto ? {} : { fornitore: fornitore === 'D' ? distributore.uuid : null }) };
      await api(addetto ? ADDETTO : ADMIN, '/rifornimenti', 'POST', corpo);
      fatti++;
    }
  console.log('registrati', fatti);
})().catch(e => console.log('ERRORE', e.message));
