import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type FuelType = 'diesel' | 'petrol' | 'electric' | 'hybrid' | 'lpg' | 'cng' | 'other';
export type VehicleStatus = 'active' | 'maintenance' | 'inactive' | 'decommissioned';
export type OwnershipType = 'owned' | 'leased' | 'rented';

interface VehicleAttributes {
  id: number;
  categoryId: number;
  telematicsProviderId: number | null;
  telematicsVehicleId: string | null;
  hasPlate: boolean;
  plate: string | null;
  vin: string | null;
  internalCode: string | null;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  fuelType: FuelType;
  emissionClass: string | null;
  currentKm: number;
  telematicsEnabled: boolean;
  status: VehicleStatus;
  ownershipType: OwnershipType;
  acquisitionDate: Date | null;
  decommissionDate: Date | null;
  photoPath: string | null;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VehicleCreationAttributes
  extends Optional<VehicleAttributes, 'id' | 'telematicsProviderId' | 'telematicsVehicleId' | 'hasPlate' | 'plate' | 'vin' | 'internalCode' | 'year' | 'color' | 'fuelType' | 'emissionClass' | 'currentKm' | 'telematicsEnabled' | 'status' | 'ownershipType' | 'acquisitionDate' | 'decommissionDate' | 'photoPath' | 'notes'> {}

class Vehicle
  extends Model<VehicleAttributes, VehicleCreationAttributes>
  implements VehicleAttributes
{
  declare id: number;
  declare categoryId: number;
  declare telematicsProviderId: number | null;
  declare telematicsVehicleId: string | null;
  declare hasPlate: boolean;
  declare plate: string | null;
  declare vin: string | null;
  declare internalCode: string | null;
  declare brand: string;
  declare model: string;
  declare year: number | null;
  declare color: string | null;
  declare fuelType: FuelType;
  declare emissionClass: string | null;
  declare currentKm: number;
  declare telematicsEnabled: boolean;
  declare status: VehicleStatus;
  declare ownershipType: OwnershipType;
  declare acquisitionDate: Date | null;
  declare decommissionDate: Date | null;
  declare photoPath: string | null;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Vehicle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'vehicle_categories', key: 'id' },
    },
    telematicsProviderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'telematics_providers', key: 'id' },
    },
    telematicsVehicleId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    hasPlate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    plate: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    vin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    internalCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    year: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    fuelType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'diesel',
      validate: {
        isIn: [['diesel', 'petrol', 'electric', 'hybrid', 'lpg', 'cng', 'other']],
      },
    },
    emissionClass: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    currentKm: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    telematicsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'maintenance', 'inactive', 'decommissioned']],
      },
    },
    ownershipType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'owned',
      validate: {
        isIn: [['owned', 'leased', 'rented']],
      },
    },
    acquisitionDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    decommissionDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    photoPath: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'vehicles',
    timestamps: true,
    validate: {
      plateConsistency(this: { hasPlate: boolean; plate: string | null }) {
        if (this.hasPlate && !this.plate) {
          throw new Error('La targa è obbligatoria per mezzi con targa');
        }
      },
    },
  }
);

export default Vehicle;
