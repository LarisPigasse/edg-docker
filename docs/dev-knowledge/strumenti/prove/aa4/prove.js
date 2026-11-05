// Prove dal vivo di AA4a: Assistenza "vedi come" in sola lettura, sui due gateway
const jwt = require('/app/node_modules/jsonwebtoken');
const firma = p => jwt.sign({ accountType: 'operatore', roleId: 1, modules: ['*'], ...p }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'edg-auth-service' });
const ROOT = firma({ accountId: 1, tenantId: 1, email: 'root@expressdeliverygroup.com', permissions: ['*'], systemTenant: true });
let ok = 0, ko = 0;
const v = (n, c, x) => { c ? ok++ : ko++; console.log(`${c ? 'OK ' : 'KO '} ${n}${!c && x !== undefined ? ' → ' + JSON.stringify(x).slice(0, 400) : ''}`); };
const c = async (gw, t, m, p, b) => {
  const r = await fetch(`http://${gw}:8080${p.startsWith('/auth') ? '' : '/api'}${p}`, { method: m, headers: { ...(t ? { Authorization: `Bearer ${t}` } : {}), 'Content-Type': 'application/json' }, ...(b ? { body: JSON.stringify(b) } : {}) });
  let j = null; try { j = await r.json(); } catch {}
  return { s: r.status, j, d: j?.data };
};
const G1 = 'api-gateway-1', G2 = 'api-gateway-2';
const entra = async (gw, corpo) => {
  const a = await c(gw, ROOT, 'POST', '/auth/assistenza', corpo);
  if (a.s !== 201) return { a };
  const s = await c(gw, null, 'POST', '/auth/assistenza/scambio', { codice: a.d.codice });
  return { a, s, token: s.d?.accessToken, id: a.d.sessione.id };
};
(async () => {
  try {
    const acc = await c(G1, ROOT, 'GET', '/auth/assistenza/account?tenantId=2');
    v('account del Tenant Demo: 3, con ruolo', acc.s === 200 && acc.d.length === 3 && acc.d.every(x => x.nome && x.ruolo), acc.j);
    v('account del tenant di sistema → 400', (await c(G2, ROOT, 'GET', '/auth/assistenza/account?tenantId=1')).s === 400);
    v('Assistenza senza account → 400', (await c(G1, ROOT, 'POST', '/auth/assistenza', { tenantId: 2, modo: 'assistenza', motivo: 'Prova AA4' })).s === 400);
    v('Preparazione con account → 400', (await c(G1, ROOT, 'POST', '/auth/assistenza', { tenantId: 2, modo: 'preparazione', motivo: 'Prova AA4', perConto: 4 })).s === 400);
    const altro = await c(G2, ROOT, 'POST', '/auth/assistenza', { tenantId: 2, modo: 'assistenza', motivo: 'Prova AA4', perConto: 1 });
    v('account di un altro tenant → 400 in italiano', altro.s === 400 && /non appartiene/.test(altro.j?.error ?? altro.j?.message), altro.j);

    // 1) come demo.utente (addetto)
    const u = await entra(G1, { tenantId: 2, modo: 'assistenza', motivo: 'Prova AA4: vista dell’addetto', perConto: 4 });
    v('apertura in Assistenza come demo.utente: 201 con perConto', u.a.s === 201 && u.a.d.sessione.perConto?.id === 4 && u.a.d.sessione.modo === 'assistenza', u.a.j);
    const claims = u.token ? jwt.decode(u.token) : {};
    v('token: accountId 4, permessi dell’addetto, perConto e operatore', claims.accountId === 4 && JSON.stringify(claims.permissions) === '["vigilo.own"]' && claims.assistenza?.perConto?.id === 4 && claims.assistenza?.operatore?.id === 1 && claims.systemTenant === false, claims);
    v('account nella risposta: demo.utente, ruolo addetto', u.s.d?.account?.id === 4 && u.s.d.account.roleName === 'addetto', u.s.d?.account);
    for (const gw of [G1, G2]) {
      const me = await c(gw, u.token, 'GET', '/vigilo/me');
      v(`${gw}: /vigilo/me come l’addetto`, me.s === 200 && me.d?.capacita?.own === true && me.d.capacita.read === false, me.j);
      v(`${gw}: le sue scadenze (GET) passano`, (await c(gw, u.token, 'GET', '/vigilo/scadenze?righe=8')).s === 200);
      const w = await c(gw, u.token, 'POST', '/vigilo/avvisi/letti', {});
      v(`${gw}: POST respinto con 403 sola lettura`, w.s === 403 && w.j?.code === 'ASSISTENZA_SOLA_LETTURA' && /solo guardare/.test(w.j?.error), w.j);
      v(`${gw}: PUT respinto`, (await c(gw, u.token, 'PUT', '/vigilo/avvisi/preferenze', {})).j?.code === 'ASSISTENZA_SOLA_LETTURA');
      v(`${gw}: DELETE respinto`, (await c(gw, u.token, 'DELETE', '/vigilo/avvisi/preferenze')).j?.code === 'ASSISTENZA_SOLA_LETTURA');
      v(`${gw}: cambio password respinto`, (await c(gw, u.token, 'POST', '/auth/change-password', { oldPassword: 'x', newPassword: 'y' })).s === 403);
    }
    const el = await c(G2, ROOT, 'GET', '/auth/assistenza?aperte=true');
    v('elenco delle aperte con perConto', el.s === 200 && el.d.some(x => x.id === u.id && x.perConto?.email === 'demo.utente@expressdeliverygroup.com'), el.d);
    const fine = await c(G2, u.token, 'POST', '/auth/assistenza/fine', {});
    v('Esci: 200 (l’uscita passa anche in sola lettura)', fine.s === 200 && fine.d?.stato === 'uscita', fine.j);
    v('dopo l’uscita il token non vale più: 401', (await c(G1, u.token, 'GET', '/vigilo/me')).s === 401);

    // 2) come demo.admin, chiusa da EDG
    const a = await entra(G2, { tenantId: 2, modo: 'assistenza', motivo: 'Prova AA4: vista dell’admin', perConto: 9 });
    v('apertura come demo.admin', a.a.s === 201 && !!a.token, a.a.j);
    v('admin: Spese e consumi (GET) passa', (await c(G1, a.token, 'GET', '/vigilo/resoconti/spese')).s === 200);
    v('admin: nuovo fornitore respinto', (await c(G2, a.token, 'POST', '/vigilo/fornitori', { nome: 'PROVA AA4', tipo: 'altro' })).j?.code === 'ASSISTENZA_SOLA_LETTURA');
    v('chiusura da EDG', (await c(G1, ROOT, 'DELETE', `/auth/assistenza/${a.id}`)).s === 200);
    v('dopo la chiusura da EDG: 401', (await c(G2, a.token, 'GET', '/vigilo/me')).s === 401);

    // 3) la Preparazione scrive ancora
    const p = await entra(G1, { tenantId: 2, modo: 'preparazione', motivo: 'Prova AA4: la Preparazione scrive' });
    v('Preparazione: apertura e token', p.a.s === 201 && !!p.token, p.a.j);
    const pw = await c(G2, p.token, 'POST', '/vigilo/avvisi/letti', {});
    v('Preparazione: le scritture passano il gateway', pw.s !== 403 && pw.j?.code !== 'ASSISTENZA_SOLA_LETTURA', pw.j);
    v('Preparazione: Esci', (await c(G1, p.token, 'POST', '/auth/assistenza/fine', {})).s === 200);
  } catch (e) { console.log('ERRORE', e.stack); ko++; }
  console.log(`TOTALE: ${ok} ok, ${ko} ko`);
})();
