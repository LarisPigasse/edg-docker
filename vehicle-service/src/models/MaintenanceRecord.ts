import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface MaintenanceRecordAttributes {
  id: number;
  vehicleId: number;
  maintenanceTypeId: number;
  scheduleId: number | null;
  workshopId: number | null;
  performedAt: Date;
  kmAtService: number | null;
  cost: number | null;
  description: string | null;
  nextKm: number | null;
  nextDate: Date | null;
  notes: string | null;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MaintenanceRecordCreationAttributes
  extends Optional<MaintenanceRecordAttributes, 'id' | 'scheduleId' | 'workshopId' | 'kmAtService' | 'cost' | 'description' | 'nextKm' | 'nextDate' | 'notes'> {}

class MaintenanceRecord
  extends Model<MaintenanceRecordAttributes, MaintenanceRecordCreationAttributes>
  implements MaintenanceRecordAttributes
{
  declare id: number;
  declare vehicleId: number;
  declare maintenanceTypeId: number;
  declare scheduleId: number | null;
  declare workshopId: number | null;
  declare performedAt: Date;
  declare kmAtService: number | null;
  declare cost: number | null;
  declare description: string | null;
  declare nextKm: number | null;
  declare nextDate: Date | null;
  declare notes: string | null;
  declare createdBy: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

MaintenanceRecord.init(
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
    maintenanceTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'maintenance_types', key: 'id' },
    },
    scheduleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'maintenance_schedules', key: 'id' },
    },
    workshopId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'workshops', key: 'id' },
    },
    performedAt: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    kmAtService: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 0 },
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nextKm: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    nextDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // FK logica verso auth-service
    },
  },
  {
    sequelize,
    tableName: 'maintenance_records',
    timestamps: true,
  }
);

export default MaintenanceRecord;
