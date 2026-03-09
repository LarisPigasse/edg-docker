import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type ScheduleStatus = 'ok' | 'warning' | 'overdue';

interface MaintenanceScheduleAttributes {
  id: number;
  vehicleId: number;
  maintenanceTypeId: number;
  lastKm: number | null;
  lastDate: Date | null;
  nextKm: number | null;
  nextDate: Date | null;
  status: ScheduleStatus;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MaintenanceScheduleCreationAttributes
  extends Optional<MaintenanceScheduleAttributes, 'id' | 'lastKm' | 'lastDate' | 'nextKm' | 'nextDate' | 'status' | 'notes'> {}

class MaintenanceSchedule
  extends Model<MaintenanceScheduleAttributes, MaintenanceScheduleCreationAttributes>
  implements MaintenanceScheduleAttributes
{
  declare id: number;
  declare vehicleId: number;
  declare maintenanceTypeId: number;
  declare lastKm: number | null;
  declare lastDate: Date | null;
  declare nextKm: number | null;
  declare nextDate: Date | null;
  declare status: ScheduleStatus;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

MaintenanceSchedule.init(
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
    lastKm: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lastDate: {
      type: DataTypes.DATEONLY,
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
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'ok',
      validate: {
        isIn: [['ok', 'warning', 'overdue']],
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'maintenance_schedules',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['vehicle_id', 'maintenance_type_id'] },
    ],
  }
);

export default MaintenanceSchedule;
