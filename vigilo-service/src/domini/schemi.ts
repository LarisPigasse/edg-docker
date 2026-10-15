// =============================================================================
// Schemi Joi condivisi dai domini (02-modello-dati 2.2)
// =============================================================================
// I 4 gruppi ereditabili hanno UNO schema, qui: lo usano i controlli e le
// ridefinizioni delle scadenze. I controlli di significato (date del tipo,
// contatori delle categorie) sono in coerenza.ts, perche' dipendono dai dati.
// =============================================================================
import Joi from 'joi';
import { ANCORAGGI, UNITA_TEMPO, UNITA_USO } from '../regole';
import { CANALI, NATURE, RINNOVI, TIPI_SOGGETTO } from './valori';

const intero = (min = 1, max = 4096) => Joi.number().integer().min(min).max(max);

export const uuid = Joi.string().guid({ version: 'uuidv4' });
export const giorno = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .messages({ 'string.pattern.base': '{{#label}} deve essere una data AAAA-MM-GG' });

export const paramUuid = Joi.object({ id: uuid.required() });

export const durata = Joi.object({ valore: intero(1, 1024).required(), unita: Joi.string().valid(...UNITA_TEMPO).required() });
export const intervallo = Joi.object({ valore: intero(1, 1 << 24).required(), unita: Joi.string().valid(...UNITA_USO).required() });

export const cadenza = Joi.object({
  tempo: durata.allow(null).required(),
  uso: intervallo.allow(null).required(),
  ancoraggio: Joi.string().valid(...ANCORAGGI).required(),
  fineMese: Joi.boolean().required(),
  prima: Joi.object({ tempo: durata.required(), da: Joi.string().max(32).required() }).allow(null).required(),
  finestra: durata.allow(null).when('ancoraggio', { is: 'finestra', then: Joi.required().invalid(null) }),
  fasce: Joi.object({
    da: Joi.string().max(32).required(),
    elenco: Joi.array().items(Joi.object({ oltre: durata.required(), tempo: durata.required() })).min(1).max(8).required(),
  }).allow(null),
});

const decrescenti = (valori: number[], helpers: Joi.CustomHelpers) =>
  valori.every((v, i) => i === 0 || v < valori[i - 1]) ? valori : helpers.error('any.invalid');

export const preavvisi = Joi.object({
  giorni: Joi.array().items(intero(1, 1024)).max(8).custom(decrescenti).required(),
  uso: Joi.array().items(intero(1, 1 << 24)).max(8).custom(decrescenti).required(),
}).messages({ 'any.invalid': 'I preavvisi vanno dal più lontano al più vicino, senza ripetizioni' });

export const tolleranza = Joi.object({ giorni: intero(0, 1024).required(), uso: intero(0, 1 << 24).required() });

export const destinatari = Joi.array()
  .items(
    Joi.alternatives().try(
      Joi.object({ tipo: Joi.string().valid('ufficio', 'referente', 'assegnatario', 'interessato').required() }),
      Joi.object({ tipo: Joi.string().valid('email').required(), email: Joi.string().email().max(256).required() })
    )
  )
  .min(1)
  .max(16);

const richiesta = Joi.string().valid('obbligatorio', 'facoltativo', 'nascosto');
export const registrazione = Joi.object({
  importo: richiesta,
  fornitore: richiesta,
  riferimento: richiesta,
  lettura: richiesta,
  allegato: richiesta,
});

export const campoAggiuntivo = Joi.object({
  chiave: Joi.string()
    .pattern(/^[a-z][a-zA-Z0-9]{0,31}$/)
    .required(),
  etichetta: Joi.string().trim().max(64).required(),
  tipo: Joi.string().valid('testo', 'numero', 'data', 'elenco', 'si-no').required(),
  opzioni: Joi.array()
    .items(Joi.string().trim().max(64))
    .max(64)
    .when('tipo', { is: 'elenco', then: Joi.array().min(1).required() }),
  obbligatorio: Joi.boolean().default(false),
  ordine: intero(0, 1024).default(0),
});

export const tipoSoggetto = Joi.string().valid(...TIPI_SOGGETTO);
export const natura = Joi.string().valid(...NATURE);
export const rinnovo = Joi.string().valid(...RINNOVI);
export const canale = Joi.string().valid(...CANALI);
