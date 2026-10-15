// =============================================================================
// Controlli — schemi delle richieste
// =============================================================================
import Joi from 'joi';
import { schemaLista } from '../../core/utils/lista';
import { cadenza, destinatari, natura, preavvisi, registrazione, rinnovo, tipoSoggetto, tolleranza, uuid } from '../schemi';

const campi = {
  nome: Joi.string().trim().min(1).max(128),
  descrizione: Joi.string().trim().max(1024).allow('', null),
  riferimentoNormativo: Joi.string().trim().max(256).allow('', null),
  natura,
  tipoSoggetto,
  automatico: Joi.boolean(),
  cadenza,
  preavvisi,
  tolleranza,
  destinatari,
  rinnovo,
  rinviabile: Joi.boolean(),
  avvisaAncheSeFermo: Joi.boolean(),
  registrazione,
  ordine: Joi.number().integer().min(0).max(1024),
  attivo: Joi.boolean(),
  /** uuid delle categorie; vuoto = tutti i soggetti del tipo */
  categorie: Joi.array().items(uuid).max(64).unique(),
};

export const creaControllo = Joi.object({
  ...campi,
  nome: campi.nome.required(),
  natura: campi.natura.required(),
  tipoSoggetto: campi.tipoSoggetto.required(),
  cadenza: campi.cadenza.required(),
});

export const modificaControllo = Joi.object(campi).min(1);

export const listaControlli = schemaLista(['ordine', 'nome', 'tipoSoggetto', 'natura', 'creatoIl'], 'ordine', {
  tipo: tipoSoggetto,
  natura,
  attivo: Joi.boolean(),
  automatico: Joi.boolean(),
  categoria: uuid,
  libreria: Joi.boolean(),
});
