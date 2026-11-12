// =============================================================================
// Controllo non seguito per un soggetto (revisione 2026-11-11)
// =============================================================================
// Una decisione dell'ufficio: questo controllo non si segue per questo
// soggetto, con il motivo obbligatorio. Chi e quando ha deciso sono
// creatoDa e createdAt; quando si torna a seguirlo la riga resta come
// storico e si chiude con ripresaIl, ripresaDa e una nota facoltativa.
// Una sola decisione in corso per coppia (indice parziale nel database).
// Regole in esclusioni.ts, servizio in esclusioni.service.ts.
// =============================================================================
import { CreationOptional, NonAttribute } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, chiave, ConAudit, intero, istante, tenant, testo, uuid } from '../../core/db/colonne';
import type { Controllo } from '../controlli/controllo.model';
import type { Soggetto } from '../soggetti/soggetto.model';

export class ControlloNonSeguito extends ConAudit<ControlloNonSeguito> {
  declare idEsclusione: CreationOptional<number>;
  declare uuidEsclusione: CreationOptional<string>;
  declare idTenant: number;
  declare idSoggetto: number;
  declare idControllo: number;
  declare motivo: string;
  declare ripresaIl: CreationOptional<Date | null>;
  declare ripresaDa: CreationOptional<number | null>;
  declare notaRipresa: CreationOptional<string | null>;

  declare soggetto?: NonAttribute<Soggetto>;
  declare controllo?: NonAttribute<Controllo>;
}

ControlloNonSeguito.init(
  {
    idEsclusione: chiave(),
    uuidEsclusione: uuid(),
    idTenant: tenant(),
    idSoggetto: intero(false),
    idControllo: intero(false),
    motivo: testo(512, false),
    ripresaIl: istante(),
    ripresaDa: intero(),
    notaRipresa: testo(512),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'controlli_non_seguiti' }
);
