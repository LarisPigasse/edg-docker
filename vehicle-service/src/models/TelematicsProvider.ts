import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface TelematicsProviderAttributes {
  id: number;
  name: string;
  apiEndpoint: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  dataFormat: 'json' | 'xml';
  pollingMinutes: number;
  notes: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TelematicsProviderCreationAttributes
  extends Optional<TelematicsProviderAttributes, 'id' | 'apiEndpoint' | 'apiKey' | 'apiSecret' | 'dataFormat' | 'pollingMinutes' | 'notes' | 'isActive'> {}

class TelematicsProvider
  extends Model<TelematicsProviderAttributes, TelematicsProviderCreationAttributes>
  implements TelematicsProviderAttributes
{
  declare id: number;
  declare name: string;
  declare apiEndpoint: string | null;
  declare apiKey: string | null;
  declare apiSecret: string | null;
  declare dataFormat: 'json' | 'xml';
  declare pollingMinutes: number;
  declare notes: string | null;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

TelematicsProvider.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    apiEndpoint: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    apiKey: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    apiSecret: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    dataFormat: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'json',
      validate: {
        isIn: [['json', 'xml']],
      },
    },
    pollingMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
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
    tableName: 'telematics_providers',
    timestamps: true,
  }
);

export default TelematicsProvider;
