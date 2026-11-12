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
import { nomeAutore, nomiAutori } from '../soggetti/autori';
import { autoreChiusura } from './chiusura';
import { autoriDelle, presentaEsecuzione, presentaImpostazioni, presentaRegistrazione, presentaScadenza } from './scadenza.presenta';
import * as schemi from './scadenza.schemas';
import * as servizio from './scadenza.service';

type Dettaglio = Awaited<ReturnType<typeof servizio.leggiScadenza>>;

/** Il dettaglio di una scadenza, con i nomi di chi ha scritto le registrazioni e di chi l'ha aggiunta */
export async function presentaDettaglio(d: Dettaglio, ctx: Contesto) {
  // guasti e promemoria li aggiunge una persona; le scadenze dei controlli le crea Vigilo
  const manuale = d.s.idControllo == null;
  const chiusura = d.s.chiusaIl ? autoreChiusura(d.s, d.registrazioni.filter(r => r.stato === 'confermata')) : null;
  const nomi = await autoriDelle([...d.registrazioni, ...(d.segnalazione ? [d.segnalazione.r] : [])], manuale ? d.s.creatoDa : null, chiusura?.account);
  return {
    ...presentaScadenza(d.s, d.sit, ctx, !!d.segnalazione, chiusura && { da: nomeAutore(nomi, chiusura.account), automatica: chiusura.automatica }),
    impostazioni: presentaImpostazioni(d.eff, d.s),
    registrazioni: d.registrazioni.map(r => presentaRegistrazione(r, ctx, nomi)),
    /** Guasto o promemoria: chi l'ha aggiunta (segnalata) e quando; null per quelle dei controlli */
    aggiunta: manuale ? { da: nomeAutore(nomi, d.s.creatoDa), il: d.s.createdAt } : null,
    prossimaSeRegistrataOggi: d.prossima && !d.prossima.finita ? { scadeIl: d.prossima.scadeIl, sogliaUso: d.prossima.sogliaUso } : null,
    // per le azioni del pannello: che cosa chiede la registrazione e se si può rinviare
    richieste: registrazioni.richiesteDi(d.s, d.eff),
    rinviabile: d.s.controllo?.rinviabile ?? true,
    // riparando questo guasto il mezzo può tornare in servizio (B10a)
    rimettiInServizio: d.rimettiInServizio,
    // la segnalazione dell'addetto da confermare: chi l'ha mandata e quanti documenti ha (B9c)
    segnalazione: d.segnalazione ? { ...presentaRegistrazione(d.segnalazione.r, ctx, nomi), da: d.segnalazione.da, documenti: d.segnalazione.documenti } : null,
  };
}

export const scadenzeRoutes = Router();

scadenzeRoutes.get('/scadenze', richiedi('read', 'own'), validateQuery(schemi.listaScadenze), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const p = paginaDa(req.query);
  const { righe, totale } = await servizio.elencaScadenze(ctx, req.query, p);
  // le chiuse dicono chi le ha chiuse: i nomi in una sola richiesta
  const nomi = await nomiAutori(righe.map(r => r.chiusura?.account));
  rispondiLista(
    res,
    righe.map(({ s, sit, segnalata, chiusura }) =>
      presentaScadenza(s, sit, ctx, segnalata, chiusura && { da: nomeAutore(nomi, chiusura.account), automatica: chiusura.automatica })
    ),
    totale,
    p
  );
});

scadenzeRoutes.get('/scadenze/:id', richiedi('read', 'own'), validateParams(paramUuid), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  successResponse(res, await presentaDettaglio(await servizio.leggiScadenza(ctx, req.params.id), ctx));
});

scadenzeRoutes.post('/scadenze', richiedi('write'), validateBody(schemi.creaScadenza), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  createdResponse(res, await presentaDettaglio(await servizio.creaScadenza(ctx, req.body), ctx), 'Scadenza creata');
});

scadenzeRoutes.patch('/scadenze/:id', richiedi('write'), validateParams(paramUuid), validateBody(schemi.modificaScadenza), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  successResponse(res, await presentaDettaglio(await servizio.modificaScadenza(ctx, req.params.id, req.body), ctx), 'Scadenza modificata');
});

scadenzeRoutes.delete('/scadenze/:id', richiedi('write'), validateParams(paramUuid), async (req: Request, res: Response) => {
  await servizio.eliminaScadenza(contestoDi(req), req.params.id);
  noContentResponse(res);
});

scadenzeRoutes.post('/scadenze/:id/registrazioni', richiedi('write'), validateParams(paramUuid), validateBody(schemi.esecuzione), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const e = await registrazioni.registraEsecuzione(ctx, req.params.id, req.body);
  createdResponse(
    res,
    presentaEsecuzione(ctx, e, await autoriDelle([e.registrazione])),
    req.body.esito === 'negativo' ? 'Esito negativo registrato: la scadenza resta aperta' : 'Registrato'
  );
});

scadenzeRoutes.get('/registrazioni', richiedi('read', 'own'), validateQuery(schemi.listaRegistrazioni), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const p = paginaDa(req.query);
  const { righe, totale } = await registrazioni.elencaRegistrazioni(ctx, req.query, p);
  const nomi = await autoriDelle(righe);
  rispondiLista(
    res,
    righe.map(r => ({
      ...presentaRegistrazione(r, ctx, nomi),
      scadenza: r.scadenza ? { uuid: r.scadenza.uuidScadenza, titolo: r.scadenza.titolo || r.scadenza.controllo?.nome || '' } : null,
      // nello storico di un fornitore (F1): di quale soggetto
      ...(r.scadenza?.soggetto
        ? { soggetto: { uuid: r.scadenza.soggetto.uuidSoggetto, nome: r.scadenza.soggetto.nome, identificativo: r.scadenza.soggetto.identificativo ?? null } }
        : {}),
    })),
    totale,
    p
  );
});

scadenzeRoutes.post('/scadenze/:id/rinvio', richiedi('write'), validateParams(paramUuid), validateBody(schemi.rinvio), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const { registrazione } = await registrazioni.registraRinvio(ctx, req.params.id, req.body);
  const scadenza = await presentaDettaglio(await servizio.leggiScadenza(ctx, req.params.id), ctx);
  createdResponse(res, { registrazione: presentaRegistrazione(registrazione, ctx, await autoriDelle([registrazione])), scadenza }, 'Scadenza rinviata');
});
