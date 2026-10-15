// =============================================================================
// Dati fissi di ogni tipo di soggetto (decisione del 2026-10-12)
// =============================================================================
// Schema nel codice, uguale per tutti i clienti; cio' che serve in piu' sta
// nei campi aggiuntivi delle categorie. Le date qui sono quelle di
// DATE_SOGGETTO (prime scadenze e fasce d'eta'): lo verifica un test.
// L'identificativo (targa, matricola...) e' una colonna, per cercarlo e
// renderlo unico: qui solo come si chiama e come si normalizza.
// =============================================================================
import Joi from 'joi';
import { giorno } from '../schemi';
import type { TipoSoggetto } from '../valori';

const testo = (max: number) => Joi.string().trim().max(max).allow('', null);
const email = Joi.string().trim().lowercase().email().max(256).allow('', null);
const data = giorno.allow(null);

export const DATI_TIPO: Record<TipoSoggetto, Record<string, Joi.Schema>> = {
  veicolo: {
    telaio: testo(32),
    marca: testo(64),
    modello: testo(64),
    immatricolazione: data,
    alimentazione: Joi.string().valid('gasolio', 'benzina', 'metano', 'gpl', 'elettrico', 'ibrido', 'altro').allow(null),
  },
  macchina: { marca: testo(64), modello: testo(64), fabbricazione: data, messaInServizio: data },
  attrezzatura: { marca: testo(64), modello: testo(64), fabbricazione: data, messaInServizio: data, ubicazione: testo(128) },
  sede: {
    indirizzo: testo(128),
    comune: testo(64),
    cap: Joi.string().pattern(/^\d{5}$/).allow('', null),
    provincia: Joi.string().trim().uppercase().pattern(/^[A-Z]{2}$/).allow('', null),
    conformitaImpianto: data,
  },
  persona: { nascita: data, assunzione: data, email, telefono: testo(32), mansione: testo(64) },
  azienda: { codiceFiscale: testo(16), pec: email, indirizzo: testo(128) },
};

/** Come si chiama l'identificativo per tipo */
export const IDENTIFICATIVO: Record<TipoSoggetto, string> = {
  veicolo: 'Targa',
  macchina: 'Matricola',
  attrezzatura: 'Matricola',
  sede: 'Codice',
  persona: 'Codice fiscale',
  azienda: 'Partita IVA',
};

/** Identificativo normalizzato: maiuscolo e senza spazi per targhe e codici */
export function normalizzaIdentificativo(tipo: TipoSoggetto, valore: string | null | undefined): string | null {
  if (valore === undefined || valore === null) return null;
  const v = valore.trim();
  if (!v) return null;
  return tipo === 'sede' ? v : v.toUpperCase().replace(/\s+/g, '');
}

/** Valida e pulisce i dati del tipo; restituisce gli errori in italiano */
export function validaDati(tipo: TipoSoggetto, dati: unknown): { valore: Record<string, unknown>; errori: string[] } {
  const { error, value } = Joi.object(DATI_TIPO[tipo]).validate(dati ?? {}, { abortEarly: false, stripUnknown: true });
  const errori = (error?.details ?? []).map(d => `${d.path.join('.')}: ${d.message.replace(/["]/g, '')}`);
  // le stringhe vuote diventano assenti: nei dati restano solo i valori veri
  const pulito = Object.fromEntries(Object.entries(value ?? {}).filter(([, v]) => v !== '' && v !== null && v !== undefined));
  return { valore: pulito, errori };
}
