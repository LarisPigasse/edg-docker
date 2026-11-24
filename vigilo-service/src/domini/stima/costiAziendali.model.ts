// =============================================================================
// Costi aziendali di un anno, per la stima dei costi di un servizio (2026-11-17)
// =============================================================================
// Per tenant e anno, a consuntivo o a preventivo: gli importi per macro voce
// (voci.ts), la quota che spetta ai servizi con i mezzi, le ore di servizio
// annue e i km annui, da cui il costo aziendale per ora di servizio e per km
// (sulla sola quota). Regole in parametri.ts.
// =============================================================================
import { CreationOptional, DataTypes } from 'sequelize';
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
  declare kmAnnui: CreationOptional<number | null>;
  /** % dei costi che spetta ai servizi con i mezzi (trasporti e lavori) */
  declare quotaMezzi: CreationOptional<number>;
  /** Ricavi dell'anno, opzionali (2026-11-23) */
  declare ricavi: CreationOptional<number | null>;
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
    kmAnnui: { ...decimale('kmAnnui'), type: DataTypes.DECIMAL(14, 2) },
    quotaMezzi: { ...decimale('quotaMezzi'), type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 100 },
    ricavi: { ...decimale('ricavi'), type: DataTypes.DECIMAL(14, 2) },
    note: testo(1024),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'costi_aziendali' }
);
