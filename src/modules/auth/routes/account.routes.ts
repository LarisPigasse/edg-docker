// src/modules/auth/routes/account.routes.ts
import { Router } from 'express';
import { AccountController } from '../controllers/AccountController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRoot } from '../middleware/permissionMiddleware';

const router = Router();

/**
 * NOTA: Questa route factory deve essere chiamata DOPO l'inizializzazione
 * dei modelli, passando Account e Role al controller.
 *
 * Vedi app.ts per esempio di utilizzo.
 */
export const createAccountRouter = (Account: any, Role: any, Session?: any): Router => {
  const accountController = new AccountController(Account, Role, Session);

  // Tutte le route richiedono autenticazione + permesso root

  // GET /auth/accounts/roles - Lista tutti i ruoli disponibili
  router.get('/roles', authenticate, requireRoot(), accountController.getRoles.bind(accountController));

  // GET /auth/accounts/stats - Statistiche overview
  router.get('/stats', authenticate, requireRoot(), accountController.getAccountStats.bind(accountController));

  // GET /auth/accounts - Lista paginata con filtri
  router.get('/', authenticate, requireRoot(), accountController.listAccounts.bind(accountController));

  // GET /auth/accounts/:id - Dettaglio singolo
  router.get('/:id', authenticate, requireRoot(), accountController.getAccountById.bind(accountController));

  // PUT /auth/accounts/:id - Aggiorna account
  router.put('/:id', authenticate, requireRoot(), accountController.updateAccount.bind(accountController));

  // DELETE /auth/accounts/:id/hard - Eliminazione fisica (solo se mai loggato)
  router.delete('/:id/hard', authenticate, requireRoot(), accountController.hardDeleteAccount.bind(accountController));

  // DELETE /auth/accounts/:id - Soft delete (isActive = false)
  router.delete('/:id', authenticate, requireRoot(), accountController.deleteAccount.bind(accountController));

  // POST /auth/accounts/:id/activate - Riattiva account
  router.post('/:id/activate', authenticate, requireRoot(), accountController.activateAccount.bind(accountController));

  return router;
};

export default router;
