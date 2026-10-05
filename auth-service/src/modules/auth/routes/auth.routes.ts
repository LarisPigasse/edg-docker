// src/modules/auth/routes/auth.routes.ts (con rate limiting specifico)
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/AuthController';
import { SessionController } from '../controllers/SessionController';
import { authenticate } from '../middleware/authMiddleware';
import { requirePermission, requireRoot } from '../middleware/permissionMiddleware';
import { requireSystemTenant } from '../middleware/tenantMiddleware';

/**
 * Rate Limiters SPECIFICI per business logic
 * Questi sono SEMPRE attivi, sia in standalone che in gateway mode,
 * perché proteggono la logica di business, non il traffico generale.
 */

// Login: Max 5 tentativi per email in 15 minuti (anti brute-force)
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW || '15') * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || '5'),
  message: {
    success: false,
    error: 'Troppi tentativi di login',
    message: 'Hai superato il limite di tentativi di login. Riprova tra 15 minuti.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Key per email, non per IP (importante!)
  keyGenerator: req => {
    return `login:${req.body.email || req.ip}`;
  },
  skipSuccessfulRequests: true, // Non contare login riusciti
});

// Password Reset Request: Max 3 richieste per email in 60 minuti (anti spam)
const resetPasswordRequestLimiter = rateLimit({
  windowMs: parseInt(process.env.RESET_PASSWORD_RATE_LIMIT_WINDOW || '60') * 60 * 1000,
  max: parseInt(process.env.RESET_PASSWORD_RATE_LIMIT_MAX_ATTEMPTS || '3'),
  message: {
    success: false,
    error: 'Troppe richieste di reset password',
    message: 'Hai superato il limite di richieste. Riprova tra 1 ora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    return `reset:${req.body.email || req.ip}`;
  },
});

// Registration: Max 10 registrazioni per IP in 60 minuti (anti spam)
const registerLimiter = rateLimit({
  windowMs: parseInt(process.env.REGISTER_RATE_LIMIT_WINDOW || '60') * 60 * 1000,
  max: parseInt(process.env.REGISTER_RATE_LIMIT_MAX_ATTEMPTS || '10'),
  message: {
    success: false,
    error: 'Troppe registrazioni da questo IP',
    message: 'Hai superato il limite di registrazioni. Riprova tra 1 ora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    return `register:${req.ip}`;
  },
});

/**
 * Crea router per modulo Auth
 */
export const createAuthRouter = (
  authController: AuthController,
  sessionController: SessionController,
  tenantModel: any
): Router => {
  console.log('\n🔧 [AUTH.ROUTES] Creazione router auth...');

  const router = Router();
  console.log('   ✅ Router Express creato');

  // ============================================================================
  // ENDPOINT PUBBLICI (nessuna autenticazione richiesta)
  // ============================================================================

  console.log('   📝 Registrando endpoint pubblici...');

  // Register - con rate limiter per IP
  router.post('/register', registerLimiter, authController.register);
  console.log('      ✅ POST /register (+ rate limiter: 10/ora per IP)');

  // Login - con rate limiter per email
  router.post('/login', loginLimiter, authController.login);
  console.log('      ✅ POST /login (+ rate limiter: 5/15min per email)');

  // Refresh token - nessun rate limiter (già protetto da token validity)
  router.post('/refresh', authController.refreshToken);
  console.log('      ✅ POST /refresh');

  // Password reset request - con rate limiter per email
  router.post('/request-reset-password', resetPasswordRequestLimiter, authController.requestPasswordReset);
  console.log('      ✅ POST /request-reset-password (+ rate limiter: 3/ora per email)');

  // Password reset confirm - nessun rate limiter (già protetto da token)
  router.post('/reset-password', authController.confirmPasswordReset);
  console.log('      ✅ POST /reset-password');

  // ============================================================================
  // ENDPOINT PROTETTI - SELF-SERVICE (solo authenticate)
  // ============================================================================

  console.log('   📝 Registrando endpoint protetti...');

  // Logout - nessun rate limiter necessario
  router.post('/logout', authController.logout);
  console.log('      ✅ POST /logout');

  // Logout all - richiede autenticazione
  router.post('/logout-all', authenticate, authController.logoutAll);
  console.log('      ✅ POST /logout-all (+ authenticate)');

  // Change password - richiede autenticazione
  router.post('/change-password', authenticate, authController.changePassword);
  console.log('      ✅ POST /change-password (+ authenticate)');

  // Get current account - richiede autenticazione
  router.get('/me', authenticate, authController.getCurrentAccount);
  console.log('      ✅ GET /me (+ authenticate)');

  // ============================================================================
  // ENDPOINT PROTETTI - ADMIN ONLY (root)
  // ============================================================================

  console.log('   🔒 Registrando endpoint admin (solo root)...');

  // Lista sessioni attive - solo root
  router.get('/sessions', authenticate, requireRoot(), sessionController.listSessions.bind(sessionController));
  console.log('      ✅ GET /sessions (+ authenticate + requireRoot)');

  // Revoca sessione - solo root
  router.delete('/sessions/:sessionId', authenticate, requireRoot(), sessionController.revokeSession.bind(sessionController));
  console.log('      ✅ DELETE /sessions/:sessionId (+ authenticate + requireRoot)');

  // Blocca / sblocca utente (ADR049): admin e root del tenant di sistema con
  // 'sistema.account'; i limiti (mai account root) sono in SessionController
  const canManageAccounts = [authenticate, requireSystemTenant(tenantModel), requirePermission('sistema', 'account')];

  router.post('/users/:userId/block', ...canManageAccounts, sessionController.blockUser.bind(sessionController));
  console.log('      ✅ POST /users/:userId/block (+ authenticate + tenant di sistema + sistema.account)');

  router.delete('/users/:userId/unblock', ...canManageAccounts, sessionController.unblockUser.bind(sessionController));
  console.log('      ✅ DELETE /users/:userId/unblock (+ authenticate + tenant di sistema + sistema.account)');

  // Lista utenti bloccati - solo root
  router.get('/blocked-users', authenticate, requireRoot(), sessionController.listBlockedUsers.bind(sessionController));
  console.log('      ✅ GET /blocked-users (+ authenticate + requireRoot)');

  // Debug finale
  const routeCount = (router as any).stack.length;
  console.log(`\n   📊 Totale route registrate nel router: ${routeCount}`);
  console.log('   ✅ [AUTH.ROUTES] Router completato\n');

  return router;
};

/**
 * NOTA: Rate Limiting Strategy
 *
 * GENERALE (gestito dal gateway in production):
 *   - Max richieste per IP (es: 100/minuto)
 *   - Protezione DDoS
 *   - Abuse generale
 *
 * SPECIFICO (sempre attivo qui):
 *   - Login attempts per email (anti brute-force)
 *   - Password reset per email (anti spam)
 *   - Registration per IP (anti spam)
 *
 * Questa separazione garantisce:
 *   ✅ Protezione business logic sempre attiva
 *   ✅ Nessuna duplicazione con il gateway
 *   ✅ Funzionamento corretto in standalone mode
 */
