const jwt = require('/app/node_modules/jsonwebtoken');
const ROOT = jwt.sign({ accountType: 'operatore', roleId: 1, modules: ['*'], accountId: 1, tenantId: 1, email: 'root@expressdeliverygroup.com', permissions: ['*'], systemTenant: true }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const chi = Number(process.argv[2] || 4);
fetch('http://api-gateway-1:8080/auth/assistenza', { method: 'POST', headers: { Authorization: `Bearer ${ROOT}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId: 2, modo: 'assistenza', motivo: 'Prova a video AA5', perConto: chi }) })
  .then(r => r.json()).then(j => console.log('CODICE=' + j.data?.codice, j.data ? '' : JSON.stringify(j)));
