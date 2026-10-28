// =============================================================================
// Scadenze e registrazioni — /api/vigilo/... (lettura: read; modifiche: write)
// L'addetto (own) legge elenco, dettaglio e storico dentro il suo ambito (B9b)
// e segnala "fatto"; l'ufficio conferma o respinge (B9c, segnalazione.routes)
// =============================================================================
import { Router, Request, Response } from 'express';
import { contestoDi, type Contesto } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateBody, validateParams, validateQuery } from '../../core/middleware/validate';
import { paginaDa, rispondiLista } from '../../core/utils/lista';
import { createdResponse, noContentResponse, successResponse } from '../../core/utils/response';
import * as registrazioni from '../registrazioni/registrazione.service';
import { paramUuid } from '../schemi';
import { presentaEsecuzione, presentaImpostazioni, presentaRegistrazione, presentaScadenza } from './scadenza.presenta';
import * as schemi from './scadenza.schemas';
import * as servizio from './scadenza.service';

type Dettaglio = Awaited<ReturnType<typeof servizio.leggiScadenza>>;

export const presentaDettaglio = (d: Dettaglio, ctx: Contesto) => ({
  ...presentaScadenza(d.s, d.sit, ctx, !!d.segnalazione),
  impostazioni: presentaImpostazioni(d.eff, d.s),
  registrazioni: d.registrazioni.map(r => presentaRegistrazione(r, ctx)),
  prossimaSeRegistrataOggi: d.prossima && !d.prossima.finita ? { scadeIl: d.prossima.scadeIl, sogliaUso: d.prossima.sogliaUso } : null,
  // per le azioni del pannello: che cosa chiede la registrazione e se si può rinviare
  richieste: registrazioni.richiesteDi(d.s, d.eff),
  rinviabile: d.s.controllo?.rinviabile ?? true,
  // la segnalazione dell'addetto da confermare: chi l'ha mandata e quanti documenti ha (B9c)
  segnalazione: d.segnalazione ? { ...presentaRegistrazione(d.segnalazione.r, ctx), da: d.segnalazione.da, documenti: d.segnalazione.documenti } : null,
});

export const scadenzeRoutes = Router();

scadenzeRoutes.get('/scadenze', richiedi('read', 'own'), validateQuery(schemi.listaScadenze), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const p = paginaDa(req.query);
  const { righe, totale } = await servizio.elencaScadenze(ctx, req.query, p);
  rispondiLista(res, righe.map(({ s, sit, segnalata }) => presentaScadenza(s, sit, ctx, segnalata)), totale, p);
});

scadenzeRoutes.get('/scadenze/:id', richiedi('read', 'own'), validateParams(paramUuid), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  successResponse(res, presentaDettaglio(await servizio.leggiScadenza(ctx, req.params.id), ctx));
});

scadenzeRoutes.post('/scadenze', richiedi('write'), validateBody(schemi.creaScadenza), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  createdResponse(res, presentaDettaglio(await servizio.creaScadenza(ctx, req.body), ctx), 'Scadenza creata');
});

scadenzeRoutes.patch('/scadenze/:id', richiedi('write'), validateParams(paramUuid), validateBody(schemi.modificaScadenza), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  successResponse(res, presentaDettaglio(await servizio.modificaScadenza(ctx, req.params.id, req.body), ctx), 'Scadenza modificata');
});

scadenzeRoutes.delete('/scadenze/:id', richiedi('write'), validateParams(paramUuid), async (req: Request, res: Response) => {
  await servizio.eliminaScadenza(contestoDi(req), req.params.id);
  noContentResponse(res);
});

scadenzeRoutes.post('/scadenze/:id/registrazioni', richiedi('write'), validateParams(paramUuid), validateBody(schemi.esecuzione), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  createdResponse(
    res,
    presentaEsecuzione(ctx, await registrazioni.registraEsecuzione(ctx, req.params.id, req.body)),
    req.body.esito === 'negativo' ? 'Esito negativo registrato: la scadenza resta aperta' : 'Registrato'
  );
});

scadenzeRoutes.get('/registrazioni', richiedi('read', 'own'), validateQuery(schemi.listaRegistrazioni), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const p = paginaDa(req.query);
  const { righe, totale } = await registrazioni.elencaRegistrazioni(ctx, req.query, p);
  rispondiLista(
    res,
    righe.map(r => ({
      ...presentaRegistrazione(r, ctx),
      scadenza: r.scadenza ? { uuid: r.scadenza.uuidScadenza, titolo: r.scadenza.titolo || r.scadenza.controllo?.nome || '' } : null,
    })),
    totale,
    p
  );
});

scadenzeRoutes.post('/scadenze/:id/rinvio', richiedi('write'), validateParams(paramUuid), validateBody(schemi.rinvio), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const { registrazione } = await registrazioni.registraRinvio(ctx, req.params.id, req.body);
  const scadenza = presentaDettaglio(await servizio.leggiScadenza(ctx, req.params.id), ctx);
  createdResponse(res, { registrazione: presentaRegistrazione(registrazione, ctx), scadenza }, 'Scadenza rinviata');
});
