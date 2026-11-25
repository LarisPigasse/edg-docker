// =============================================================================
// Stima dei costi di un servizio — /api/vigilo/stima (2026-11-17)
// =============================================================================
//   GET    /stima/parametri        parametri generali e costi aziendali per anno (read e costi)
//   PATCH  /stima/parametri        modifica dei parametri generali (write e costi)
//   PUT    /stima/anni/:anno       crea o aggiorna i costi di un anno (write e costi)
//   DELETE /stima/anni/:anno       toglie un anno (write e costi)
//   GET    /stima/anni/:anno/km-suggeriti   i km dei veicoli nell'anno dai contatori (read e costi)
//   POST   /stima/calcola          la stima di un servizio a km o a ore (read e costi)
//   GET    /stima/stime            le stime salvate, le più recenti per prime (read e costi)
//   POST   /stima/stime            salva una stima: { descrizione, ...dati del calcolo } (read e costi)
//   GET    /stima/stime/:id        una stima intera (read e costi)
//   PATCH  /stima/stime/:id/reale  il costo reale dopo il servizio, null lo toglie (read e costi)
//   PATCH  /stima/stime/:id/prezzo il prezzo applicato, null lo toglie (read e costi; 2026-11-23)
//   DELETE /stima/stime/:id        chi l'ha salvata o chi ha write (read e costi)
// =============================================================================
import Joi from 'joi';
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { consultato } from '../../core/services/consultazioni';
import { richiedi } from '../../core/middleware/permessi';
import { validateBody, validateParams, validateQuery } from '../../core/middleware/validate';
import { paginaDa, rispondiLista, schemaLista } from '../../core/utils/lista';
import { paramUuid } from '../schemi';
import { createdResponse, successResponse } from '../../core/utils/response';
import { LIMITI_STIMA, type RegoleStima } from '../impostazioni/limiti';
import { VOCI_COSTI, STATI_COSTI } from './parametri';
import { cambiaGenerali, eliminaAnno, kmSuggeriti, leggiParametri, salvaAnno } from './parametri.service';
import { calcolaServizio, type RichiestaCalcolo } from './calcolo.service';
import { elencoStime, eliminaStima, leggiStima, registraPrezzo, registraReale, salvaStima } from './stime.service';

const numero = Joi.number().allow(null);
const generali = Joi.object({
  costoOrarioConducente: numero.label('Il costo orario del conducente'),
  velocitaMedia: Joi.number().label('La velocità media'),
  oreGuidaGiorno: Joi.number().label('Le ore di guida al giorno'),
  diaria: numero.label('La diaria'),
  pedaggioKm: numero.label('Il pedaggio per km'),
  oreImpiegoAnnue: Joi.number().label('Le ore di impiego annue di un mezzo'),
  indennitaTrasferta: numero.label("L'indennità di trasferta"),
  sogliaOreTrasferta: Joi.number().label('Le ore oltre cui scatta la trasferta'),
  sogliaKmTrasferta: Joi.number().label('I km oltre cui scatta la trasferta'),
})
  .min(1)
  .messages({ 'object.min': 'Nessun parametro da cambiare' });

const paramAnno = Joi.object({ anno: Joi.number().integer().required() });
const corpoAnno = Joi.object({
  stato: Joi.string()
    .valid(...STATI_COSTI)
    .required()
    .label('Consuntivo o preventivo'),
  voci: Joi.object(Object.fromEntries(VOCI_COSTI.map(v => [v, numero]))).label('Le voci'),
  oreServizio: numero.label('Le ore di servizio annue'),
  kmAnnui: numero.label('I km annui'),
  quotaMezzi: Joi.number().label('La quota sui servizi con i mezzi'),
  ricavi: numero.label('I ricavi'),
  note: Joi.string().allow('', null).max(1024).label('Le note'),
});

const L = LIMITI_STIMA;
const fra = (l: { min: number; max: number }) => Joi.number().min(l.min).max(l.max);
const corpoCalcolo = Joi.object({
  tipo: Joi.string().valid('km', 'ore').required().label('Il tipo di servizio'),
  mezzo: Joi.string().uuid().allow(null).label('Il mezzo'),
  costoMezzo: fra(L.costoMezzo).allow(null).label('Il costo del mezzo in movimento'),
  costoMezzoOra: fra(L.costoMezzo).allow(null).label('Il costo del mezzo per ora di impiego'),
  km: fra(L.km).label('I km'),
  ritornoAVuoto: Joi.boolean(),
  kmAutostrada: fra(L.km).allow(null).label('I km in autostrada'),
  oreLavoro: fra(L.ore).label('Le ore di lavoro'),
  oreAggiuntive: fra(L.ore).label('Le ore in più'),
  persona: Joi.string().uuid().allow(null).label('Il conducente'),
  costoOrario: fra(L.costoOrarioConducente).allow(null).label('Il costo orario'),
  pernottamenti: Joi.number().integer().min(L.pernottamenti.min).max(L.pernottamenti.max).label('I pernottamenti'),
  pedaggi: fra(L.importo).allow(null).label('I pedaggi'),
  extra: Joi.array()
    .items(Joi.object({ descrizione: Joi.string().trim().max(128).allow('').required(), importo: fra(L.importo).required() }))
    .max(L.extraMassimi)
    .label('Le voci extra'),
  anno: Joi.number().integer().allow(null).label("L'anno dei costi aziendali"),
});

const corpoSalva = corpoCalcolo.keys({ descrizione: Joi.string().trim().max(128).allow('', null).label('La descrizione') });
const corpoPrezzo = Joi.object({
  prezzo: fra(L.costoAnnuo).allow(null).required().label('Il prezzo applicato'),
});
const corpoReale = Joi.object({
  costoReale: fra(L.costoAnnuo).allow(null).required().label('Il costo reale'),
  note: Joi.string().trim().max(1024).allow('', null).label('Le note'),
});
const listaStime = schemaLista(['createdAt'], 'createdAt');

const lettura = [richiedi('read'), richiedi('costi')];
const scrittura = [richiedi('write'), richiedi('costi')];

export const stimaRoutes = Router();

stimaRoutes.get('/stima/parametri', ...lettura, async (req: Request, res: Response) => {
  successResponse(res, await leggiParametri(contestoDi(req)));
});

stimaRoutes.post('/stima/calcola', ...lettura, validateBody(corpoCalcolo), async (req: Request, res: Response) => {
  successResponse(res, await calcolaServizio(contestoDi(req), req.body as RichiestaCalcolo));
});

stimaRoutes.get('/stima/stime', ...lettura, validateQuery(listaStime), async (req: Request, res: Response) => {
  const p = paginaDa(req.query);
  const { elementi, totale } = await elencoStime(contestoDi(req), p);
  rispondiLista(res, elementi, totale, p);
});

stimaRoutes.post('/stima/stime', ...lettura, validateBody(corpoSalva), async (req: Request, res: Response) => {
  createdResponse(res, await salvaStima(contestoDi(req), req.body), 'Stima salvata');
});

stimaRoutes.get('/stima/stime/:id', ...lettura, validateParams(paramUuid), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const s = await leggiStima(ctx, req.params.id);
  successResponse(res, s);
  consultato(ctx, 'stima', { id: s.uuid, nome: s.descrizione });
});

// il prezzo applicato al cliente, anche prima del servizio; null lo toglie (2026-11-23)
stimaRoutes.patch('/stima/stime/:id/prezzo', ...lettura, validateParams(paramUuid), validateBody(corpoPrezzo), async (req: Request, res: Response) => {
  successResponse(res, await registraPrezzo(contestoDi(req), req.params.id, req.body), 'Prezzo salvato');
});

stimaRoutes.patch('/stima/stime/:id/reale', ...lettura, validateParams(paramUuid), validateBody(corpoReale), async (req: Request, res: Response) => {
  successResponse(res, await registraReale(contestoDi(req), req.params.id, req.body), 'Costo reale salvato');
});

stimaRoutes.delete('/stima/stime/:id', ...lettura, validateParams(paramUuid), async (req: Request, res: Response) => {
  await eliminaStima(contestoDi(req), req.params.id);
  successResponse(res, null, 'Stima eliminata');
});

stimaRoutes.patch('/stima/parametri', ...scrittura, validateBody(generali), async (req: Request, res: Response) => {
  successResponse(res, await cambiaGenerali(contestoDi(req), req.body as Partial<RegoleStima>), 'Parametri aggiornati');
});

stimaRoutes.put('/stima/anni/:anno', ...scrittura, validateParams(paramAnno), validateBody(corpoAnno), async (req: Request, res: Response) => {
  successResponse(res, await salvaAnno(contestoDi(req), Number(req.params.anno), req.body), 'Costi aziendali salvati');
});

stimaRoutes.get('/stima/anni/:anno/km-suggeriti', ...lettura, validateParams(paramAnno), async (req: Request, res: Response) => {
  successResponse(res, await kmSuggeriti(contestoDi(req), Number(req.params.anno)));
});

stimaRoutes.delete('/stima/anni/:anno', ...scrittura, validateParams(paramAnno), async (req: Request, res: Response) => {
  successResponse(res, await eliminaAnno(contestoDi(req), Number(req.params.anno)), 'Costi aziendali eliminati');
});
