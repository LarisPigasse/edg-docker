// =============================================================================
// Rotte di Vigilo, montate su /api/vigilo
// =============================================================================
// Ogni area (dominio) porta le sue rotte; qui solo l'ordine e i controlli
// comuni: richiesta dal gateway con utente valido e tenant (ADR068). Il
// modulo 'vigilo' in vigore lo verifica gia' il gateway (ADR060).
// =============================================================================
import { Router } from 'express';
import './modelli'; // modelli e associazioni prima delle rotte
import { requireAuth, requireTenant } from '../core/middleware/auth';
import { ioRoutes } from './io/io.routes';
import { diagnosticaRoutes } from './diagnostica/diagnostica.routes';

const router = Router();

router.use(requireAuth, requireTenant);
router.use(ioRoutes);
router.use(diagnosticaRoutes);

export default router;
