// =============================================================================
// EDG System Service - Router Aggregatore
// =============================================================================
import { Router } from 'express';

// Primitive
import repartiRoutes from './repartiRoutes';

// Anagrafiche
import operatoriRoutes from './operatoriRoutes';
import anagraficheRoutes from './anagraficheRoutes';

const router = Router();

// Primitive
router.use('/reparti', repartiRoutes);

// Anagrafiche
router.use('/operatori', operatoriRoutes);
router.use('/anagrafiche', anagraficheRoutes);

export default router;
