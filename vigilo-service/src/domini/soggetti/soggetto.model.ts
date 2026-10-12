// =============================================================================
// Soggetto (01-dominio, 02-modello-dati)
// =============================================================================
// Cio' che ha scadenze: veicolo, macchina, attrezzatura, sede, persona o
// l'azienda stessa. I campi del tipo stanno in `dati` (schema fisso nel
// codice), quelli della categoria in `campi`; nome, identificativo e codice
// sono colonne perche' servono a cercare e ordinare.
// Una persona puo' essere collegata a un account (idAccount): e' l'addetto
// che vede "le mie scadenze" (passo 5.4).
// =============================================================================
import { CreationOptional, NonAttribute } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, chiave, ConAudit, elenco, giorno, intero, istante, json, tenant, testo, uuid } from '../../core/db/colonne';
import type { Giorno } from '../../regole';
import { STATI_SOGGETTO, TIPI_SOGGETTO, type StatoSoggetto, type TipoSoggetto } from '../valori';
import type { Categoria } from '../categorie/categoria.model';
import type { Contatore } from '../contatori/contatore.model';
import type { Scadenza } from '../scadenze/scadenza.model';
import type { Assegnazione } from './assegnazione.model';

export class Soggetto extends ConAudit<Soggetto> {
  declare idSoggetto: CreationOptional<number>;
  declare uuidSoggetto: CreationOptional<string>;
  declare idTenant: number;
  declare tipo: TipoSoggetto;
  declare idCategoria: CreationOptional<number | null>;
  declare nome: string;
  /** Targa, matricola, codice fiscale...: unico per tipo fra i non dismessi */
  declare identificativo: CreationOptional<string | null>;
  /** Codice interno del cliente (es. numero di flotta) */
  declare codice: CreationOptional<string | null>;
  declare stato: CreationOptional<StatoSoggetto>;
  declare statoDal: CreationOptional<Giorno | null>;
  declare dati: CreationOptional<Record<string, unknown>>;
  declare campi: CreationOptional<Record<string, unknown>>;
  declare idSede: CreationOptional<number | null>;
  declare idReferente: CreationOptional<number | null>;
  declare idAccount: CreationOptional<number | null>;
  declare note: CreationOptional<string | null>;

  declare categoria?: NonAttribute<Categoria | null>;
  declare sede?: NonAttribute<Soggetto | null>;
  declare referente?: NonAttribute<Soggetto | null>;
  declare contatori?: NonAttribute<Contatore[]>;
  declare scadenze?: NonAttribute<Scadenza[]>;
  declare assegnazioni?: NonAttribute<Assegnazione[]>;
}

Soggetto.init(
  {
    idSoggetto: chiave(),
    uuidSoggetto: uuid(),
    idTenant: tenant(),
    tipo: elenco(TIPI_SOGGETTO),
    idCategoria: intero(),
    nome: testo(128, false),
    identificativo: testo(64),
    codice: testo(32),
    stato: elenco(STATI_SOGGETTO, false, 'in-servizio'),
    statoDal: giorno(),
    dati: json(false, {}),
    campi: json(false, {}),
    idSede: intero(),
    idReferente: intero(),
    idAccount: intero(),
    note: testo(),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'soggetti' }
);
