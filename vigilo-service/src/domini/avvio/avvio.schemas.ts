// =============================================================================
// Procedura di avvio — schemi delle richieste
// =============================================================================
// Le chiavi si verificano qui solo nella forma; che esistano e che i modelli
// scelti le propongano lo verifica il servizio sulle tabelle della libreria.
// =============================================================================
import Joi from 'joi';
import { preavvisi, tolleranza } from '../schemi';

const chiave = Joi.string()
  .trim()
  .max(64)
  .pattern(/^[a-z0-9][a-z0-9.-]*$/)
  .messages({ 'string.pattern.base': '{{#label}} non è una chiave della libreria' });

const chiavi = (massimo: number) => Joi.array().items(chiave).max(massimo).unique();

/** GET /avvio/proposta?modelli=base,trasporto */
export const proposta = Joi.object({
  modelli: Joi.string()
    .trim()
    .max(512)
    .required()
    .custom((v: string, helpers) => {
      const elenco = [...new Set(v.split(',').map(s => s.trim()).filter(Boolean))];
      const errata = elenco.find(k => chiave.validate(k).error);
      return errata ? helpers.error('any.invalid') : elenco;
    }),
});

/** POST /avvio — liste vuote e nessun modello = "Parto da zero" */
export const avvia = Joi.object({
  modelli: chiavi(16).required(),
  categorie: chiavi(512).default([]),
  controlli: chiavi(1024).default([]),
  predefiniti: Joi.object({ preavvisi: preavvisi.required(), tolleranza: tolleranza.required() }),
});
