// Pulizia delle prove: toglie i controlli indicati (uuid separati da virgola) e le loro scadenze appena nate.
// Solo controlli creati dalle prove: niente se uno ha scadenze con registrazioni.
const { Client } = require('/app/node_modules/pg');
const uuids = (process.argv[2] || '').split(',').filter(Boolean);
(async () => {
  const c = new Client({ host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  await c.connect();
  for (const u of uuids) {
    const r = await c.query('SELECT id_controllo, nome, chiave_libreria FROM controlli WHERE uuid_controllo = $1 AND id_tenant = 2', [u]);
    if (!r.rows.length) { console.log('non trovato', u); continue; }
    const { id_controllo: id, nome, chiave_libreria } = r.rows[0];
    if (chiave_libreria) { console.log('della libreria, non lo tocco:', nome); continue; }
    const reg = await c.query('SELECT count(*)::int AS n FROM registrazioni r JOIN scadenze s ON s.id_scadenza = r.id_scadenza WHERE s.id_controllo = $1', [id]);
    if (reg.rows[0].n) { console.log('ha registrazioni, non lo tocco:', nome); continue; }
    await c.query('BEGIN');
    const s = await c.query('DELETE FROM scadenze WHERE id_controllo = $1', [id]);
    await c.query('DELETE FROM controlli WHERE id_controllo = $1', [id]);
    await c.query('COMMIT');
    console.log(`tolto "${nome}" con ${s.rowCount} scadenze`);
  }
  await c.end();
})().catch(e => console.log('ERRORE', e.message));
