// =============================================================================
// EDG System Service - Router Aggregatore
// =============================================================================
import { Router } from 'express';

// Primitive
import repartiRoutes from './repartiRoutes';
import settoriRoutes from './settoriRoutes';

// Anagrafiche
import operatoriRoutes from './operatoriRoutes';
import anagraficheRoutes from './anagraficheRoutes';

const router = Router();

// Primitive
router.use('/reparti', repartiRoutes);
router.use('/settori', settoriRoutes);

// Anagrafiche
router.use('/operatori', operatoriRoutes);
router.use('/anagrafiche', anagraficheRoutes);

export default router;
