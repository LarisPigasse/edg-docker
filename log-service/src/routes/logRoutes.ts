// src/routes/logRoutes.ts
import express from "express";
import { apiKeyAuth } from "../middleware/authMiddleware";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import * as logController from "../controllers/logController";
import * as usoController from "../controllers/usoController";

const router = express.Router();

// POST /azione: scrittura da servizio a servizio (auth-service,
// vehicle-service, system-service, ...) — protetta da API key, non da un
// utente autenticato via gateway.
router.post("/azione", apiKeyAuth, logController.creaLog);

// Lettura per il frontend (pagina SISTEMA > Logs): utente autenticato via
// gateway con permesso 'sistema.logs'.
router.get("/azioni", requireAuth, requirePermission('sistema', 'logs'), logController.cercaLogs);
router.get("/azioni/:id", requireAuth, requirePermission('sistema', 'logs'), logController.getLog);
router.get("/transazioni/:transazioneId", apiKeyAuth, logController.getTransazione);
router.get("/statistiche", requireAuth, requirePermission('sistema', 'logs'), logController.getStatistiche);
router.get("/utenti", requireAuth, requirePermission('sistema', 'logs'), logController.getUtenti); // Utenti distinti presenti nei log

// Uso della piattaforma per tenant (fase 2, ADR117): stesso permesso dei log
router.get("/uso", requireAuth, requirePermission('sistema', 'logs'), usoController.usoTenant);
router.get("/uso/tenant", requireAuth, requirePermission('sistema', 'logs'), usoController.usoDeiTenant);

export default router;
