import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type DeadlineType from './DeadlineType';
import type Vehicle from './Vehicle';

export type DeadlineStatus = 'valid' | 'expiring' | 'expired';

interface VehicleDeadlineAttributes {
  id: number;
  vehicleId: number;
  deadlineTypeId: number;
  expiryDate: Date;
  lastRenewalDate: Date | null;
  status: DeadlineStatus;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VehicleDeadlineCreationAttributes extends Optional<
  VehicleDeadlineAttributes,
  'id' | 'lastRenewalDate' | 'status' | 'notes'
> {}

class VehicleDeadline
  extends Model<VehicleDeadlineAttributes, VehicleDeadlineCreationAttributes>
  implements VehicleDeadlineAttributes
{
  declare id: number;
  declare vehicleId: number;
  declare deadlineTypeId: number;
  declare expiryDate: Date;
  declare lastRenewalDate: Date | null;
  declare status: DeadlineStatus;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Associations (populated by include)
  declare deadlineType?: DeadlineType;
  declare vehicle?: Vehicle;
}

VehicleDeadline.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'vehicles', key: 'id' },
    },
    deadlineTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'deadline_types', key: 'id' },
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    lastRenewalDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'valid',
      validate: {
        isIn: [['valid', 'expiring', 'expired']],
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'vehicle_deadlines',
    timestamps: true,
    indexes: [{ unique: true, fields: ['vehicle_id', 'deadline_type_id'] }],
  }
);

export default VehicleDeadline;
