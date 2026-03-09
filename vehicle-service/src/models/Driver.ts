import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface DriverAttributes {
  id: number;
  authUserId: number | null;
  firstName: string;
  lastName: string;
  fiscalCode: string | null;
  birthDate: Date | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  hireDate: Date | null;
  terminationDate: Date | null;
  isActive: boolean;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DriverCreationAttributes
  extends Optional<DriverAttributes, 'id' | 'authUserId' | 'fiscalCode' | 'birthDate' | 'phone' | 'email' | 'address' | 'city' | 'hireDate' | 'terminationDate' | 'isActive' | 'notes'> {}

class Driver
  extends Model<DriverAttributes, DriverCreationAttributes>
  implements DriverAttributes
{
  declare id: number;
  declare authUserId: number | null;
  declare firstName: string;
  declare lastName: string;
  declare fiscalCode: string | null;
  declare birthDate: Date | null;
  declare phone: string | null;
  declare email: string | null;
  declare address: string | null;
  declare city: string | null;
  declare hireDate: Date | null;
  declare terminationDate: Date | null;
  declare isActive: boolean;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Computed helper
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

Driver.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    authUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // FK logica verso auth-service — non referenziale, gestita a livello applicativo
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fiscalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    birthDate: {
      type: DataTypes.DATEONLY,
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
    address: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    terminationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'drivers',
    timestamps: true,
  }
);

export default Driver;
