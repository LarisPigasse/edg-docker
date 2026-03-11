import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type DriverComplianceType from './DriverComplianceType';
import type Driver from './Driver';

export type ComplianceStatus = 'valid' | 'expiring' | 'expired' | 'not_applicable';

interface DriverComplianceAttributes {
  id: number;
  driverId: number;
  typeId: number;
  issuedAt: Date | null;
  expiresAt: Date | null;
  issuingBody: string | null;
  status: ComplianceStatus;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DriverComplianceCreationAttributes extends Optional<
  DriverComplianceAttributes,
  'id' | 'issuedAt' | 'expiresAt' | 'issuingBody' | 'status' | 'notes'
> {}

class DriverCompliance
  extends Model<DriverComplianceAttributes, DriverComplianceCreationAttributes>
  implements DriverComplianceAttributes
{
  declare id: number;
  declare driverId: number;
  declare typeId: number;
  declare issuedAt: Date | null;
  declare expiresAt: Date | null;
  declare issuingBody: string | null;
  declare status: ComplianceStatus;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Associations (populated by include)
  declare complianceType?: DriverComplianceType;
  declare driver?: Driver;
}

DriverCompliance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'drivers', key: 'id' },
    },
    typeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'driver_compliance_types', key: 'id' },
    },
    issuedAt: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    issuingBody: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'valid',
      validate: {
        isIn: [['valid', 'expiring', 'expired', 'not_applicable']],
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'driver_compliances',
    timestamps: true,
    indexes: [{ unique: true, fields: ['driver_id', 'type_id'] }],
  }
);

export default DriverCompliance;
