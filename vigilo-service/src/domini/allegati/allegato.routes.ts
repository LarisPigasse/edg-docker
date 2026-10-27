// =============================================================================
// Documenti — /api/vigilo/allegati (B9a, ADR099)
// =============================================================================
//   GET    /allegati?entita=&id=   i documenti di un soggetto (con scadenze e
//                                  registrazioni), di una scadenza o di una
//                                  registrazione, con i limiti per
//                                  l'interfaccia (read)
//   POST   /allegati               multipart: entita, id, descrizione, file (write)
//   GET    /allegati/:id           il file: si apre nel browser se PDF o
//                                  immagine mostrabile, ?scarica=1 per
//                                  scaricarlo (read)
//   DELETE /allegati/:id           (write)
// Il gateway inoltra /api/vigilo a flusso (ADR069): file in su e in giù
// senza passare dalla sua memoria.
// =============================================================================
import fs from 'fs';
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateParams, validateQuery } from '../../core/middleware/validate';
import { PARAMETRI } from '../../core/parametri';
import { logger } from '../../core/services/logger';
import { createdResponse, noContentResponse, notFound, successResponse } from '../../core/utils/response';
import { paramUuid, uuid } from '../schemi';
import { ENTITA_ALLEGATO, type EntitaAllegato } from '../valori';
import { LIMITI_ALLEGATI, intestazioneNome } from './allegati';
import * as servizio from './allegati.service';

export const allegatiRoutes = Router();

const elenco = Joi.object({
  entita: Joi.string()
    .valid(...ENTITA_ALLEGATO)
    .required(),
  id: uuid.required(),
});

allegatiRoutes.get('/allegati', richiedi('read'), validateQuery(elenco), async (req: Request, res: Response) => {
  const voci = await servizio.elencaAllegati(contestoDi(req), req.query.entita as EntitaAllegato, String(req.query.id));
  successResponse(res, { voci, limiti: { mb: PARAMETRI.allegatoMb, perEntita: LIMITI_ALLEGATI.perEntita } });
});

allegatiRoutes.post('/allegati', richiedi('write'), async (req: Request, res: Response) => {
  createdResponse(res, await servizio.caricaAllegato(contestoDi(req), req), 'Documento caricato');
});

allegatiRoutes.get('/allegati/:id', richiedi('read'), validateParams(paramUuid), async (req: Request, res: Response) => {
  const { allegato: a, percorso, tipo } = await servizio.leggiFile(contestoDi(req), req.params.id);
  const inLinea = req.query.scarica !== '1' && !!tipo?.apribile;
  const flusso = fs.createReadStream(percorso);
  flusso.once('error', err => {
    logger.warn('vigilo.allegati', `File del documento ${a.uuidAllegato} non leggibile: ${String(err)}`);
    if (!res.headersSent) notFound(res, 'File del documento');
    else res.destroy();
  });
  flusso.once('open', () => {
    res.setHeader('Content-Type', a.tipoMime);
    res.setHeader('Content-Length', String(a.dimensione));
    res.setHeader('Content-Disposition', intestazioneNome(a.nomeFile, inLinea));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    flusso.pipe(res);
  });
});

allegatiRoutes.delete('/allegati/:id', richiedi('write'), validateParams(paramUuid), async (req: Request, res: Response) => {
  await servizio.eliminaAllegato(contestoDi(req), req.params.id);
  noContentResponse(res);
});
