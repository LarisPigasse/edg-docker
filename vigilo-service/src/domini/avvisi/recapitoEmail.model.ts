// =============================================================================
// Recapito email senza account (B8d-4, ADR098)
// =============================================================================
// Un indirizzo che riceve gli avvisi di un tenant senza avere un account: il
// codice del collegamento "Non ricevere più questi avvisi" e, se l'ha
// chiesto, da quando non li riceve più (escluso). Una riga per tenant e
// indirizzo, creata al primo invio (recapiti.service).
// =============================================================================
import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../../config/database';
import { chiave, istante, tenant, testo } from '../../core/db/colonne';

export class RecapitoEmail extends Model<InferAttributes<RecapitoEmail>, InferCreationAttributes<RecapitoEmail>> {
  declare idRecapito: CreationOptional<number>;
  declare idTenant: number;
  /** Sempre in minuscolo, senza spazi (CHECK nella tabella) */
  declare email: string;
  declare codice: string;
  declare esclusoIl: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

RecapitoEmail.init(
  {
    idRecapito: chiave(),
    idTenant: tenant(),
    email: testo(256, false),
    codice: testo(64, false),
    esclusoIl: istante(),
    createdAt: istante(false),
    updatedAt: istante(false),
  },
  { sequelize, tableName: 'recapiti_email' }
);
