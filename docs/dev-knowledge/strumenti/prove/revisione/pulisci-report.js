const { Client } = require('/app/node_modules/pg');
const E = process.env;
(async () => {
  const c = new Client({ host: E.DB_HOST, port: E.DB_PORT, user: E.DB_USER, password: E.DB_PASSWORD, database: E.DB_NAME });
  await c.connect();
  const r = await c.query(`DELETE FROM controlli_non_seguiti WHERE motivo LIKE 'prova del report:%' AND ripresa_il IS NOT NULL RETURNING motivo`);
  console.log('tolte:', r.rowCount, JSON.stringify(r.rows.map(x => x.motivo)));
  console.log('restano:', JSON.stringify((await c.query('SELECT motivo, ripresa_il IS NOT NULL AS ripresa FROM controlli_non_seguiti')).rows));
  await c.end();
})().catch(e => console.log('ERRORE', e.message));
