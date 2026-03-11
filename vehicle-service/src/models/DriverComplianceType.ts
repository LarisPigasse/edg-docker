import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface DriverComplianceTypeAttributes {
  id: number;
  name: string;
  label: string;
  category: 'license' | 'medical' | 'training' | 'other';
  description: string | null;
  alertDays1: number;
  alertDays2: number;
  alertDays3: number;
  isRenewable: boolean;
  hasExpiry: boolean;
  issuingBody: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DriverComplianceTypeCreationAttributes extends Optional<
  DriverComplianceTypeAttributes,
  | 'id'
  | 'category'
  | 'description'
  | 'alertDays1'
  | 'alertDays2'
  | 'alertDays3'
  | 'isRenewable'
  | 'hasExpiry'
  | 'issuingBody'
  | 'isActive'
  | 'sortOrder'
> {}

class DriverComplianceType
  extends Model<DriverComplianceTypeAttributes, DriverComplianceTypeCreationAttributes>
  implements DriverComplianceTypeAttributes
{
  declare id: number;
  declare name: string;
  declare label: string;
  declare category: 'license' | 'medical' | 'training' | 'other';
  declare description: string | null;
  declare alertDays1: number;
  declare alertDays2: number;
  declare alertDays3: number;
  declare isRenewable: boolean;
  declare hasExpiry: boolean;
  declare issuingBody: string | null;
  declare isActive: boolean;
  declare sortOrder: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

DriverComplianceType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'other',
      validate: {
        isIn: [['license', 'medical', 'training', 'other']],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    alertDays1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
      field: 'alert_days_1',
    },
    alertDays2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      field: 'alert_days_2',
    },
    alertDays3: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15,
      field: 'alert_days_3',
    },
    isRenewable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    hasExpiry: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    issuingBody: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'driver_compliance_types',
    timestamps: true,
  }
);

export default DriverComplianceType;
