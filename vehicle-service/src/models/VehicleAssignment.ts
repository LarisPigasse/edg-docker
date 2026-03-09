import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface VehicleAssignmentAttributes {
  id: number;
  vehicleId: number;
  driverId: number;
  startedAt: Date;
  endedAt: Date | null;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VehicleAssignmentCreationAttributes
  extends Optional<VehicleAssignmentAttributes, 'id' | 'endedAt' | 'notes'> {}

class VehicleAssignment
  extends Model<VehicleAssignmentAttributes, VehicleAssignmentCreationAttributes>
  implements VehicleAssignmentAttributes
{
  declare id: number;
  declare vehicleId: number;
  declare driverId: number;
  declare startedAt: Date;
  declare endedAt: Date | null;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  get isActive(): boolean {
    return this.endedAt === null;
  }
}

VehicleAssignment.init(
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
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'drivers', key: 'id' },
    },
    startedAt: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endedAt: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'vehicle_assignments',
    timestamps: true,
    validate: {
      datesConsistency(this: { endedAt: Date | null; startedAt: Date }) {
        if (this.endedAt && this.endedAt < this.startedAt) {
          throw new Error('La data di fine non può essere precedente alla data di inizio');
        }
      },
    },
  }
);

export default VehicleAssignment;
