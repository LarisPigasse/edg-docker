// =============================================================================
// A quali categorie si applica un controllo (tabella di collegamento)
// =============================================================================
// Nessuna categoria = il controllo vale per tutti i soggetti del suo tipo.
// Porta il tenant come ogni tabella del cliente.
// =============================================================================
import { InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../../config/database';
import { intero, tenant } from '../../core/db/colonne';

export class ControlloCategoria extends Model<InferAttributes<ControlloCategoria>, InferCreationAttributes<ControlloCategoria>> {
  declare idControllo: number;
  declare idCategoria: number;
  declare idTenant: number;
}

ControlloCategoria.init(
  {
    idControllo: { ...intero(false), primaryKey: true },
    idCategoria: { ...intero(false), primaryKey: true },
    idTenant: tenant(),
  },
  { sequelize, tableName: 'controlli_categorie', timestamps: false }
);
