// Prova a video di B10b: rimette tutto com'era (da /tmp/b10b-originali.json)
const { Client } = require('/app/node_modules/pg');
const fs = require('fs');
const E = process.env;
(async () => {
  const o = JSON.parse(fs.readFileSync('/tmp/b10b-originali.json', 'utf8'));
  const db = new Client({ host: E.DB_HOST, port: E.DB_PORT, user: E.DB_USER, password: E.DB_PASSWORD, database: E.DB_NAME });
  await db.connect();
  const q = async (s, a) => (await db.query(s, a)).rows;
  const rip = (t, idc, r, cols) => q(`UPDATE ${t} SET ${cols.map((c, i) => `${c} = $${i + 2}`).join(', ')} WHERE ${idc} = $1`, [r[idc], ...cols.map(c => r[c])]);
  for (const r of [o.A, o.B, o.D]) await rip('controlli', 'id_controllo', r, ['nome', 'preavvisi', 'tolleranza', 'versione_libreria', 'versione_ignorata', 'origine', 'attivo', 'aggiornamento_visto_il', 'aggiornamento_visto_da']);
  await rip('categorie', 'id_categoria', o.C, ['nome', 'icona', 'descrizione', 'versione_libreria', 'versione_ignorata', 'origine', 'attiva', 'aggiornamento_visto_il', 'aggiornamento_visto_da']);
  await q('DELETE FROM controlli_categorie WHERE id_controllo = $1', [o.A.id_controllo]);
  for (const k of o.catA) await q('INSERT INTO controlli_categorie (id_controllo, id_categoria, id_tenant) VALUES ($1, $2, 2)', [o.A.id_controllo, k]);
  await q('UPDATE libreria_controlli SET ritirato = false, novita = $2 WHERE chiave = $1', [o.D.chiave_libreria, o.novD]);
  await q('UPDATE libreria_controlli SET novita = $2 WHERE chiave = $1', [o.A.chiave_libreria, o.novA]);
  const con = await db.query("DELETE FROM consegne WHERE id_consegna > $1 AND id_avviso IN (SELECT id_avviso FROM avvisi WHERE id_tenant = 2 AND tipo = 'libreria')", [o.maxCon]);
  const avv = await db.query("DELETE FROM avvisi WHERE id_avviso > $1 AND id_tenant = 2 AND tipo = 'libreria'", [o.maxAvv]);
  const dec = await db.query('DELETE FROM decisioni_libreria WHERE id_decisione > $1 AND id_tenant = 2', [o.maxDec]);
  await db.end();
  fs.unlinkSync('/tmp/b10b-originali.json');
  console.log(`ripristinato; tolti ${avv.rowCount} avvisi, ${con.rowCount} consegne, ${dec.rowCount} righe del registro`);
})().catch(e => console.log('ERRORE', e.message));
