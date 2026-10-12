// =============================================================================
// Lettura di un contatore (02-modello-dati)
// =============================================================================
// Storico delle letture: a mano (anche dall'addetto), da una registrazione,
// in futuro da telematica o importazione. Le letture anomale (all'indietro o
// con salti impossibili) restano visibili ma non entrano nell'uso medio.
// =============================================================================
import { CreationOptional, NonAttribute } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, booleano, chiave, ConAudit, elenco, giorno, intero, istante, tenant, testo, uuid } from '../../core/db/colonne';
import type { Giorno } from '../../regole';
import { FONTI_LETTURA, type FonteLettura } from '../valori';
import type { Contatore } from './contatore.model';

export class Lettura extends ConAudit<Lettura> {
  declare idLettura: CreationOptional<number>;
  declare uuidLettura: CreationOptional<string>;
  declare idTenant: number;
  declare idContatore: number;
  declare valore: number;
  declare lettoIl: Giorno;
  declare fonte: CreationOptional<FonteLettura>;
  declare idRegistrazione: CreationOptional<number | null>;
  declare anomala: CreationOptional<boolean>;
  declare note: CreationOptional<string | null>;

  declare contatore?: NonAttribute<Contatore>;
}

Lettura.init(
  {
    idLettura: chiave(),
    uuidLettura: uuid(),
    idTenant: tenant(),
    idContatore: intero(false),
    valore: { ...intero(false), validate: { min: 0 } },
    lettoIl: giorno(false),
    fonte: elenco(FONTI_LETTURA, false, 'manuale'),
    idRegistrazione: intero(),
    anomala: booleano(false),
    note: testo(256),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'letture' }
);
