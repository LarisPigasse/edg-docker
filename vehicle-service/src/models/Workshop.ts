import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface WorkshopAttributes {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WorkshopCreationAttributes
  extends Optional<WorkshopAttributes, 'id' | 'address' | 'city' | 'postalCode' | 'phone' | 'email' | 'specialization' | 'notes' | 'isActive'> {}

class Workshop
  extends Model<WorkshopAttributes, WorkshopCreationAttributes>
  implements WorkshopAttributes
{
  declare id: number;
  declare name: string;
  declare address: string | null;
  declare city: string | null;
  declare postalCode: string | null;
  declare phone: string | null;
  declare email: string | null;
  declare specialization: string | null;
  declare notes: string | null;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Workshop.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: true,
      validate: { isEmail: true },
    },
    specialization: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'workshops',
    timestamps: true,
  }
);

export default Workshop;
