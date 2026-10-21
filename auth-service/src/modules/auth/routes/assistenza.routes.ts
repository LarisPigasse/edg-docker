// src/modules/auth/routes/assistenza.routes.ts
// =============================================================================
// Accesso assistito (ADR085) — montato su /auth/assistenza
// =============================================================================
//   POST   /scambio   pubblica: il codice monouso e' la credenziale
//   POST   /fine      token assistito: esce dalla sessione
//   GET    /          personale EDG con 'sistema.assistenza': elenco
//   POST   /          personale EDG con 'sistema.assistenza': apre e dà il codice
//   DELETE /:id       personale EDG con 'sistema.assistenza': chiude una sessione
// Nel gateway '/assistenza' e' protetta, salvo '/assistenza/scambio'.
// =============================================================================
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AssistenzaController } from '../controllers/AssistenzaController';
import { authenticate } from '../middleware/authMiddleware';
import { requirePermission } from '../middleware/permissionMiddleware';
import { requireSystemTenant } from '../middleware/tenantMiddleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { assistenzaSchemas } from '../schemas/assistenzaSchemas';

// Scambio: 16 tentativi ogni 16 minuti per IP (il codice ha 256 bit, il
// limite serve a non lasciar provare all'infinito)
const scambioLimiter = rateLimit({
  windowMs: 16 * 60 * 1000,
  max: 16,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => `assistenza:${req.ip}`,
  message: { success: false, error: 'Troppi tentativi: riprova tra qualche minuto' },
});

export const createAssistenzaRouter = (controller: AssistenzaController, tenantModel: any): Router => {
  const router = Router();

  router.post('/scambio', scambioLimiter, validateBody(assistenzaSchemas.scambio), controller.scambia);
  router.post('/fine', authenticate, controller.esci);

  const personaleEdg = [authenticate, requireSystemTenant(tenantModel), requirePermission('sistema', 'assistenza')];
  router.get('/', ...personaleEdg, validateQuery(assistenzaSchemas.elenco), controller.elenco);
  router.post('/', ...personaleEdg, validateBody(assistenzaSchemas.apri), controller.apri);
  router.delete('/:id', ...personaleEdg, validateParams(assistenzaSchemas.idParam), controller.chiudi);

  return router;
};

export default createAssistenzaRouter;
