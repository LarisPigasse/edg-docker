// =============================================================================
// Soggetti — schemi delle richieste (i dati del tipo si validano nel servizio)
// =============================================================================
import Joi from 'joi';
import { schemaLista } from '../../core/utils/lista';
import { giorno, tipoSoggetto, uuid } from '../schemi';
import { STATI_SOGGETTO } from '../valori';

const campi = {
  categoria: uuid.allow(null),
  nome: Joi.string().trim().min(1).max(128),
  identificativo: Joi.string().trim().max(64).allow('', null),
  codice: Joi.string().trim().max(32).allow('', null),
  dati: Joi.object().unknown(true),
  campi: Joi.object().unknown(true),
  sede: uuid.allow(null),
  referente: uuid.allow(null),
  note: Joi.string().trim().max(4096).allow('', null),
  /** Solo persone e solo con vigilo.costi; i limiti in impostazioni/limiti.ts (passo 8) */
  costoOrario: Joi.number().allow(null),
};

export const creaSoggetto = Joi.object({ ...campi, tipo: tipoSoggetto.required(), nome: campi.nome.required() });
export const modificaSoggetto = Joi.object(campi).min(1);

export const statoSoggetto = Joi.object({
  stato: Joi.string()
    .valid(...STATI_SOGGETTO)
    .required(),
  dal: giorno,
});

export const listaSoggetti = schemaLista(['nome', 'identificativo', 'tipo', 'urgenza', 'creatoIl'], 'nome', {
  tipo: tipoSoggetto,
  categoria: uuid,
  sede: uuid,
  stato: Joi.string().valid(...STATI_SOGGETTO, 'attivi'),
});
