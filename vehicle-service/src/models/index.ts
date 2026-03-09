// =============================================================================
// MODELS INDEX — Export e Associazioni
// Importare sempre da questo file, mai direttamente dai singoli modelli
// =============================================================================

import VehicleCategory from './VehicleCategory';
import TelematicsProvider from './TelematicsProvider';
import Workshop from './Workshop';
import DeadlineType from './DeadlineType';
import MaintenanceType from './MaintenanceType';
import DriverComplianceType from './DriverComplianceType';
import Vehicle from './Vehicle';
import Driver from './Driver';
import KmReading from './KmReading';
import VehicleDeadline from './VehicleDeadline';
import MaintenanceSchedule from './MaintenanceSchedule';
import MaintenanceRecord from './MaintenanceRecord';
import VehicleAssignment from './VehicleAssignment';
import DriverCompliance from './DriverCompliance';
import Notification from './Notification';
import Attachment from './Attachment';

// =============================================================================
// ASSOCIAZIONI
// =============================================================================

// --- Vehicle ↔ VehicleCategory ---
Vehicle.belongsTo(VehicleCategory, {
  foreignKey: 'categoryId',
  as: 'category',
});
VehicleCategory.hasMany(Vehicle, {
  foreignKey: 'categoryId',
  as: 'vehicles',
});

// --- Vehicle ↔ TelematicsProvider ---
Vehicle.belongsTo(TelematicsProvider, {
  foreignKey: 'telematicsProviderId',
  as: 'telematicsProvider',
});
TelematicsProvider.hasMany(Vehicle, {
  foreignKey: 'telematicsProviderId',
  as: 'vehicles',
});

// --- Vehicle ↔ KmReading ---
Vehicle.hasMany(KmReading, {
  foreignKey: 'vehicleId',
  as: 'kmReadings',
  onDelete: 'CASCADE',
});
KmReading.belongsTo(Vehicle, {
  foreignKey: 'vehicleId',
  as: 'vehicle',
});

// --- Vehicle ↔ VehicleDeadline ---
Vehicle.hasMany(VehicleDeadline, {
  foreignKey: 'vehicleId',
  as: 'deadlines',
  onDelete: 'CASCADE',
});
VehicleDeadline.belongsTo(Vehicle, {
  foreignKey: 'vehicleId',
  as: 'vehicle',
});
VehicleDeadline.belongsTo(DeadlineType, {
  foreignKey: 'deadlineTypeId',
  as: 'deadlineType',
});
DeadlineType.hasMany(VehicleDeadline, {
  foreignKey: 'deadlineTypeId',
  as: 'vehicleDeadlines',
});

// --- Vehicle ↔ MaintenanceSchedule ---
Vehicle.hasMany(MaintenanceSchedule, {
  foreignKey: 'vehicleId',
  as: 'maintenanceSchedules',
  onDelete: 'CASCADE',
});
MaintenanceSchedule.belongsTo(Vehicle, {
  foreignKey: 'vehicleId',
  as: 'vehicle',
});
MaintenanceSchedule.belongsTo(MaintenanceType, {
  foreignKey: 'maintenanceTypeId',
  as: 'maintenanceType',
});
MaintenanceType.hasMany(MaintenanceSchedule, {
  foreignKey: 'maintenanceTypeId',
  as: 'schedules',
});

// --- Vehicle ↔ MaintenanceRecord ---
Vehicle.hasMany(MaintenanceRecord, {
  foreignKey: 'vehicleId',
  as: 'maintenanceRecords',
});
MaintenanceRecord.belongsTo(Vehicle, {
  foreignKey: 'vehicleId',
  as: 'vehicle',
});
MaintenanceRecord.belongsTo(MaintenanceType, {
  foreignKey: 'maintenanceTypeId',
  as: 'maintenanceType',
});
MaintenanceRecord.belongsTo(MaintenanceSchedule, {
  foreignKey: 'scheduleId',
  as: 'schedule',
});
MaintenanceRecord.belongsTo(Workshop, {
  foreignKey: 'workshopId',
  as: 'workshop',
});

// --- Vehicle ↔ Driver (via VehicleAssignment) ---
Vehicle.hasMany(VehicleAssignment, {
  foreignKey: 'vehicleId',
  as: 'assignments',
  onDelete: 'CASCADE',
});
VehicleAssignment.belongsTo(Vehicle, {
  foreignKey: 'vehicleId',
  as: 'vehicle',
});
VehicleAssignment.belongsTo(Driver, {
  foreignKey: 'driverId',
  as: 'driver',
});
Driver.hasMany(VehicleAssignment, {
  foreignKey: 'driverId',
  as: 'assignments',
});

// --- Driver ↔ DriverCompliance ---
Driver.hasMany(DriverCompliance, {
  foreignKey: 'driverId',
  as: 'compliances',
  onDelete: 'CASCADE',
});
DriverCompliance.belongsTo(Driver, {
  foreignKey: 'driverId',
  as: 'driver',
});
DriverCompliance.belongsTo(DriverComplianceType, {
  foreignKey: 'typeId',
  as: 'complianceType',
});
DriverComplianceType.hasMany(DriverCompliance, {
  foreignKey: 'typeId',
  as: 'driverCompliances',
});

// --- Notification ↔ Vehicle / Driver ---
Notification.belongsTo(Vehicle, {
  foreignKey: 'vehicleId',
  as: 'vehicle',
});
Notification.belongsTo(Driver, {
  foreignKey: 'driverId',
  as: 'driver',
});

// =============================================================================
// EXPORT
// =============================================================================

export {
  // Lookup
  VehicleCategory,
  TelematicsProvider,
  Workshop,
  DeadlineType,
  MaintenanceType,
  DriverComplianceType,
  // Core
  Vehicle,
  Driver,
  // Operative
  KmReading,
  VehicleDeadline,
  MaintenanceSchedule,
  MaintenanceRecord,
  VehicleAssignment,
  DriverCompliance,
  // Trasversali
  Notification,
  Attachment,
};
