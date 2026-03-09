import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type AttachmentEntityType =
  | 'vehicle'
  | 'driver'
  | 'vehicle_deadline'
  | 'maintenance_record'
  | 'driver_compliance';

interface AttachmentAttributes {
  id: number;
  entityType: AttachmentEntityType;
  entityId: number;
  filename: string;
  filepath: string;
  filesize: number;
  mimetype: string;
  description: string | null;
  uploadedBy: number;
  createdAt?: Date;
}

interface AttachmentCreationAttributes
  extends Optional<AttachmentAttributes, 'id' | 'description'> {}

class Attachment
  extends Model<AttachmentAttributes, AttachmentCreationAttributes>
  implements AttachmentAttributes
{
  declare id: number;
  declare entityType: AttachmentEntityType;
  declare entityId: number;
  declare filename: string;
  declare filepath: string;
  declare filesize: number;
  declare mimetype: string;
  declare description: string | null;
  declare uploadedBy: number;
  declare createdAt: Date;
}

Attachment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['vehicle', 'driver', 'vehicle_deadline', 'maintenance_record', 'driver_compliance']],
      },
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    filename: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    filepath: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    filesize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    mimetype: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // FK logica verso auth-service
    },
  },
  {
    sequelize,
    tableName: 'attachments',
    timestamps: true,
    updatedAt: false,
  }
);

export default Attachment;
