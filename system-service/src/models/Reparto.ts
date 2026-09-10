// =============================================================================
// EDG System Service - Modello Reparto
// Tabella primitiva: elenco reparti aziendali, riferita da Operatore.idReparto
// Tabella elementare: nessun created_at/updated_at (non serve storicizzare)
// =============================================================================
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface RepartoAttributes {
  idReparto: number;
  uuidReparto: string;
  reparto: string;
  isActive: boolean;
}

interface RepartoCreationAttributes
  extends Optional<RepartoAttributes, 'idReparto' | 'uuidReparto' | 'isActive'> {}

class Reparto extends Model<RepartoAttributes, RepartoCreationAttributes> implements RepartoAttributes {
  declare idReparto: number;
  declare uuidReparto: string;
  declare reparto: string;
  declare isActive: boolean;
}

Reparto.init(
  {
    idReparto: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuidReparto: {
      // Nessun defaultValue qui: il valore arriva dal DEFAULT gen_random_uuid()
      // impostato in migration — cosi' la generazione resta sempre lato DB.
      type: DataTypes.UUID,
      // allowNull: true SOLO per bypassare la validazione client-side di
      // Sequelize (che altrimenti rifiuta l'istanza prima ancora di
      // arrivare al DB, perché il campo non è valorizzato in JS). Il
      // vincolo NOT NULL vero resta sul DB (vedi migration): e' li' che
      // viene davvero applicato, dopo che gen_random_uuid() lo riempie.
      allowNull: true,
      unique: true,
    },
    reparto: {
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
    tableName: 'reparti',
    timestamps: false,
  }
);

export default Reparto;
