// =============================================================================
// EDG System Service - Modello Settore (ADR059)
// Tabella di base: settori di attività delle aziende in anagrafica (clienti e
// partner), riferita da Anagrafica.idSettore. Gestita da EDG dall'interfaccia.
// Tabella elementare: nessun created_at/updated_at (come Reparto)
// =============================================================================
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SettoreAttributes {
  idSettore: number;
  uuidSettore: string;
  settore: string;
  isActive: boolean;
}

interface SettoreCreationAttributes extends Optional<SettoreAttributes, 'idSettore' | 'uuidSettore' | 'isActive'> {}

class Settore extends Model<SettoreAttributes, SettoreCreationAttributes> implements SettoreAttributes {
  declare idSettore: number;
  declare uuidSettore: string;
  declare settore: string;
  declare isActive: boolean;
}

Settore.init(
  {
    idSettore: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuidSettore: {
      // Generato dal DB (DEFAULT gen_random_uuid()): allowNull solo per la
      // validazione di Sequelize, il NOT NULL vero è nel database (vedi Reparto)
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
    },
    settore: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'settori',
    timestamps: false,
  }
);

export default Settore;
