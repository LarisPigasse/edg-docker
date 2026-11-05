// Guasti storici del demo: creati senza data entro cui ripararli, poi registrati alla data in cui sono stati riparati
const fs = require('fs');
const E = process.env;
const ADMIN = JSON.stringify({ accountType: 'cliente', tenantId: 2, roleId: 1, modules: ['*'], accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] });
async function api(m, p, b) {
  const r = await fetch(`http://localhost:${E.PORT || 3006}/api/vigilo${p}`, { method: m, headers: { 'x-gateway-secret': E.GATEWAY_SECRET, 'x-user-data': ADMIN, 'Content-Type': 'application/json' }, ...(b ? { body: JSON.stringify(b) } : {}) });
  let j = null; try { j = await r.json(); } catch {}
  if (!r.ok) throw new Error(`${m} ${p} → ${r.status} ${j?.message ?? ''}`);
  return j?.data;
}
const giorni = (g, n) => new Date(new Date(`${g}T00:00:00Z`).getTime() + n * 864e5).toISOString().slice(0, 10);
const { fornitori: F, soggetti: SOG } = JSON.parse(fs.readFileSync('/app/uploads/.demo-creati.json', 'utf8'));
let n = 2048;
const GUASTI = [
  ['sway1', 'Sostituzione frizione', 'Slitta in salita a pieno carico', '2025-03-18', 'dimarco', 2850, null],
  ['daf', 'Perdita aria impianto frenante', 'Calo di pressione a veicolo fermo', '2025-06-04', 'dimarco', 640, 2],
  ['ducato', 'Specchietto destro rotto', 'Urto in retromarcia nel piazzale', '2025-09-12', 'carrozzeria', 180, null],
  ['schmitz', 'Gruppo frigo in avaria', 'Non mantiene la temperatura sotto i 4 °C', '2025-12-02', 'dimarco', 1450, null],
  ['sway2', 'Foratura pneumatico asse posteriore', 'Pneumatico sostituito sul posto', '2026-02-20', 'gomme', 420, null],
  ['panda', 'Spia motore accesa', 'Sensore di pressione sostituito internamente', '2026-05-14', null, 64, 1.5],
  ['sway1', 'Paraurti danneggiato in manovra', 'Urto contro la colonnina in banchina', '2026-08-27', 'carrozzeria', 960, null],
];
(async () => {
  let ok = 0;
  for (const [k, titolo, descrizione, g, forn, imp, ore] of GUASTI) {
    try {
      const sc = await api('POST', `/soggetti/${SOG[k].uuid}/guasti`, { titolo, descrizione, bloccaUso: false });
      const b = { eseguitaIl: giorni(g, 2), esito: 'positivo', importo: imp, note: null };
      if (forn) { b.fornitore = F[forn]; b.riferimento = `FT ${g.slice(0, 4)}/${n++}`; b.esecuzione = ore ? 'entrambe' : 'esterna'; } else b.esecuzione = 'interna';
      if (ore) b.manodopera = [{ persona: SOG.stefano.uuid, ore }];
      await api('POST', `/scadenze/${sc.uuid}/registrazioni`, b);
      ok++;
    } catch (e) { console.log('ERRORE', titolo, e.message); }
  }
  console.log(`guasti storici registrati: ${ok} su ${GUASTI.length}`);
})();
