// =============================================================================
// EDG Vehicle Service - Router Aggregatore
// =============================================================================
import { Router } from 'express';

// Lookup tables
import vehicleCategoryRoutes from './vehicleCategoryRoutes';
import telematicsProviderRoutes from './telematicsProviderRoutes';
import workshopRoutes from './workshopRoutes';
import deadlineTypeRoutes from './deadlineTypeRoutes';
import maintenanceTypeRoutes from './maintenanceTypeRoutes';
import driverComplianceTypeRoutes from './driverComplianceTypeRoutes';

// Core
import vehicleRoutes from './vehicleRoutes';
import driverRoutes from './driverRoutes';

// Operative (prossimi step)
// import kmReadingRoutes         from './kmReadingRoutes';
// import vehicleDeadlineRoutes   from './vehicleDeadlineRoutes';
// import maintenanceRecordRoutes from './maintenanceRecordRoutes';
// import vehicleAssignmentRoutes from './vehicleAssignmentRoutes';
// import driverComplianceRoutes  from './driverComplianceRoutes';

// Transversali (prossimi step)
// import notificationRoutes from './notificationRoutes';
// import attachmentRoutes   from './attachmentRoutes';

const router = Router();

// Lookup
router.use('/categories', vehicleCategoryRoutes);
router.use('/telematics-providers', telematicsProviderRoutes);
router.use('/workshops', workshopRoutes);
router.use('/deadline-types', deadlineTypeRoutes);
router.use('/maintenance-types', maintenanceTypeRoutes);
router.use('/driver-compliance-types', driverComplianceTypeRoutes);

// Core
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);

export default router;
