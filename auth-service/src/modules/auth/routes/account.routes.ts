// src/modules/auth/routes/account.routes.ts
import { Router } from 'express';
import { AccountController } from '../controllers/AccountController';
import { authenticate } from '../middleware/authMiddleware';
import { requirePermission, requireRoot } from '../middleware/permissionMiddleware';
import { requireSystemTenant } from '../middleware/tenantMiddleware';
import { validateBody, validateParams, commonSchemas } from '../middleware/validate';
import { accountSchemas } from '../schemas/accountSchemas';
import { roleSchemas } from '../schemas/roleSchemas';

/**
 * Gestione account (menu "SISTEMA" su pro-frontend) — ADR049.
 *
 *   Tutte le rotte: account del tenant di sistema (requireSystemTenant), perche'
 *   i ruoli sono globali e un admin esiste anche nei tenant dei clienti.
 *   Permesso 'sistema.account' (admin e root) per lettura, creazione, modifica,
 *   attiva/disattiva. Solo root: eliminazione definitiva e permessi dei ruoli.
 *   I limiti dell'admin (mai root, mai il proprio ruolo) stanno nel controller.
 *
 * NOTA: questa route factory va chiamata DOPO l'inizializzazione dei modelli
 * (vedi app.ts). Il router nasce qui dentro, non a livello di modulo.
 */
export const createAccountRouter = (
  Account: any,
  Role: any,
  Session?: any,
  Tenant?: any,
  RolePermission?: any
): Router => {
  const router = Router();
  const accountController = new AccountController(Account, Role, Session, Tenant, RolePermission);
  const canManageAccounts = requirePermission('sistema', 'account');

  router.use(authenticate, requireSystemTenant(Tenant));

  // GET /auth/accounts/roles - Ruoli assegnabili (senza root per chi non e' root)
  router.get('/roles', canManageAccounts, accountController.getRoles.bind(accountController));

  // PUT /auth/accounts/roles/:id/permissions - Permessi di un ruolo (solo root)
  router.put(
    '/roles/:id/permissions',
    requireRoot(),
    validateParams(commonSchemas.intParam),
    validateBody(roleSchemas.updatePermissions),
    accountController.updateRolePermissions.bind(accountController)
  );

  // GET /auth/accounts/stats - Statistiche overview
  router.get('/stats', canManageAccounts, accountController.getAccountStats.bind(accountController));

  // GET /auth/accounts - Lista paginata con filtri
  router.get('/', canManageAccounts, accountController.listAccounts.bind(accountController));

  // POST /auth/accounts - Crea un nuovo account
  router.post(
    '/',
    canManageAccounts,
    validateBody(accountSchemas.create),
    accountController.createAccount.bind(accountController)
  );

  // GET /auth/accounts/:id - Dettaglio singolo
  router.get(
    '/:id',
    canManageAccounts,
    validateParams(commonSchemas.intParam),
    accountController.getAccountById.bind(accountController)
  );

  // PUT /auth/accounts/:id - Aggiorna account (anagrafica, ruolo, tenant, password)
  router.put(
    '/:id',
    canManageAccounts,
    validateParams(commonSchemas.intParam),
    validateBody(accountSchemas.update),
    accountController.updateAccount.bind(accountController)
  );

  // PATCH /auth/accounts/:id/toggle - Attiva/disattiva
  router.patch(
    '/:id/toggle',
    canManageAccounts,
    validateParams(commonSchemas.intParam),
    accountController.toggleActive.bind(accountController)
  );

  // DELETE /auth/accounts/:id/hard - Eliminazione fisica (solo root, solo se mai collegato a un'entita')
  router.delete(
    '/:id/hard',
    requireRoot(),
    validateParams(commonSchemas.intParam),
    accountController.hardDeleteAccount.bind(accountController)
  );

  // DELETE /auth/accounts/:id - Soft delete (isActive = false)
  router.delete(
    '/:id',
    canManageAccounts,
    validateParams(commonSchemas.intParam),
    accountController.deleteAccount.bind(accountController)
  );

  // POST /auth/accounts/:id/activate - Riattiva account
  router.post(
    '/:id/activate',
    canManageAccounts,
    validateParams(commonSchemas.intParam),
    accountController.activateAccount.bind(accountController)
  );

  return router;
};

export default createAccountRouter;
