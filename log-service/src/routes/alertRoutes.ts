// src/routes/alertRoutes.ts
import express from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as alertController from '../controllers/alertController';

const router = express.Router();

// Gestione regole di alerting e storico per il frontend (pagina
// SISTEMA > Info, tab Alert): utente autenticato via gateway con permesso
// 'sistema.alert' — stesso schema gia' applicato a logRoutes.ts
// ('sistema.logs') e systemRoutes.ts ('sistema.info'). In precedenza le
// GET non avevano alcuna autenticazione e le scritture erano protette da
// apiKeyAuth, pensata per chiamate servizio-servizio: queste route sono
// pero' chiamate solo dal frontend tramite il gateway (vedi
// pro-frontend/src/features/system/api/alertsApi.ts), quindi il modello
// corretto e' requireAuth + requirePermission, non apiKeyAuth.

// ========== ALERT RULES ==========

router.get('/rules',              requireAuth, requirePermission('sistema', 'alert'), alertController.getRules);
router.get('/rules/:id',          requireAuth, requirePermission('sistema', 'alert'), alertController.getRule);
router.post('/rules',             requireAuth, requirePermission('sistema', 'alert'), alertController.createRule);
router.put('/rules/:id',          requireAuth, requirePermission('sistema', 'alert'), alertController.updateRule);
router.patch('/rules/:id/toggle', requireAuth, requirePermission('sistema', 'alert'), alertController.toggleRule);
router.delete('/rules/:id',       requireAuth, requirePermission('sistema', 'alert'), alertController.deleteRule);

// ========== ALERT HISTORY ==========

router.get('/history',       requireAuth, requirePermission('sistema', 'alert'), alertController.getHistory);
router.get('/history/stats', requireAuth, requirePermission('sistema', 'alert'), alertController.getHistoryStats);

export default router;
