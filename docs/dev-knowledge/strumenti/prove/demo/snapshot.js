// Snapshot delle righe del Tenant Demo (tenant 2) nelle tabelle del cliente: per ripristinarlo dopo il demo
const { Client } = require('/app/node_modules/pg');
const TABELLE = ['impostazioni', 'preferenze_avvisi', 'recapiti_email', 'fornitori', 'soggetti', 'contatori', 'letture', 'assegnazioni', 'scadenze', 'registrazioni', 'allegati', 'avvisi', 'consegne'];
(async () => {
  const E = process.env;
  const db = new Client({ host: E.DB_HOST, port: E.DB_PORT, user: E.DB_USER, password: E.DB_PASSWORD, database: E.DB_NAME });
  await db.connect();
  const out = {};
  for (const t of TABELLE) {
    const ha = (await db.query("SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'id_tenant'", [t])).rowCount;
    out[t] = ha ? (await db.query(`SELECT * FROM ${t} WHERE id_tenant = 2`)).rows : `senza id_tenant`;
  }
  console.log(JSON.stringify({ quando: new Date().toISOString(), righe: out }));
  await db.end();
})().catch(e => console.log('ERRORE', e.message));
