// =============================================================================
// Fornitore (02-modello-dati): officina, ente, compagnia, studio...
// =============================================================================
// Rubrica propria di Vigilo: chi esegue i controlli, da indicare nelle
// registrazioni e nei resoconti dei costi.
// =============================================================================
import { CreationOptional } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, booleano, chiave, ConAudit, istante, tenant, testo, uuid } from '../../core/db/colonne';

export class Fornitore extends ConAudit<Fornitore> {
  declare idFornitore: CreationOptional<number>;
  declare uuidFornitore: CreationOptional<string>;
  declare idTenant: number;
  declare nome: string;
  declare tipo: CreationOptional<string | null>;
  declare telefono: CreationOptional<string | null>;
  declare email: CreationOptional<string | null>;
  declare indirizzo: CreationOptional<string | null>;
  declare referente: CreationOptional<string | null>;
  declare note: CreationOptional<string | null>;
  declare attivo: CreationOptional<boolean>;
}

Fornitore.init(
  {
    idFornitore: chiave(),
    uuidFornitore: uuid(),
    idTenant: tenant(),
    nome: testo(128, false),
    tipo: testo(64),
    telefono: testo(64),
    email: { ...testo(256), validate: { isEmail: true } },
    indirizzo: testo(256),
    referente: testo(128),
    note: testo(),
    attivo: booleano(true),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'fornitori' }
);
