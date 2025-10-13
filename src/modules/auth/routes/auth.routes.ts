// src/modules/auth/routes/auth.routes.ts (con logging dettagliato)
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/authMiddleware';

/**
 * Crea router per modulo Auth
 */
export const createAuthRouter = (authController: AuthController): Router => {
  console.log('\n🔧 [AUTH.ROUTES] Creazione router auth...');

  const router = Router();
  console.log('   ✅ Router Express creato');

  // ============================================================================
  // ENDPOINT PUBBLICI (nessuna autenticazione richiesta)
  // ============================================================================

  console.log('   📝 Registrando endpoint pubblici...');

  router.post('/register', authController.register);
  console.log('      ✅ POST /register');

  router.post('/login', authController.login);
  console.log('      ✅ POST /login');

  router.post('/refresh', authController.refreshToken);
  console.log('      ✅ POST /refresh');

  router.post('/request-reset-password', authController.requestPasswordReset);
  console.log('      ✅ POST /request-reset-password');

  router.post('/reset-password', authController.confirmPasswordReset);
  console.log('      ✅ POST /reset-password');

  // ============================================================================
  // ENDPOINT PROTETTI - SELF-SERVICE (solo authenticate)
  // ============================================================================

  console.log('   📝 Registrando endpoint protetti...');

  router.post('/logout', authController.logout);
  console.log('      ✅ POST /logout');

  router.post('/logout-all', authenticate, authController.logoutAll);
  console.log('      ✅ POST /logout-all (+ authenticate)');

  router.post('/change-password', authenticate, authController.changePassword);
  console.log('      ✅ POST /change-password (+ authenticate)');

  router.get('/me', authenticate, authController.getCurrentAccount);
  console.log('      ✅ GET /me (+ authenticate)');

  // Debug finale
  const routeCount = (router as any).stack.length;
  console.log(`\n   📊 Totale route registrate nel router: ${routeCount}`);
  console.log('   ✅ [AUTH.ROUTES] Router completato\n');

  return router;
};
