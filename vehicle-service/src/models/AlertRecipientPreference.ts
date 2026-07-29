// =============================================================================
// EDG Vehicle Service - Model: AlertRecipientPreference
// "Il destinatario X vuole essere avvisato per il tipo Y" — Y è sempre
// esattamente uno tra deadlineType/maintenanceType/complianceType (vincolo
// imposto a livello di CHECK constraint nel database, non solo qui)
// =============================================================================
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type AlertRecipient from './AlertRecipient';
import type DeadlineType from './DeadlineType';
import type MaintenanceType from './MaintenanceType';
import type DriverComplianceType from './DriverComplianceType';

interface AlertRecipientPreferenceAttributes {
  id: number;
  recipientId: number;
  deadlineTypeId: number | null;
  maintenanceTypeId: number | null;
  complianceTypeId: number | null;
  createdAt: Date;
}

type AlertRecipientPreferenceCreationAttributes = Optional<
  AlertRecipientPreferenceAttributes,
  'id' | 'deadlineTypeId' | 'maintenanceTypeId' | 'complianceTypeId' | 'createdAt'
>;

class AlertRecipientPreference
  extends Model<AlertRecipientPreferenceAttributes, AlertRecipientPreferenceCreationAttributes>
  implements AlertRecipientPreferenceAttributes
{
  declare id: number;
  declare recipientId: number;
  declare deadlineTypeId: number | null;
  declare maintenanceTypeId: number | null;
  declare complianceTypeId: number | null;
  declare createdAt: Date;

  // Associations (populated by include)
  declare recipient?: AlertRecipient;
  declare deadlineType?: DeadlineType;
  declare maintenanceType?: MaintenanceType;
  declare complianceType?: DriverComplianceType;
}

AlertRecipientPreference.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    recipientId: { type: DataTypes.INTEGER, allowNull: false },
    deadlineTypeId: { type: DataTypes.INTEGER, allowNull: true },
    maintenanceTypeId: { type: DataTypes.INTEGER, allowNull: true },
    complianceTypeId: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'AlertRecipientPreference',
    tableName: 'alert_recipient_preferences',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);

export default AlertRecipientPreference;
