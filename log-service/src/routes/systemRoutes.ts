// src/routes/systemRoutes.ts
import express from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { getSystemHealth, checkSystemHealthNow } from '../controllers/systemController';

const router = express.Router();

/**
 * GET /api/system/health
 * Stato di salute aggregato dell'infrastruttura (tab "Salute del Sistema"
 * della pagina SISTEMA > Info). Prima era lettura pubblica con il commento
 * "il controllo di accesso (solo root) e' gestito dal frontend" — il
 * controllo va sempre fatto anche lato server (difesa in profondita', stesso
 * principio gia' applicato altrove, es. AccountController).
 */
router.get('/health', requireAuth, requirePermission('sistema', 'info'), getSystemHealth);

/** POST /api/system/health — esegue subito un giro di controlli (ADR038) */
router.post('/health', requireAuth, requirePermission('sistema', 'info'), checkSystemHealthNow);

export default router;
