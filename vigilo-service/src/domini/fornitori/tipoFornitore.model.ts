// =============================================================================
// Tipo di fornitore (F0): catalogo comune a tutti i tenant
// =============================================================================
// Officina, carrozzeria, centro revisioni, assicurazione... Serve a filtrare
// i fornitori e i resoconti dei costi. Niente id_tenant: lo cambia solo root
// da EDG Pro. La chiave non cambia mai (codice e report), il nome sì.
// =============================================================================
import { CreationOptional } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, booleano, chiave, ConAudit, intero, istante, testo } from '../../core/db/colonne';

export class TipoFornitore extends ConAudit<TipoFornitore> {
  declare idTipo: CreationOptional<number>;
  declare chiave: string;
  declare nome: string;
  declare ordine: CreationOptional<number>;
  declare attivo: CreationOptional<boolean>;
}

TipoFornitore.init(
  {
    idTipo: chiave(),
    chiave: testo(32, false),
    nome: testo(64, false),
    ordine: intero(false, 0),
    attivo: booleano(true),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'tipi_fornitore' }
);
