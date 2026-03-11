import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface DeadlineTypeAttributes {
  id: number;
  name: string;
  label: string;
  description: string | null;
  appliesToCategories: number[] | null;
  alertDays1: number;
  alertDays2: number;
  alertDays3: number;
  isRecurring: boolean;
  recurrenceMonths: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DeadlineTypeCreationAttributes extends Optional<
  DeadlineTypeAttributes,
  | 'id'
  | 'description'
  | 'appliesToCategories'
  | 'alertDays1'
  | 'alertDays2'
  | 'alertDays3'
  | 'isRecurring'
  | 'recurrenceMonths'
  | 'isActive'
  | 'sortOrder'
> {}

class DeadlineType extends Model<DeadlineTypeAttributes, DeadlineTypeCreationAttributes> implements DeadlineTypeAttributes {
  declare id: number;
  declare name: string;
  declare label: string;
  declare description: string | null;
  declare appliesToCategories: number[] | null;
  declare alertDays1: number;
  declare alertDays2: number;
  declare alertDays3: number;
  declare isRecurring: boolean;
  declare recurrenceMonths: number | null;
  declare isActive: boolean;
  declare sortOrder: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

DeadlineType.init(
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
    alertDays1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      field: 'alert_days_1',
    },
    alertDays2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15,
      field: 'alert_days_2',
    },
    alertDays3: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
      field: 'alert_days_3',
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    recurrenceMonths: {
      type: DataTypes.INTEGER,
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
    tableName: 'deadline_types',
    timestamps: true,
  }
);

export default DeadlineType;
