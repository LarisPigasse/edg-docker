// Dati di prova del costo dei mezzi sul Tenant Demo: costo di possesso (il Furgone Ufficio resta senza, per vedere "parziale")
const jwt = require('/app/node_modules/jsonwebtoken');
const ADMIN = jwt.sign({ accountType: 'cliente', roleId: 2, modules: ['vigilo'], tenantId: 2, systemTenant: false, accountId: 9, email: 'demo.admin@expressdeliverygroup.com', permissions: ['vigilo.*'] }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const POSSESSI = {
  '64d3f44d-81fb-48ca-bf6b-99074fe0b6ea': { modo: 'acquisto', prezzo: 128000, anni: 8, valoreFinale: 32000, dal: '2023-03-01' }, // Iveco S-Way 01
  '94137a14-8773-47e0-ac1f-d34de99b368e': { modo: 'leasing', canone: 1890, dal: '2024-06-01' }, // Iveco S-Way 02
  'dfe34431-f501-41bb-a08e-cfd57918eede': { modo: 'acquisto', prezzo: 112000, anni: 8, valoreFinale: 24000, dal: '2022-09-01' }, // DAF XF 01
  'ce813bdd-fd69-416a-8683-d85663dd8d91': { modo: 'noleggio', canone: 420 }, // Fiat Panda aziendale
  '01c2d7bd-1516-45f3-adff-319222efd630': { modo: 'leasing', canone: 512 }, // Furgone Demo
  '49258db3-2d2a-4973-b80e-943b2cc93f59': { modo: 'acquisto', prezzo: 36000, anni: 6, valoreFinale: 8000 }, // Fiat Ducato 02
  'aee73206-d383-4c19-98b5-50611ced85a8': { modo: 'acquisto', prezzo: 42000, anni: 10, valoreFinale: 6000 }, // Semirimorchio Schmitz 01
  '5f8e1cfe-235a-46c5-8e08-5f285c39bdf3': { modo: 'acquisto', prezzo: 38000, anni: 10, valoreFinale: 6000 }, // Semirimorchio Krone 02
  '59941aa4-297e-4e58-a380-b554952cf199': { modo: 'acquisto', prezzo: 8200, anni: 8 }, // Sponda idraulica
};
(async () => {
  for (const [uuid, possesso] of Object.entries(POSSESSI)) {
    const r = await fetch(`http://api-gateway-1:8080/api/vigilo/soggetti/${uuid}`, { method: 'PATCH', headers: { Authorization: `Bearer ${ADMIN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ possesso }) });
    const j = await r.json();
    console.log(r.status, j.data?.soggetto?.nome ?? j.data?.nome ?? j.message, JSON.stringify(j.data?.soggetto?.possesso ?? j.data?.possesso ?? null));
  }
})();
