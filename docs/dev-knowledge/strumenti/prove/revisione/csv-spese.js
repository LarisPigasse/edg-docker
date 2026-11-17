const jwt = require('/app/node_modules/jsonwebtoken');
const T = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
(async () => {
  for (const gw of ['api-gateway-1', 'api-gateway-2']) {
    const r = await fetch(`http://${gw}:8080/api/vigilo/resoconti/spese/righe.csv?periodo=12m`, { headers: { Authorization: `Bearer ${T}` } });
    const t = await r.text();
    const righe = t.split('\r\n').filter(Boolean);
    console.log(gw, r.status, r.headers.get('content-disposition'), 'righe', righe.length - 1, '|', righe[0].slice(0, 160));
  }
})().catch(e => console.log('ERRORE', e.message));
