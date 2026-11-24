// Pulizia delle prove: toglie i contatori di un'unità (es. ore) dai soggetti indicati, solo se senza letture.
const { Client } = require('/app/node_modules/pg');
const [unita, lista] = [process.argv[2], (process.argv[3] || '').split(',').filter(Boolean)];
(async () => {
  const c = new Client({ host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  await c.connect();
  const r = await c.query(
    `DELETE FROM contatori k USING soggetti s
       WHERE k.id_soggetto = s.id_soggetto AND s.id_tenant = 2 AND s.uuid_soggetto = ANY($1::uuid[]) AND k.unita = $2
         AND NOT EXISTS (SELECT 1 FROM letture l WHERE l.id_contatore = k.id_contatore)
       RETURNING s.nome`, [lista, unita]);
  console.log(`tolti ${r.rowCount} contatori ${unita}:`, r.rows.map(x => x.nome).join(', '));
  await c.end();
})().catch(e => console.log('ERRORE', e.message));
