// Fase 3, passo 3b: prepara un tenant VERO di prova ("Prova dati EDG") con dati di Vigilo, per provare
// a video l'eliminazione da SISTEMA > Tenant > Moduli. Nel container auth-service.
// Rilanciabile: se il tenant c'è già lo riusa e rimette i dati. Da eliminare alla fine (DELETE /auth/tenants/:id, root).
const jwt = require('/app/node_modules/jsonwebtoken');
const E = process.env;
const firma = o => jwt.sign(o, E.JWT_SECRET, { expiresIn: '5m', issuer: 'edg-auth-service' });
const ROOT = firma({ accountType: 'operatore', modules: ['*'], tenantId: 1, systemTenant: true, accountId: 1, email: 'root.prova@expressdeliverygroup.com', roleId: 1, permissions: ['*'] });
const gw = 'http://api-gateway-1:8080';
const chiama = async (metodo, p, t, corpo) => { const r = await fetch(gw + p, { method: metodo, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', 'User-Agent': 'prova-3b' }, body: corpo ? JSON.stringify(corpo) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; };
(async () => {
  const elenco = await chiama('GET', '/auth/tenants?active=all&limit=100', ROOT);
  let t = (elenco.j.data || []).find(x => x.slug === 'prova-dati-edg');
  if (!t) t = (await chiama('POST', '/auth/tenants', ROOT, { name: 'Prova dati EDG', slug: 'prova-dati-edg' })).j.data;
  console.log('tenant', t.id, t.name);
  const A = firma({ accountType: 'cliente', modules: ['vigilo'], tenantId: t.id, systemTenant: false, accountId: 900311, email: 'prova.3b@esempio.it', roleId: 2, permissions: ['vigilo.*'] });
  const st = await chiama('GET', '/api/vigilo/avvio', A);
  const giaAvviato = st.j?.data?.avviatoIl || st.j?.data?.avviato;
  if (!giaAvviato) {
    const p = (await chiama('GET', '/api/vigilo/avvio/proposta?modelli=base,trasporto', A)).j.data;
    const cat = p.tipi.flatMap(x => x.categorie).filter(c => c.preselezionata).map(c => c.chiave);
    const con = p.tipi.flatMap(x => x.controlli).filter(c => c.preselezionato ?? c.preselezionata).map(c => c.chiave);
    console.log('avvio', (await chiama('POST', '/api/vigilo/avvio', A, { modelli: ['base', 'trasporto'], categorie: cat, controlli: con })).s);
  }
  const cv = (await chiama('GET', '/api/vigilo/categorie?righe=128&pagina=1', A)).j.data.find(c => c.tipoSoggetto === 'veicolo');
  const s = await chiama('POST', '/api/vigilo/soggetti', A, { tipo: 'veicolo', nome: 'Furgone prova 3b', categoria: cv.uuid, identificativo: 'ZZ003ZZ' });
  console.log('soggetti', s.s, (await chiama('POST', '/api/vigilo/soggetti', A, { tipo: 'veicolo', nome: 'Bilico prova 3b', categoria: cv.uuid })).s);
  const fd = new FormData();
  fd.append('entita', 'soggetto');
  fd.append('id', s.j.data.uuid);
  fd.append('file', new Blob([Buffer.from('%PDF-1.4\n% prova 3b\n%%EOF\n')], { type: 'application/pdf' }), 'prova-3b.pdf');
  console.log('documento', (await fetch(gw + '/api/vigilo/allegati', { method: 'POST', headers: { Authorization: `Bearer ${A}` }, body: fd })).status);
  const r = (await chiama('GET', `/api/vigilo/piattaforma/tenant/${t.id}/dati`, ROOT)).j.data;
  console.log('riepilogo', JSON.stringify({ avviato: r.avviato, documenti: r.documenti, dati: r.dati.filter(x => x.righe).map(x => `${x.tabella} ${x.righe}`), conf: r.configurazione.filter(x => x.righe).length }));
})().catch(e => console.log('ERRORE', e.message));
