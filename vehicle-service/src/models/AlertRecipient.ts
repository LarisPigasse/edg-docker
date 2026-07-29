// =============================================================================
// EDG Vehicle Service - Model: AlertRecipient
// Destinatario di avvisi via email — riceve tutto oppure solo i tipi elencati
// in AlertRecipientPreference
// =============================================================================
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type AlertRecipientPreference from './AlertRecipientPreference';

interface AlertRecipientAttributes {
  id: number;
  email: string;
  name: string | null;
  receivesAll: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type AlertRecipientCreationAttributes = Optional<
  AlertRecipientAttributes,
  'id' | 'name' | 'receivesAll' | 'isActive' | 'createdAt' | 'updatedAt'
>;

class AlertRecipient
  extends Model<AlertRecipientAttributes, AlertRecipientCreationAttributes>
  implements AlertRecipientAttributes
{
  declare id: number;
  declare email: string;
  declare name: string | null;
  declare receivesAll: boolean;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Associations (populated by include)
  declare preferences?: AlertRecipientPreference[];
}

AlertRecipient.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    name: { type: DataTypes.STRING(150), allowNull: true },
    receivesAll: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'AlertRecipient',
    tableName: 'alert_recipients',
    underscored: true,
    timestamps: true,
  }
);

export default AlertRecipient;
