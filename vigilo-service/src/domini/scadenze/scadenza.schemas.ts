// =============================================================================
// Scadenze e registrazioni — schemi delle richieste
// =============================================================================
import Joi from 'joi';
import { schemaLista } from '../../core/utils/lista';
import { cadenza, destinatari, giorno, natura, preavvisi, tipoSoggetto, tolleranza, uuid } from '../schemi';

const ridefinizioni = {
  cadenza: cadenza.allow(null),
  preavvisi: preavvisi.allow(null),
  tolleranza: tolleranza.allow(null),
  destinatari: destinatari.allow(null),
};

const posizione = {
  scadeIl: giorno.allow(null),
  sogliaUso: Joi.number().integer().min(0).max(1 << 30).allow(null),
  titolo: Joi.string().trim().max(160).allow('', null),
  note: Joi.string().trim().max(4096).allow('', null),
  fineIl: giorno.allow(null),
  ripetizioniRimaste: Joi.number().integer().min(0).max(1024).allow(null),
  ...ridefinizioni,
};

export const creaScadenza = Joi.object({ soggetto: uuid.allow(null), controllo: uuid.allow(null), ...posizione });
export const modificaScadenza = Joi.object(posizione).min(1);

const importo = Joi.number().min(0).max(1e9).precision(2).allow(null);
export const esecuzione = Joi.object({
  eseguitaIl: giorno.required(),
  esito: Joi.string().valid('positivo', 'negativo').default('positivo'),
  lettura: Joi.number().integer().min(0).max(1 << 30).allow(null),
  importo,
  fornitore: uuid.allow(null),
  riferimento: Joi.string().trim().max(128).allow('', null),
  note: Joi.string().trim().max(4096).allow('', null),
  prossima: Joi.object({ scadeIl: giorno, sogliaUso: Joi.number().integer().min(0).max(1 << 30) }),
  dataNuova: giorno.allow(null),
});

/** Lo storico di un soggetto: le più recenti per prime */
export const listaRegistrazioni = schemaLista(['eseguitaIl'], 'eseguitaIl').keys({
  soggetto: uuid.required(),
  verso: Joi.string().valid('asc', 'desc').default('desc'),
});

export const rinvio = Joi.object({
  dataNuova: giorno.required(),
  motivo: Joi.string().trim().min(1).max(512).required(),
  note: Joi.string().trim().max(4096).allow('', null),
});

const filtri = {
  stati: Joi.string().pattern(/^[a-z-]+(,[a-z-]+)*$/),
  soggetto: uuid,
  // uno o più controlli (fino a 32), separati da virgola: i controlli con lo
  // stesso nome in categorie diverse si guardano insieme, come in dashboard
  controllo: Joi.string().pattern(/^[0-9a-f-]{36}(,[0-9a-f-]{36}){0,31}$/i),
  categoria: uuid,
  sede: uuid,
  tipo: tipoSoggetto,
  natura,
  aperte: Joi.boolean().default(true),
  entro: Joi.number().integer().min(0).max(4096),
};

export const listaScadenze = schemaLista(['urgenza', 'scadeIl', 'soggetto', 'stato', 'chiusaIl'], 'urgenza', filtri);
