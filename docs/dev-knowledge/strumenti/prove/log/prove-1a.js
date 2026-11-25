// Fase 1 log, passo 1a: SISTEMA > Logs all'admin EDG (sistema.logs). Solo lettura.
// Nel container auth-service. I permessi dei token sono quelli veri dei ruoli (role_permissions).
const jwt = require('/app/node_modules/jsonwebtoken');
const mysql = require('/app/node_modules/mysql2/promise');
const E = process.env;
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 240) : ''}`); };
const GW = ['api-gateway-1', 'api-gateway-2'];
const g = async (gw, p, t) => { const r = await fetch(`http://${gw}:8080${p}`, { headers: { Authorization: `Bearer ${t}` } }); return { s: r.status, j: await r.json().catch(() => null) }; };
(async () => {
  const db = await mysql.createConnection({ host: E.DB_HOST, port: Number(E.DB_PORT || 3306), user: E.DB_USER, password: E.DB_PASSWORD, database: E.DB_NAME });
  const permessi = async ruolo => (await db.query('SELECT rp.permission p FROM role_permissions rp JOIN roles r ON r.id = rp.roleId WHERE r.name = ?', [ruolo]))[0].map(x => x.p);
  const ruoloId = async ruolo => (await db.query('SELECT id FROM roles WHERE name = ?', [ruolo]))[0][0].id;
  const pa = await permessi('admin'), po = await permessi('operatore');
  v('il ruolo admin ha sistema.logs', pa.includes('sistema.logs'), pa);
  v("l'operatore non ha sistema.logs", !po.includes('sistema.logs'));
  const f = o => jwt.sign({ accountType: 'operatore', modules: ['*'], ...o }, E.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
  const ADMIN_EDG = f({ accountId: 3, email: 'system@expressdeliverygroup.com', tenantId: 1, systemTenant: true, roleId: await ruoloId('admin'), permissions: pa });
  const OPER_EDG = f({ accountId: 2, email: 'operatore@expressdeliverygroup.com', tenantId: 1, systemTenant: true, roleId: await ruoloId('operatore'), permissions: po });
  const ADMIN_CLI = f({ accountType: 'cliente', accountId: 9, email: 'demo.admin@expressdeliverygroup.com', tenantId: 2, systemTenant: false, modules: ['vigilo'], roleId: await ruoloId('admin'), permissions: pa });
  for (const gw of GW) {
    const a = await g(gw, '/api/log/azioni?limit=4', ADMIN_EDG);
    v(`${gw}: admin EDG legge i log`, a.s === 200 && Array.isArray(a.j?.logs) && a.j.totalCount > 0, a);
    const id = a.j?.logs?.[0]?._id;
    v(`${gw}: admin EDG apre il dettaglio`, id && (await g(gw, `/api/log/azioni/${id}`, ADMIN_EDG)).s === 200);
    v(`${gw}: admin EDG legge le statistiche`, (await g(gw, '/api/log/statistiche', ADMIN_EDG)).s === 200);
    v(`${gw}: admin EDG legge gli utenti dei log`, (await g(gw, '/api/log/utenti', ADMIN_EDG)).s === 200);
    const t = await g(gw, '/api/log/azioni?limit=4&tenantId=2', ADMIN_EDG);
    v(`${gw}: admin EDG filtra per tenant`, t.s === 200 && t.j.logs.every(l => l.origine?.dettagli?.tenantId === 2), t.j?.logs?.map(l => l.origine?.dettagli?.tenantId));
    v(`${gw}: elenchi della pagina (tenant, account) per l'admin EDG`, (await g(gw, '/auth/tenants?active=all&limit=100', ADMIN_EDG)).s === 200 && (await g(gw, '/auth/accounts?limit=100', ADMIN_EDG)).s === 200);
    v(`${gw}: operatore EDG -> 403`, (await g(gw, '/api/log/azioni?limit=1', OPER_EDG)).s === 403);
    v(`${gw}: admin del cliente (non nel tenant di sistema) -> 403`, (await g(gw, '/api/log/azioni?limit=1', ADMIN_CLI)).s === 403);
  }
db.end();  console.log(`\n${ok}/${ok + ko} OK`);
})().catch(e => console.log('ERRORE', e.message));
