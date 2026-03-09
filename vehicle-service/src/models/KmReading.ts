import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface KmReadingAttributes {
  id: number;
  vehicleId: number;
  readingValue: number;
  readingDate: Date;
  source: 'manual' | 'telematics_api';
  notes: string | null;
  createdAt?: Date;
}

interface KmReadingCreationAttributes
  extends Optional<KmReadingAttributes, 'id' | 'readingDate' | 'source' | 'notes'> {}

class KmReading
  extends Model<KmReadingAttributes, KmReadingCreationAttributes>
  implements KmReadingAttributes
{
  declare id: number;
  declare vehicleId: number;
  declare readingValue: number;
  declare readingDate: Date;
  declare source: 'manual' | 'telematics_api';
  declare notes: string | null;
  declare createdAt: Date;
}

KmReading.init(
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
    readingValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    readingDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    source: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'manual',
      validate: {
        isIn: [['manual', 'telematics_api']],
      },
    },
    notes: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'km_readings',
    timestamps: true,
    updatedAt: false, // Le letture non si modificano
  }
);

export default KmReading;
