const jwt = require('/app/node_modules/jsonwebtoken');
const T = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
const g = async (p, metodo = 'GET', corpo) => (await fetch(`http://api-gateway-1:8080/api/vigilo${p}`, { method: metodo, headers: { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined })).json();
(async () => {
  const sog = (await g('/soggetti?testo=Iveco%20S-Way%2002&pagina=1&righe=8')).data.find(s => s.nome === 'Iveco S-Way 02');
  const bollo = (await g(`/soggetti/${sog.uuid}/controlli`)).data.controlli.find(x => /bollo/i.test(x.nome));
  console.log('riprendi:', JSON.stringify((await g(`/soggetti/${sog.uuid}/controlli/${bollo.uuid}/riprendi`, 'POST', {})).data));
  const ap = (await g(`/scadenze?soggetto=${sog.uuid}&controllo=${bollo.uuid}&pagina=1&righe=8`)).data;
  console.log('bollo aperto:', ap.length, ap[0] && ap[0].scadeIl);
})().catch(e => console.log('ERRORE', e.message));
