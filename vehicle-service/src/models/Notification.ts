import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type NotificationType = 'deadline' | 'maintenance' | 'km_threshold' | 'driver_compliance' | 'system';
export type NotificationSeverity = 'info' | 'warning' | 'critical';
export type NotificationEntityType = 'vehicle_deadline' | 'maintenance_schedule' | 'driver_compliance' | 'km_threshold' | 'system';

interface NotificationAttributes {
  id: number;
  vehicleId: number | null;
  driverId: number | null;
  entityType: NotificationEntityType;
  entityId: number | null;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  isRead: boolean;
  isArchived: boolean;
  readAt: Date | null;
  emailSent: boolean;
  emailSentAt: Date | null;
  createdAt?: Date;
}

interface NotificationCreationAttributes
  extends Optional<NotificationAttributes, 'id' | 'vehicleId' | 'driverId' | 'entityId' | 'type' | 'severity' | 'isRead' | 'isArchived' | 'readAt' | 'emailSent' | 'emailSentAt'> {}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  declare id: number;
  declare vehicleId: number | null;
  declare driverId: number | null;
  declare entityType: NotificationEntityType;
  declare entityId: number | null;
  declare type: NotificationType;
  declare severity: NotificationSeverity;
  declare title: string;
  declare message: string;
  declare isRead: boolean;
  declare isArchived: boolean;
  declare readAt: Date | null;
  declare emailSent: boolean;
  declare emailSentAt: Date | null;
  declare createdAt: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'vehicles', key: 'id' },
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'drivers', key: 'id' },
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['vehicle_deadline', 'maintenance_schedule', 'driver_compliance', 'km_threshold', 'system']],
      },
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'deadline',
      validate: {
        isIn: [['deadline', 'maintenance', 'km_threshold', 'driver_compliance', 'system']],
      },
    },
    severity: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'warning',
      validate: {
        isIn: [['info', 'warning', 'critical']],
      },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    updatedAt: false,
  }
);

export default Notification;
