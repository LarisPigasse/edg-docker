// =============================================================================
// Assegnazione: chi usa un soggetto e da quando (02-modello-dati)
// =============================================================================
// Una persona assegnata a un veicolo, una macchina o un'attrezzatura per un
// periodo (al = null: in corso). E' l'"assegnatario" fra i destinatari degli
// avvisi e cio' che l'addetto vede come "il mio mezzo".
// =============================================================================
import { CreationOptional, NonAttribute } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, chiave, ConAudit, giorno, intero, istante, tenant, testo, uuid } from '../../core/db/colonne';
import type { Giorno } from '../../regole';
import type { Soggetto } from './soggetto.model';

export class Assegnazione extends ConAudit<Assegnazione> {
  declare idAssegnazione: CreationOptional<number>;
  declare uuidAssegnazione: CreationOptional<string>;
  declare idTenant: number;
  declare idSoggetto: number;
  declare idPersona: number;
  declare dal: Giorno;
  declare al: CreationOptional<Giorno | null>;
  declare note: CreationOptional<string | null>;

  declare soggetto?: NonAttribute<Soggetto>;
  declare persona?: NonAttribute<Soggetto>;
}

Assegnazione.init(
  {
    idAssegnazione: chiave(),
    uuidAssegnazione: uuid(),
    idTenant: tenant(),
    idSoggetto: intero(false),
    idPersona: intero(false),
    dal: giorno(false),
    al: giorno(),
    note: testo(),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'assegnazioni' }
);
