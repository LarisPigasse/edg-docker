// src/routes/alertRoutes.ts
import express from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as alertController from '../controllers/alertController';
import * as recipientController from '../controllers/recipientController';
import { sendDigest } from '../controllers/reportController';

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

// ========== TIPI DI EVENTO (ADR038) ==========

router.get('/event-types', requireAuth, requirePermission('sistema', 'alert'), alertController.getEventTypes);

// ========== ALERT RECIPIENTS (ADR038) ==========

router.get('/recipients',              requireAuth, requirePermission('sistema', 'alert'), recipientController.getRecipients);
router.post('/recipients',             requireAuth, requirePermission('sistema', 'alert'), recipientController.createRecipient);
router.put('/recipients/:id',          requireAuth, requirePermission('sistema', 'alert'), recipientController.updateRecipient);
router.patch('/recipients/:id/toggle', requireAuth, requirePermission('sistema', 'alert'), recipientController.toggleRecipient);
router.delete('/recipients/:id',       requireAuth, requirePermission('sistema', 'alert'), recipientController.deleteRecipient);

// ========== ALERT HISTORY ==========

router.get('/history',       requireAuth, requirePermission('sistema', 'alert'), alertController.getHistory);
router.get('/history/stats', requireAuth, requirePermission('sistema', 'alert'), alertController.getHistoryStats);

// Riepilogo giornaliero a richiesta (ADR046) — stesso permesso della scheda Salute
router.post('/digest', requireAuth, requirePermission('sistema', 'info'), sendDigest);

export default router;
