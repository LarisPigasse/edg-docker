// =============================================================================
// Costi aziendali di un anno, per la stima dei costi di un servizio (2026-11-17)
// =============================================================================
// Per tenant e anno, a consuntivo o a preventivo: gli importi per macro voce
// (voci.ts) e le ore di servizio annue dell'azienda, da cui il costo
// aziendale per ora di servizio. Regole in parametri.ts.
// =============================================================================
import { CreationOptional } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, chiave, ConAudit, decimale, elenco, intero, istante, json, tenant, testo, uuid } from '../../core/db/colonne';
import { STATI_COSTI, type StatoCosti, type VociCosti } from './parametri';

export class CostiAziendali extends ConAudit<CostiAziendali> {
  declare idCosti: CreationOptional<number>;
  declare uuidCosti: CreationOptional<string>;
  declare idTenant: number;
  declare anno: number;
  declare stato: StatoCosti;
  declare voci: CreationOptional<VociCosti>;
  declare oreServizio: CreationOptional<number | null>;
  declare note: CreationOptional<string | null>;
}

CostiAziendali.init(
  {
    idCosti: chiave(),
    uuidCosti: uuid(),
    idTenant: tenant(),
    anno: intero(false),
    stato: elenco(STATI_COSTI),
    voci: json(false, {}),
    oreServizio: decimale('oreServizio'),
    note: testo(1024),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'costi_aziendali' }
);
