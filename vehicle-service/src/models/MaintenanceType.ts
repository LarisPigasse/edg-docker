import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface MaintenanceTypeAttributes {
  id: number;
  name: string;
  label: string;
  description: string | null;
  appliesToCategories: number[] | null;
  kmThreshold: number | null;
  daysThreshold: number | null;
  alertKmBefore: number | null;
  alertDays2: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
  alertDays1: number | null;
  alertDays3: number | null;
}

interface MaintenanceTypeCreationAttributes extends Optional<
  MaintenanceTypeAttributes,
  | 'id'
  | 'description'
  | 'appliesToCategories'
  | 'kmThreshold'
  | 'daysThreshold'
  | 'alertKmBefore'
  | 'alertDays2'
  | 'isActive'
  | 'sortOrder'
> {}

class MaintenanceType
  extends Model<MaintenanceTypeAttributes, MaintenanceTypeCreationAttributes>
  implements MaintenanceTypeAttributes
{
  declare id: number;
  declare name: string;
  declare label: string;
  declare description: string | null;
  declare appliesToCategories: number[] | null;
  declare kmThreshold: number | null;
  declare daysThreshold: number | null;
  declare alertKmBefore: number | null;
  declare alertDays2: number | null;
  declare isActive: boolean;
  declare sortOrder: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare alertDays1: number | null;
  declare alertDays3: number | null;
}

MaintenanceType.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    appliesToCategories: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
    },
    kmThreshold: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    daysThreshold: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    alertKmBefore: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    alertDays2: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'alert_days_2',
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
    alertDays1: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'alert_days_1',
    },
    alertDays3: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'alert_days_3',
    },
  },
  {
    sequelize,
    tableName: 'maintenance_types',
    timestamps: true,
    validate: {
      atLeastOneThreshold(this: { kmThreshold: number | null; daysThreshold: number | null }) {
        if (this.kmThreshold === null && this.daysThreshold === null) {
          throw new Error('Almeno una soglia (km o giorni) deve essere definita');
        }
      },
    },
  }
);

export default MaintenanceType;
