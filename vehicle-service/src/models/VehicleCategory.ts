import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface VehicleCategoryAttributes {
  id: number;
  name: string;
  label: string;
  description: string | null;
  requiresPlate: boolean;
  requiresTachograph: boolean;
  regulationType: 'highway_code' | 'dlgs_81_08' | 'both';
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VehicleCategoryCreationAttributes
  extends Optional<VehicleCategoryAttributes, 'id' | 'description' | 'requiresPlate' | 'requiresTachograph' | 'regulationType' | 'isActive' | 'sortOrder'> {}

class VehicleCategory
  extends Model<VehicleCategoryAttributes, VehicleCategoryCreationAttributes>
  implements VehicleCategoryAttributes
{
  declare id: number;
  declare name: string;
  declare label: string;
  declare description: string | null;
  declare requiresPlate: boolean;
  declare requiresTachograph: boolean;
  declare regulationType: 'highway_code' | 'dlgs_81_08' | 'both';
  declare isActive: boolean;
  declare sortOrder: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

VehicleCategory.init(
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
    requiresPlate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    requiresTachograph: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    regulationType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'highway_code',
      validate: {
        isIn: [['highway_code', 'dlgs_81_08', 'both']],
      },
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
    tableName: 'vehicle_categories',
    timestamps: true,
  }
);

export default VehicleCategory;
