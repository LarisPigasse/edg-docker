import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type DeliveryStatus = 'sent' | 'failed';

interface NotificationDeliveryLogAttributes {
  id: number;
  notificationId: number;
  recipientEmail: string;
  recipientName: string | null;
  status: DeliveryStatus;
  messageId: string | null;
  errorMessage: string | null;
  createdAt?: Date;
}

interface NotificationDeliveryLogCreationAttributes extends Optional<
  NotificationDeliveryLogAttributes,
  'id' | 'recipientName' | 'messageId' | 'errorMessage'
> {}

class NotificationDeliveryLog
  extends Model<NotificationDeliveryLogAttributes, NotificationDeliveryLogCreationAttributes>
  implements NotificationDeliveryLogAttributes
{
  declare id: number;
  declare notificationId: number;
  declare recipientEmail: string;
  declare recipientName: string | null;
  declare status: DeliveryStatus;
  declare messageId: string | null;
  declare errorMessage: string | null;
  declare createdAt: Date;
}

NotificationDeliveryLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    notificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'notifications', key: 'id' },
    },
    recipientEmail: { type: DataTypes.STRING(255), allowNull: false },
    recipientName: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { isIn: [['sent', 'failed']] },
    },
    messageId: { type: DataTypes.STRING(255), allowNull: true },
    errorMessage: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'notification_delivery_logs',
    timestamps: true,
    updatedAt: false,
  }
);

export default NotificationDeliveryLog;
